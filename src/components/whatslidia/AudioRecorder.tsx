"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Send, Pause, Play } from "lucide-react";

interface AudioRecorderProps {
  isDarkMode: boolean;
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

type RecordingState = "recording" | "paused" | "recorded";

// Generate random waveform bars for visual feedback
const generateWaveformData = () => {
  return Array.from({ length: 40 }, () => Math.random() * 20 + 3);
};

export function AudioRecorder({ isDarkMode, onSend, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("recording");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(generateWaveformData());
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start recording on mount
  useEffect(() => {
    let isMounted = true;
    
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        // Set up media recorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          if (!isMounted) return;
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          setAudioBlob(blob);
          setState("recorded");
        };
        
        mediaRecorder.onerror = (e) => {
          console.error("MediaRecorder error:", e);
          onCancel();
        };
        
        // Start recording
        mediaRecorder.start(100);
        setState("recording");
        setDuration(0);
        
        // Start timer
        timerRef.current = setInterval(() => {
          if (isMounted) {
            setDuration(prev => prev + 1);
          }
        }, 1000);
        
        // Start waveform animation
        waveformIntervalRef.current = setInterval(() => {
          if (isMounted) {
            setWaveformData(generateWaveformData());
          }
        }, 100);
        
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
  }, [onCancel, cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setState("paused");
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (waveformIntervalRef.current) {
          clearInterval(waveformIntervalRef.current);
          waveformIntervalRef.current = null;
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
          setDuration(prev => prev + 1);
        }, 1000);
        
        // Resume waveform animation
        waveformIntervalRef.current = setInterval(() => {
          setWaveformData(generateWaveformData());
        }, 100);
      } catch (e) {
        console.error("Error resuming:", e);
      }
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping:", e);
      }
    }
    
    cleanup();
  }, [state, cleanup]);

  const handleSend = useCallback(() => {
    if (isSending || !audioBlob || duration < 1) return;
    
    setIsSending(true);
    onSend(audioBlob, duration);
    
    // Don't call cleanup here as the component will unmount
  }, [audioBlob, duration, isSending, onSend]);

  const handleCancel = useCallback(() => {
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

        {/* Waveform Visualization */}
        <div className="flex-1 h-8 flex items-center justify-center gap-[2px] overflow-hidden px-2">
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              animate={{
                height: state === "recording" ? [3, height, 3] : 3,
              }}
              transition={{
                duration: 0.3,
                repeat: state === "recording" ? Infinity : 0,
                repeatType: "reverse",
                delay: index * 0.01,
              }}
              className={cn(
                "w-[3px] rounded-full",
                state === "recording"
                  ? "bg-[#00a884]"
                  : state === "paused"
                    ? "bg-yellow-500"
                    : "bg-[#00a884]/70"
              )}
              style={{ minHeight: 3 }}
            />
          ))}
        </div>
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

      {/* Stop Button (only when recording or paused) */}
      {(state === "recording" || state === "paused") && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          disabled={isSending || duration < 1}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            duration < 1
              ? isDarkMode
                ? "text-[#8696a0] cursor-not-allowed"
                : "text-gray-400 cursor-not-allowed"
              : "bg-[#00a884] text-white hover:bg-[#00a884]/90"
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
