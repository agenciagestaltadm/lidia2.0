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

type RecordingState = "idle" | "recording" | "paused" | "recorded";

/**
 * AudioRecorder - Fixed version with proper state management
 * 
 * Flow: idle → recording → paused → recording → recorded → send
 */
export function AudioRecorder({ isDarkMode, onSend, onCancel }: AudioRecorderProps) {
  console.log("[AudioRecorder] Component render");

  // State
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([]);

  // Refs for stable references
  const isMountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const waveformHistoryRef = useRef<number[][]>([]);
  const durationRef = useRef(0);

  // Audio analyzer hook
  const {
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
    calibrationDuration: 300,
    emaAlpha: 0.3,
  });

  /**
   * Compile waveform history into final waveform
   */
  const compileWaveformHistory = useCallback((history: number[][]): number[] => {
    if (history.length === 0) {
      return new Array(40).fill(0.1);
    }

    const flatHistory = history.flat();
    const targetBars = 40;

    if (flatHistory.length <= targetBars) {
      const padding = new Array(targetBars - flatHistory.length).fill(0.1);
      return [...flatHistory, ...padding];
    }

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

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    console.log("[AudioRecorder] startRecording called");

    if (!isMountedRef.current) {
      console.log("[AudioRecorder] Component unmounted, aborting");
      return;
    }

    try {
      console.log("[AudioRecorder] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      if (!isMountedRef.current) {
        console.log("[AudioRecorder] Component unmounted after getUserMedia");
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      console.log("[AudioRecorder] Microphone access granted");
      streamRef.current = stream;

      // Initialize audio analyzer
      try {
        console.log("[AudioRecorder] Initializing audio analyzer...");
        await initAnalyzer(stream);
        console.log("[AudioRecorder] Audio analyzer initialized");
      } catch (analyzerError) {
        console.error("[AudioRecorder] Analyzer init failed:", analyzerError);
        // Continue without analyzer
      }

      // Determine MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/wav';
      console.log("[AudioRecorder] Using MIME type:", mimeType);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      waveformHistoryRef.current = [];
      durationRef.current = 0;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("[AudioRecorder] ondataavailable:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("[AudioRecorder] onstop called, chunks:", audioChunksRef.current.length);
        
        if (!isMountedRef.current) {
          console.log("[AudioRecorder] Component unmounted in onstop");
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("[AudioRecorder] Blob created:", blob.size, "bytes, type:", blob.type);

        if (blob.size > 0) {
          setAudioBlob(blob);
          const compiledWaveform = compileWaveformHistory(waveformHistoryRef.current);
          setRecordedWaveform(compiledWaveform);
          setState("recorded");
          console.log("[AudioRecorder] State set to recorded");
        } else {
          console.error("[AudioRecorder] Blob is empty!");
          alert("Erro: Gravação vazia. Tente novamente.");
          onCancel();
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("[AudioRecorder] MediaRecorder error:", event);
        alert("Erro na gravação. Tente novamente.");
        onCancel();
      };

      // Start recording
      console.log("[AudioRecorder] Starting MediaRecorder...");
      mediaRecorder.start(100); // Collect data every 100ms
      console.log("[AudioRecorder] MediaRecorder state:", mediaRecorder.state);

      setState("recording");
      setDuration(0);
      console.log("[AudioRecorder] State set to recording");

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;

        durationRef.current++;
        setDuration(durationRef.current);

        // Store waveform snapshot every second
        if (durationRef.current % 1 === 0) {
          const snapshot = getWaveformSnapshot(40);
          if (snapshot.some(v => v > 0.05)) {
            waveformHistoryRef.current.push(snapshot);
          }
        }
      }, 1000);

      console.log("[AudioRecorder] Recording started successfully");

    } catch (error) {
      console.error("[AudioRecorder] Failed to start recording:", error);
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
      onCancel();
    }
  }, [initAnalyzer, compileWaveformHistory, getWaveformSnapshot, onCancel]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    console.log("[AudioRecorder] pauseRecording called, state:", state);

    if (mediaRecorderRef.current && state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setState("paused");

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        console.log("[AudioRecorder] Recording paused");
      } catch (e) {
        console.error("[AudioRecorder] Error pausing:", e);
      }
    }
  }, [state]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    console.log("[AudioRecorder] resumeRecording called, state:", state);

    if (mediaRecorderRef.current && state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        setState("recording");

        // Resume timer
        timerRef.current = setInterval(() => {
          if (!isMountedRef.current) return;

          durationRef.current++;
          setDuration(durationRef.current);

          if (durationRef.current % 1 === 0) {
            const snapshot = getWaveformSnapshot(40);
            if (snapshot.some(v => v > 0.05)) {
              waveformHistoryRef.current.push(snapshot);
            }
          }
        }, 1000);

        console.log("[AudioRecorder] Recording resumed");
      } catch (e) {
        console.error("[AudioRecorder] Error resuming:", e);
      }
    }
  }, [state, getWaveformSnapshot]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    console.log("[AudioRecorder] stopRecording called, state:", state);

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      console.log("[AudioRecorder] No media recorder");
      return;
    }

    if (state !== "recording" && state !== "paused") {
      console.log("[AudioRecorder] Invalid state for stopping:", state);
      return;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop analyzer
    stopAnalyzer();

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Stop media recorder - this will trigger onstop event
    try {
      console.log("[AudioRecorder] Calling mediaRecorder.stop()");
      mediaRecorder.stop();
    } catch (e) {
      console.error("[AudioRecorder] Error stopping recorder:", e);
    }
  }, [state, stopAnalyzer]);

  /**
   * Send audio
   */
  const handleSend = useCallback(() => {
    console.log("[AudioRecorder] handleSend called");
    console.log("[AudioRecorder] state:", state);
    console.log("[AudioRecorder] audioBlob:", audioBlob ? `${audioBlob.size} bytes` : "null");
    console.log("[AudioRecorder] duration:", duration);

    if (isSending) {
      console.log("[AudioRecorder] Already sending");
      return;
    }

    if (!audioBlob) {
      console.log("[AudioRecorder] No audio blob");
      return;
    }

    if (state !== "recorded") {
      console.log("[AudioRecorder] Invalid state:", state);
      return;
    }

    setIsSending(true);

    const finalWaveform = recordedWaveform.length > 0
      ? recordedWaveform
      : getWaveformSnapshot(40);

    console.log("[AudioRecorder] Sending audio:", {
      blobSize: audioBlob.size,
      duration,
      waveformLength: finalWaveform.length,
    });

    onSend(audioBlob, duration, finalWaveform);
  }, [audioBlob, duration, isSending, onSend, recordedWaveform, getWaveformSnapshot, state]);

  /**
   * Cancel recording
   */
  const handleCancel = useCallback(() => {
    console.log("[AudioRecorder] handleCancel called");

    // Clear timer
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
      } catch {
        // Ignore
      }
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    onCancel();
  }, [stopAnalyzer, onCancel]);

  /**
   * Format duration as MM:SS
   */
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Start recording on mount
  useEffect(() => {
    console.log("[AudioRecorder] useEffect - component mounted");
    isMountedRef.current = true;

    // Start recording after a small delay to ensure component is ready
    const timeoutId = setTimeout(() => {
      startRecording();
    }, 100);

    return () => {
      console.log("[AudioRecorder] useEffect cleanup - component unmounting");
      isMountedRef.current = false;
      clearTimeout(timeoutId);

      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      stopAnalyzer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startRecording, stopAnalyzer]);

  // Determine waveform data to display
  const displayWaveform = state === "recorded" && recordedWaveform.length > 0
    ? recordedWaveform
    : waveformData;

  // Determine waveform variant
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

          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-3 h-3 rounded-full bg-gray-400 shrink-0"
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

        {/* Waveform Visualization */}
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
          disabled={isSending}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isDarkMode
              ? "text-[#aebac1] hover:bg-[#2a3942]"
              : "text-gray-600 hover:bg-gray-100",
            isSending && "opacity-50 cursor-not-allowed"
          )}
        >
          {state === "recording" ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </motion.button>
      )}

      {/* Stop Button */}
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

      {/* Send Button */}
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
