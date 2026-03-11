"use client";

import { useRef, useCallback, useState, useEffect } from "react";

export interface AudioAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  calibrationDuration?: number; // ms for noise floor calibration
  emaAlpha?: number; // Exponential Moving Average factor (0-1)
}

interface AudioAnalyzerState {
  isInitialized: boolean;
  isCalibrating: boolean;
  noiseFloor: number;
  peakLevel: number;
  currentAmplitude: number;
  waveformData: number[];
}

interface AudioAnalyzerReturn extends AudioAnalyzerState {
  init: (stream: MediaStream) => Promise<void>;
  stop: () => void;
  getCurrentAmplitude: () => number;
  getWaveformSnapshot: (barCount?: number) => number[];
}

const DEFAULT_CONFIG: Required<AudioAnalyzerConfig> = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  calibrationDuration: 500,
  emaAlpha: 0.3,
};

/**
 * Hook for real-time audio analysis using Web Audio API
 * Provides amplitude detection, waveform visualization data,
 * automatic calibration, and exponential smoothing.
 */
export function useAudioAnalyzer(
  userConfig: AudioAnalyzerConfig = {}
): AudioAnalyzerReturn {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Audio context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Data refs for performance
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(0));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(0));
  const amplitudeHistoryRef = useRef<number[]>([]);
  const smoothedAmplitudeRef = useRef<number>(0);
  const calibrationDataRef = useRef<number[]>([]);

  // State
  const [state, setState] = useState<AudioAnalyzerState>({
    isInitialized: false,
    isCalibrating: false,
    noiseFloor: 0,
    peakLevel: 1,
    currentAmplitude: 0,
    waveformData: new Array(40).fill(0.1),
  });

  /**
   * Convert frequency data to amplitude (RMS-like calculation)
   */
  const calculateAmplitude = useCallback((frequencyData: Uint8Array): number => {
    // Use a subset of frequencies that correspond to voice (85Hz - 255Hz roughly)
    // For fftSize=256 at 48kHz, each bin is ~188Hz, so bins 0-1 cover voice fundamentals
    const voiceBins = frequencyData.slice(0, Math.floor(frequencyData.length * 0.3));

    let sum = 0;
    for (let i = 0; i < voiceBins.length; i++) {
      sum += voiceBins[i] * voiceBins[i];
    }

    const rms = Math.sqrt(sum / voiceBins.length);
    // Normalize to 0-1 range
    return rms / 255;
  }, []);

  /**
   * Apply exponential moving average smoothing
   */
  const smoothAmplitude = useCallback(
    (newValue: number): number => {
      const { emaAlpha } = config;
      smoothedAmplitudeRef.current =
        emaAlpha * newValue + (1 - emaAlpha) * smoothedAmplitudeRef.current;
      return smoothedAmplitudeRef.current;
    },
    [config]
  );

  /**
   * Generate waveform data for visualization
   */
  const generateWaveformData = useCallback(
    (frequencyData: Uint8Array, barCount: number = 40): number[] => {
      const bars: number[] = [];
      const binsPerBar = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const startBin = i * binsPerBar;
        const endBin = Math.min(startBin + binsPerBar, frequencyData.length);

        for (let j = startBin; j < endBin; j++) {
          sum += frequencyData[j];
        }

        const average = sum / (endBin - startBin);
        // Normalize and apply non-linear scaling for better visual dynamics
        const normalized = average / 255;
        const enhanced = Math.pow(normalized, 0.7); // Slight boost to lower values
        bars.push(Math.max(0.05, Math.min(1, enhanced)));
      }

      return bars;
    },
    []
  );

  // Use ref to store analyze function to avoid circular dependency
  const analyzeRef = useRef<(() => void) | null>(null);

  /**
   * Main analysis loop
   */
  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const frequencyData = frequencyDataRef.current;
    const timeData = timeDataRef.current;
    if (frequencyData.length === 0 || timeData.length === 0) return;

    // Get frequency data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyser.getByteFrequencyData(frequencyData as any);

    // Calculate raw amplitude
    const rawAmplitude = calculateAmplitude(frequencyData);

    // Apply smoothing
    const smoothedAmplitude = smoothAmplitude(rawAmplitude);

    // Generate waveform visualization data
    const newWaveformData = generateWaveformData(frequencyData, 40);

    // Store in history
    amplitudeHistoryRef.current.push(smoothedAmplitude);
    if (amplitudeHistoryRef.current.length > 600) {
      // Keep last 30 seconds at 20fps
      amplitudeHistoryRef.current.shift();
    }

    // Update state (throttled to every 2 frames for performance)
    setState((prev) => ({
      ...prev,
      currentAmplitude: smoothedAmplitude,
      waveformData: newWaveformData,
    }));

    // Continue loop using ref to avoid circular dependency
    animationFrameRef.current = requestAnimationFrame(() => {
      analyzeRef.current?.();
    });
  }, [calculateAmplitude, smoothAmplitude, generateWaveformData]);

  // Update ref when analyze changes
  useEffect(() => {
    analyzeRef.current = analyze;
  }, [analyze]);

  /**
   * Calibrate noise floor by measuring ambient sound
   */
  const calibrate = useCallback(async (): Promise<void> => {
    const { calibrationDuration } = config;
    const startTime = Date.now();
    calibrationDataRef.current = [];

    setState((prev) => ({ ...prev, isCalibrating: true }));

    // Collect samples during calibration period
    const collectSamples = () => {
      const analyser = analyserRef.current;
      const frequencyData = frequencyDataRef.current;
      if (!analyser || frequencyData.length === 0) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analyser.getByteFrequencyData(frequencyData as any);
      const amplitude = calculateAmplitude(frequencyData);
      calibrationDataRef.current.push(amplitude);

      if (Date.now() - startTime < calibrationDuration) {
        requestAnimationFrame(collectSamples);
      } else {
        // Calculate noise floor (95th percentile of lowest samples)
        const sorted = [...calibrationDataRef.current].sort((a, b) => a - b);
        const noiseFloor = sorted[Math.floor(sorted.length * 0.95)] || 0.01;

        // Calculate peak level (95th percentile of highest samples)
        const peakLevel = sorted[Math.floor(sorted.length * 0.95)] || 1;

        setState((prev) => ({
          ...prev,
          isCalibrating: false,
          noiseFloor,
          peakLevel: Math.max(peakLevel, noiseFloor + 0.1),
        }));
      }
    };

    collectSamples();
  }, [config, calculateAmplitude]);

  /**
   * Initialize analyzer with a media stream
   */
  const init = useCallback(
    async (stream: MediaStream): Promise<void> => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = config.fftSize;
        analyser.smoothingTimeConstant = config.smoothingTimeConstant;
        analyser.minDecibels = config.minDecibels;
        analyser.maxDecibels = config.maxDecibels;
        analyserRef.current = analyser;

        // Create source from stream
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        // Initialize data arrays
        const bufferLength = analyser.frequencyBinCount;
        frequencyDataRef.current = new Uint8Array(bufferLength);
        timeDataRef.current = new Uint8Array(bufferLength);

        // Reset state
        amplitudeHistoryRef.current = [];
        smoothedAmplitudeRef.current = 0;

        setState((prev) => ({
          ...prev,
          isInitialized: true,
        }));

        // Start calibration
        await calibrate();

        // Start analysis loop
        analyze();
      } catch (error) {
        console.error("Failed to initialize audio analyzer:", error);
        throw error;
      }
    },
    [config, calibrate, analyze]
  );

  /**
   * Stop analysis and cleanup
   */
  const stop = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect and cleanup
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Ignore disconnection errors
      }
      sourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    setState({
      isInitialized: false,
      isCalibrating: false,
      noiseFloor: 0,
      peakLevel: 1,
      currentAmplitude: 0,
      waveformData: new Array(40).fill(0.1),
    });
  }, []);

  /**
   * Get normalized current amplitude (0-1, calibrated)
   */
  const getCurrentAmplitude = useCallback((): number => {
    const { currentAmplitude, noiseFloor, peakLevel } = state;

    if (peakLevel <= noiseFloor) return 0;

    // Normalize against calibrated range
    const normalized =
      (currentAmplitude - noiseFloor) / (peakLevel - noiseFloor);
    return Math.max(0, Math.min(1, normalized));
  }, [state]);

  /**
   * Get a snapshot of waveform data for storage
   */
  const getWaveformSnapshot = useCallback(
    (barCount: number = 40): number[] => {
      const { waveformData, noiseFloor, peakLevel } = state;

      // Normalize against calibrated range
      if (peakLevel <= noiseFloor) {
        return new Array(barCount).fill(0.1);
      }

      return waveformData.map((value) => {
        const normalized = (value - noiseFloor) / (peakLevel - noiseFloor);
        return Math.max(0.05, Math.min(1, normalized));
      });
    },
    [state]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    init,
    stop,
    getCurrentAmplitude,
    getWaveformSnapshot,
  };
}

export default useAudioAnalyzer;
