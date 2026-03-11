"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";

export interface AudioAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  calibrationDuration?: number;
  emaAlpha?: number;
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
 * Fixed version with proper memoization and stable references
 */
export function useAudioAnalyzer(
  userConfig: AudioAnalyzerConfig = {}
): AudioAnalyzerReturn {
  // Memoize config to prevent recreation
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      userConfig.fftSize,
      userConfig.smoothingTimeConstant,
      userConfig.minDecibels,
      userConfig.maxDecibels,
      userConfig.calibrationDuration,
      userConfig.emaAlpha,
    ]
  );

  // Audio context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Data refs
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(0));
  const smoothedAmplitudeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // State
  const [state, setState] = useState<AudioAnalyzerState>({
    isInitialized: false,
    isCalibrating: false,
    noiseFloor: 0,
    peakLevel: 1,
    currentAmplitude: 0,
    waveformData: new Array(40).fill(0.1),
  });

  // Use ref for state access in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Generate waveform data from frequency data
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
        const normalized = average / 255;
        const enhanced = Math.pow(normalized, 0.7);
        bars.push(Math.max(0.05, Math.min(1, enhanced)));
      }

      return bars;
    },
    []
  );

  /**
   * Main analysis loop - defined as a stable function
   */
  const runAnalysisLoop = useCallback(() => {
    if (!isRunningRef.current) {
      console.log("[AudioAnalyzer] Loop stopped");
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) {
      console.log("[AudioAnalyzer] No analyser, stopping loop");
      return;
    }

    const frequencyData = frequencyDataRef.current;
    if (frequencyData.length === 0) {
      console.log("[AudioAnalyzer] No frequency data, skipping frame");
      animationFrameRef.current = requestAnimationFrame(runAnalysisLoop);
      return;
    }

    // Get frequency data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyser.getByteFrequencyData(frequencyData as any);

    // Calculate amplitude (RMS of first 30% of frequency bins - voice range)
    const voiceBins = frequencyData.slice(0, Math.floor(frequencyData.length * 0.3));
    let sum = 0;
    for (let i = 0; i < voiceBins.length; i++) {
      sum += voiceBins[i] * voiceBins[i];
    }
    const rms = Math.sqrt(sum / voiceBins.length);
    const rawAmplitude = rms / 255;

    // Apply EMA smoothing
    const smoothedAmplitude =
      config.emaAlpha * rawAmplitude +
      (1 - config.emaAlpha) * smoothedAmplitudeRef.current;
    smoothedAmplitudeRef.current = smoothedAmplitude;

    // Generate waveform
    const waveformData = generateWaveformData(frequencyData, 40);

    // Update state
    setState((prev) => ({
      ...prev,
      currentAmplitude: smoothedAmplitude,
      waveformData,
    }));

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(runAnalysisLoop);
  }, [config.emaAlpha, generateWaveformData]);

  /**
   * Initialize analyzer with a media stream
   */
  const init = useCallback(
    async (stream: MediaStream): Promise<void> => {
      console.log("[AudioAnalyzer] Initializing...");

      try {
        // Create audio context
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;
        console.log("[AudioAnalyzer] AudioContext created, state:", audioContext.state);

        // Resume if suspended (autoplay policy)
        if (audioContext.state === "suspended") {
          console.log("[AudioAnalyzer] Resuming suspended AudioContext...");
          await audioContext.resume();
          console.log("[AudioAnalyzer] AudioContext resumed, state:", audioContext.state);
        }

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = config.fftSize;
        analyser.smoothingTimeConstant = config.smoothingTimeConstant;
        analyser.minDecibels = config.minDecibels;
        analyser.maxDecibels = config.maxDecibels;
        analyserRef.current = analyser;
        console.log("[AudioAnalyzer] Analyser created, fftSize:", config.fftSize);

        // Create source from stream
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
        console.log("[AudioAnalyzer] Source connected to analyser");

        // Initialize data arrays
        const bufferLength = analyser.frequencyBinCount;
        frequencyDataRef.current = new Uint8Array(bufferLength);
        console.log("[AudioAnalyzer] Frequency data buffer size:", bufferLength);

        // Reset state
        smoothedAmplitudeRef.current = 0;

        // Mark as initialized
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isCalibrating: true,
        }));

        console.log("[AudioAnalyzer] Starting calibration...");

        // Run calibration
        const calibrationSamples: number[] = [];
        const startTime = Date.now();

        const collectCalibrationSamples = () => {
          if (Date.now() - startTime < config.calibrationDuration) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            analyser.getByteFrequencyData(frequencyDataRef.current as any);
            const voiceBins = frequencyDataRef.current.slice(
              0,
              Math.floor(frequencyDataRef.current.length * 0.3)
            );
            let sum = 0;
            for (let i = 0; i < voiceBins.length; i++) {
              sum += voiceBins[i] * voiceBins[i];
            }
            const rms = Math.sqrt(sum / voiceBins.length);
            calibrationSamples.push(rms / 255);
            requestAnimationFrame(collectCalibrationSamples);
          } else {
            // Calculate noise floor and peak
            const sorted = [...calibrationSamples].sort((a, b) => a - b);
            const noiseFloor = sorted[Math.floor(sorted.length * 0.95)] || 0.01;
            const peakLevel = Math.max(sorted[Math.floor(sorted.length * 0.95)] || 0.5, noiseFloor + 0.1);

            console.log("[AudioAnalyzer] Calibration complete:", {
              samples: calibrationSamples.length,
              noiseFloor,
              peakLevel,
            });

            setState((prev) => ({
              ...prev,
              isCalibrating: false,
              noiseFloor,
              peakLevel,
            }));

            // Start analysis loop
            console.log("[AudioAnalyzer] Starting analysis loop...");
            isRunningRef.current = true;
            runAnalysisLoop();
          }
        };

        collectCalibrationSamples();

        console.log("[AudioAnalyzer] Initialization complete");
      } catch (error) {
        console.error("[AudioAnalyzer] Initialization failed:", error);
        throw error;
      }
    },
    [config, runAnalysisLoop]
  );

  /**
   * Stop analysis and cleanup
   */
  const stop = useCallback(() => {
    console.log("[AudioAnalyzer] Stopping...");

    // Stop loop
    isRunningRef.current = false;

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect source
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Ignore
      }
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // Reset state
    setState({
      isInitialized: false,
      isCalibrating: false,
      noiseFloor: 0,
      peakLevel: 1,
      currentAmplitude: 0,
      waveformData: new Array(40).fill(0.1),
    });

    console.log("[AudioAnalyzer] Stopped");
  }, []);

  /**
   * Get normalized current amplitude
   */
  const getCurrentAmplitude = useCallback((): number => {
    const { currentAmplitude, noiseFloor, peakLevel } = stateRef.current;
    if (peakLevel <= noiseFloor) return 0;
    const normalized = (currentAmplitude - noiseFloor) / (peakLevel - noiseFloor);
    return Math.max(0, Math.min(1, normalized));
  }, []);

  /**
   * Get a snapshot of waveform data
   */
  const getWaveformSnapshot = useCallback((barCount: number = 40): number[] => {
    const { waveformData, noiseFloor, peakLevel } = stateRef.current;
    if (peakLevel <= noiseFloor) {
      return new Array(barCount).fill(0.1);
    }
    return waveformData.map((value) => {
      const normalized = (value - noiseFloor) / (peakLevel - noiseFloor);
      return Math.max(0.05, Math.min(1, normalized));
    });
  }, []);

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
