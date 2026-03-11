"use client";

/**
 * Audio Analysis Utilities
 * 
 * Functions for extracting waveform data from audio buffers and blobs.
 * Used for reconstructing waveform visualizations during playback.
 */

export interface WaveformExtractionOptions {
  /** Number of bars in the waveform (default: 40) */
  barCount?: number;
  /** Sample rate for analysis (default: 20fps equivalent) */
  samplesPerSecond?: number;
  /** Apply smoothing to the output (default: true) */
  smooth?: boolean;
  /** Smoothing window size (default: 3) */
  smoothingWindow?: number;
}

const DEFAULT_OPTIONS: Required<WaveformExtractionOptions> = {
  barCount: 40,
  samplesPerSecond: 20,
  smooth: true,
  smoothingWindow: 3,
};

/**
 * Extract waveform data from an AudioBuffer
 * 
 * Analyzes the audio data to create amplitude values for visualization.
 * Uses RMS (Root Mean Square) calculation for accurate amplitude representation.
 */
export async function extractWaveformFromBuffer(
  audioBuffer: AudioBuffer,
  options: WaveformExtractionOptions = {}
): Promise<number[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { barCount, samplesPerSecond, smooth, smoothingWindow } = opts;

  // Get audio data from first channel (mono analysis is sufficient for waveform)
  const channelData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;
  // sampleRate available via audioBuffer.sampleRate if needed for future features

  // Calculate samples per waveform bar
  const totalSamples = Math.floor(duration * samplesPerSecond);
  const samplesPerBar = Math.floor(channelData.length / totalSamples);

  const waveform: number[] = [];

  // Extract amplitude for each time segment
  for (let i = 0; i < totalSamples; i++) {
    const startSample = i * samplesPerBar;
    const endSample = Math.min(startSample + samplesPerBar, channelData.length);

    // Calculate RMS (Root Mean Square) for this segment
    let sum = 0;
    for (let j = startSample; j < endSample; j++) {
      sum += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sum / (endSample - startSample));

    // Normalize to 0-1 range (audio data is -1 to 1, so RMS is 0 to 1)
    // Apply slight boost to lower values for better visual dynamics
    const normalized = Math.pow(rms, 0.7);
    waveform.push(Math.max(0.05, Math.min(1, normalized)));
  }

  // Downsample to requested bar count
  const downsampled = downsampleArray(waveform, barCount);

  // Apply smoothing if requested
  if (smooth) {
    return smoothArray(downsampled, smoothingWindow);
  }

  return downsampled;
}

/**
 * Extract waveform data from an audio Blob/URL
 * 
 * Decodes the audio file and extracts waveform data.
 * Uses OfflineAudioContext for processing without playback.
 */
export async function extractWaveformFromBlob(
  blob: Blob,
  options: WaveformExtractionOptions = {}
): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();
  return extractWaveformFromArrayBuffer(arrayBuffer, options);
}

/**
 * Extract waveform data from an ArrayBuffer
 */
export async function extractWaveformFromArrayBuffer(
  arrayBuffer: ArrayBuffer,
  options: WaveformExtractionOptions = {}
): Promise<number[]> {
  // Create offline audio context for decoding
  const offlineContext = new (window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext)(
    1, // mono
    1, // minimal length, will be determined by decode
    44100 // standard sample rate
  );

  try {
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
    return extractWaveformFromBuffer(audioBuffer, options);
  } catch (error) {
    console.error("Failed to decode audio data:", error);
    // Return default waveform on error
    return new Array(options.barCount || 40).fill(0.1);
  }
}

/**
 * Extract waveform data from a URL
 */
export async function extractWaveformFromUrl(
  url: string,
  options: WaveformExtractionOptions = {}
): Promise<number[]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return extractWaveformFromArrayBuffer(arrayBuffer, options);
}

/**
 * Downsample an array to a target length
 * Uses averaging for down sampling
 */
function downsampleArray(array: number[], targetLength: number): number[] {
  if (array.length <= targetLength) {
    return [...array];
  }

  const result: number[] = [];
  const step = array.length / targetLength;

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += array[j];
    }
    result.push(sum / (end - start));
  }

  return result;
}

/**
 * Apply moving average smoothing to an array
 */
function smoothArray(array: number[], windowSize: number): number[] {
  if (windowSize <= 1) return array;

  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < array.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const index = i + j;
      if (index >= 0 && index < array.length) {
        sum += array[index];
        count++;
      }
    }

    result.push(sum / count);
  }

  return result;
}

/**
 * Normalize waveform data to a specific range
 */
export function normalizeWaveform(
  data: number[],
  minOutput: number = 0.05,
  maxOutput: number = 1
): number[] {
  const min = Math.min(...data);
  const max = Math.max(...data);

  if (max === min) {
    return data.map(() => (minOutput + maxOutput) / 2);
  }

  const range = max - min;
  const outputRange = maxOutput - minOutput;

  return data.map((value) => {
    const normalized = (value - min) / range;
    return minOutput + normalized * outputRange;
  });
}

/**
 * Apply exponential smoothing to waveform data
 */
export function applyExponentialSmoothing(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];

  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }

  return result;
}

/**
 * Compress dynamic range of waveform (useful for very quiet or loud audio)
 */
export function compressDynamicRange(
  data: number[],
  threshold: number = 0.5,
  ratio: number = 4
): number[] {
  return data.map((value) => {
    if (value <= threshold) {
      return value;
    }
    const excess = value - threshold;
    const compressed = excess / ratio;
    return threshold + compressed;
  });
}

/**
 * Generate a default/placeholder waveform
 */
export function generateDefaultWaveform(barCount: number = 40): number[] {
  return new Array(barCount).fill(0.1).map((base, i) => {
    // Create a slight variation for visual interest
    const variation = Math.sin((i / barCount) * Math.PI) * 0.3;
    return Math.max(0.05, base + variation);
  });
}

/**
 * Calculate duration from waveform data and sample rate
 */
export function calculateDurationFromWaveform(
  waveformLength: number,
  samplesPerSecond: number = 20
): number {
  return waveformLength / samplesPerSecond;
}

/**
 * Merge multiple waveform segments (for pausable recording)
 */
export function mergeWaveformSegments(segments: number[][]): number[] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return segments[0];

  // Concatenate all segments
  return segments.reduce((acc, segment) => [...acc, ...segment], []);
}
