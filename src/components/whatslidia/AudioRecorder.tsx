"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Send, Pause, Play } from "lucide-react";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";

interface AudioRecorderProps {
  isDarkMode: boolean;
  onSend: (audioBlob: Blob, duration: number, waveformData: number[]) => void;
  onCancel: () => void;
}

type RecordingState = "recording" | "paused" | "recorded";

/**
 * AudioRecorder - Real-time audio recording with waveform visualization
 * 
 * Features:
 * - Real-time waveform visualization using AnalyserNode
 * - Automatic sensitivity calibration
 * - Exponential smoothing to prevent flickering
 * - Stores actual amplitude data for playback visualization
 * - Low latency (< 50ms) audio-to-visual response
 */
export function AudioRecorder({ isDarkMode, onSend, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("recording");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Store recorded waveform data
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([]);
  const waveformHistoryRef = useRef<number[][]>([]);

  // Media recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compile waveform history segments into final waveform - defined early to avoid hoisting issues
  const compileWaveformHistory = useCallback((history: number[][]): number[] => {
    if (history.length === 0) {
      return new Array(40).fill(0.1);
    }

    // Flatten history and downsample to target bar count
    const flatHistory = history.flat();
    const targetBars = 40;
    
    if (flatHistory.length <= targetBars) {
      // Pad with minimum values if not enough data
      const padding = new Array(targetBars - flatHistory.length).fill(0.1);
      return [...flatHistory, ...padding];
    }

    // Downsample by averaging
    const result: number[] = [];
    const step = flatHistory.length / targetBars;
    
    for (let i = 0; i < targetBars; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += flatHistory[j];
      }
      result.push(sum / (end - start));
    }

    return result;
  }, []);

  // Audio analyzer hook with optimized settings for low latency
  const {
    isInitialized,
    isCalibrating,
    waveformData,
    init: initAnalyzer,
    stop: stopAnalyzer,
    getWaveformSnapshot,
  } = useAudioAnalyzer({
    fftSize: 256,
    smoothingTimeConstant: 0.7,
    minDecibels: -90,
    maxDecibels: -10,
    calibrationDuration: 500,
    emaAlpha: 0.3,
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop analyzer
    stopAnalyzer();

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [stopAnalyzer]);

  // Start recording on mount
  useEffect(() => {
    let isMounted = true;
    
    const startRecording = async () => {
      try {
        console.log("[AudioRecorder] Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          }
        });
        
        console.log("[AudioRecorder] Microphone access granted");
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        // Initialize audio analyzer for real-time visualization
        try {
          console.log("[AudioRecorder] Initializing audio analyzer...");
          await initAnalyzer(stream);
          console.log("[AudioRecorder] Audio analyzer initialized successfully");
        } catch (analyzerError) {
          console.error("[AudioRecorder] Failed to initialize analyzer:", analyzerError);
          // Continue without analyzer - recording should still work
        }
        
        // Set up media recorder
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        console.log("[AudioRecorder] Using MIME type:", mimeType);
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        waveformHistoryRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          console.log("[AudioRecorder] Data available:", event.data.size, "bytes");
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          console.log("[AudioRecorder] Recording stopped, chunks:", audioChunksRef.current.length);
          if (!isMounted) return;
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          console.log("[AudioRecorder] Blob created:", blob.size, "bytes");
          setAudioBlob(blob);
          
          // Compile waveform history into final waveform
          const compiledWaveform = compileWaveformHistory(waveformHistoryRef.current);
          setRecordedWaveform(compiledWaveform);
          
          setState("recorded");
        };
        
        mediaRecorder.onerror = (_error) => {
          console.error("[AudioRecorder] MediaRecorder error:", _error);
          onCancel();
        };
        
        // Start recording
        console.log("[AudioRecorder] Starting recording...");
        mediaRecorder.start(100);
        setState("recording");
        setDuration(0);
        
        // Start timer for duration
        timerRef.current = setInterval(() => {
          if (isMounted) {
            setDuration(prev => {
              const newDuration = prev + 1;
              // Store waveform snapshot every second
              if (newDuration % 1 === 0) {
                const snapshot = getWaveformSnapshot(40);
                if (snapshot.some(v => v > 0.05)) {
                  waveformHistoryRef.current.push(snapshot);
                }
              }
              return newDuration;
            });
          }
        }, 1000);
        
      } catch (error) {
        console.error("Error starting recording:", error);
        alert("Não foi possível acessar o microfone. Verifique as permissões.");
        onCancel();
      }
    };
    
    startRecording();
    
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [onCancel, cleanup, initAnalyzer, getWaveformSnapshot, compileWaveformHistory]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setState("paused");
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (e) {
        console.error("Error pausing:", e);
      }
    }
  }, [state]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        setState("recording");
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setDuration(prev => {
            const newDuration = prev + 1;
            // Store waveform snapshot every second
            if (newDuration % 1 === 0) {
              const snapshot = getWaveformSnapshot(40);
              if (snapshot.some(v => v > 0.05)) {
                waveformHistoryRef.current.push(snapshot);
              }
            }
            return newDuration;
          });
        }, 1000);
      } catch (e) {
        console.error("Error resuming:", e);
      }
    }
  }, [state, getWaveformSnapshot]);

  const stopRecording = useCallback(() => {
    console.log("[AudioRecorder] Stop recording requested, state:", state);
    
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      try {
        console.log("[AudioRecorder] Stopping media recorder...");
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("[AudioRecorder] Error stopping recorder:", e);
      }
    }
    
    // Clear timer
    if (timerRef.current) {
      console.log("[AudioRecorder] Clearing timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop all tracks to release microphone
    if (streamRef.current) {
      console.log("[AudioRecorder] Stopping all tracks");
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Stop analyzer
    stopAnalyzer();
  }, [state, stopAnalyzer]);

  const handleSend = useCallback(() => {
    console.log("[AudioRecorder] Handle send called, state:", state, "audioBlob:", !!audioBlob, "duration:", duration);
    
    if (isSending || !audioBlob || state !== "recorded") {
      console.log("[AudioRecorder] Cannot send - invalid state");
      return;
    }
    
    setIsSending(true);
    
    // Use recorded waveform or extract from current data
    const finalWaveform = recordedWaveform.length > 0 
      ? recordedWaveform 
      : getWaveformSnapshot(40);
    
    console.log("[AudioRecorder] Sending audio with waveform length:", finalWaveform.length);
    onSend(audioBlob, duration, finalWaveform);
  }, [audioBlob, duration, isSending, onSend, recordedWaveform, getWaveformSnapshot, state]);

  const handleCancel = useCallback(() => {
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine which waveform data to display
  const displayWaveform = state === "recorded" && recordedWaveform.length > 0
    ? recordedWaveform
    : waveformData;

  // Determine variant based on state
  const waveformVariant = state === "recording" 
    ? "recording" 
    : state === "paused" 
      ? "paused" 
      : "inactive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "h-16 px-4 flex items-center gap-3 border-t",
        isDarkMode
          ? "bg-[#1f2c33] border-[#2a2a2a]"
          : "bg-white border-gray-200"
      )}
    >
      {/* Delete/Cancel Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleCancel}
        disabled={isSending}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          isDarkMode
            ? "text-red-400 hover:bg-red-500/20"
            : "text-red-500 hover:bg-red-100",
          isSending && "opacity-50 cursor-not-allowed"
        )}
      >
        <Trash2 className="w-5 h-5" />
      </motion.button>

      {/* Recording Info */}
      <div className="flex-1 flex items-center gap-3">
        {/* Recording Indicator */}
        <AnimatePresence mode="wait">
          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              exit={{ scale: 0 }}
              transition={{ 
                scale: { repeat: Infinity, duration: 1 },
                opacity: { repeat: Infinity, duration: 1 }
              }}
              className="w-3 h-3 rounded-full bg-red-500 shrink-0"
            />
          )}
          
          {state === "paused" && (
            <motion.div
              key="paused"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-3 h-3 rounded-full bg-yellow-500 shrink-0"
            />
          )}
          
          {state === "recorded" && (
            <motion.div
              key="recorded"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-3 h-3 rounded-full bg-[#00a884] shrink-0"
            />
          )}
        </AnimatePresence>

        {/* Duration */}
        <span
          className={cn(
            "font-mono text-sm font-medium min-w-[40px] tabular-nums",
            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
          )}
        >
          {formatDuration(duration)}
        </span>

        {/* Waveform Visualization - Real-time from AnalyserNode */}
        <div className="flex-1 px-2">
          <WaveformVisualizer
            data={displayWaveform}
            variant={waveformVariant}
            animated={state === "recording"}
            height={32}
            barWidth={3}
            barGap={2}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Calibration indicator */}
        {isCalibrating && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-xs whitespace-nowrap",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}
          >
            Calibrando...
          </motion.span>
        )}
      </div>

      {/* Pause/Play Button */}
      {(state === "recording" || state === "paused") && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={state === "recording" ? pauseRecording : resumeRecording}
          disabled={isSending || !isInitialized}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isDarkMode
              ? "text-[#aebac1] hover:bg-[#2a3942]"
              : "text-gray-600 hover:bg-gray-100",
            (isSending || !isInitialized) && "opacity-50 cursor-not-allowed"
          )}
        >
          {state === "recording" ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </motion.button>
      )}

      {/* Stop Button (only when recording or paused) */}
      {(state === "recording" || state === "paused") && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          disabled={isSending}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[#00a884] text-white hover:bg-[#00a884]/90",
            isSending && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="w-3 h-3 bg-white rounded-sm" />
        </motion.button>
      )}

      {/* Send Button (only when recorded) */}
      {state === "recorded" && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={isSending || !audioBlob}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isSending || !audioBlob
              ? isDarkMode
                ? "text-[#8696a0] cursor-not-allowed"
                : "text-gray-400 cursor-not-allowed"
              : "bg-[#00a884] text-white hover:bg-[#00a884]/90"
          )}
        >
          {isSending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
