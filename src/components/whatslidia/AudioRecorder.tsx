"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Send, Pause, Play, X, Mic } from "lucide-react";

interface AudioRecorderProps {
  isDarkMode: boolean;
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

type RecordingState = "idle" | "recording" | "paused" | "recorded";

export function AudioRecorder({ isDarkMode, onSend, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Generate initial waveform bars
  useEffect(() => {
    setWaveformData(Array(40).fill(3));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setState("recording");
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Start visualization
      visualize();
      
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
      onCancel();
    }
  }, [onCancel]);

  const visualize = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (state === "recording" || state === "paused") {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      // Take 40 samples from the frequency data
      const samples = 40;
      const step = Math.floor(bufferLength / samples);
      const newWaveformData = [];
      
      for (let i = 0; i < samples; i++) {
        const value = dataArray[i * step];
        // Normalize to 3-32 range
        const normalized = Math.max(3, Math.min(32, (value / 255) * 32));
        newWaveformData.push(normalized);
      }
      
      setWaveformData(newWaveformData);
    };
    
    draw();
  }, [state]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [state]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Resume visualization
      visualize();
    }
  }, [state, visualize]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [state]);

  const handleSend = useCallback(() => {
    if (audioBlob && duration > 0) {
      onSend(audioBlob, duration);
    }
  }, [audioBlob, duration, onSend]);

  const handleCancel = useCallback(() => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onCancel();
  }, [audioUrl, onCancel, stopRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording immediately when component mounts
  useEffect(() => {
    startRecording();
  }, [startRecording]);

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
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          isDarkMode
            ? "text-red-400 hover:bg-red-500/20"
            : "text-red-500 hover:bg-red-100"
        )}
      >
        <Trash2 className="w-5 h-5" />
      </motion.button>

      {/* Recording Info */}
      <div className="flex-1 flex items-center gap-3">
        {/* Recording Indicator */}
        {state === "recording" && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 rounded-full bg-red-500"
          />
        )}
        
        {state === "paused" && (
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
        )}
        
        {state === "recorded" && (
          <div className="w-3 h-3 rounded-full bg-[#00a884]" />
        )}

        {/* Duration */}
        <span
          className={cn(
            "font-mono text-sm font-medium min-w-[40px]",
            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
          )}
        >
          {formatDuration(duration)}
        </span>

        {/* Waveform Visualization */}
        <div className="flex-1 h-8 flex items-center justify-center gap-0.5 overflow-hidden">
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              initial={{ height: 3 }}
              animate={{
                height: state === "recording" ? height : Math.max(3, height * 0.7),
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.005,
              }}
              className={cn(
                "w-1 rounded-full",
                state === "recording"
                  ? "bg-[#00a884]"
                  : state === "paused"
                    ? "bg-yellow-500"
                    : "bg-[#00a884]/70"
              )}
            />
          ))}
        </div>
      </div>

      {/* Pause/Play Button - Only show when recording or paused */}
      {(state === "recording" || state === "paused") && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={state === "recording" ? pauseRecording : resumeRecording}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isDarkMode
              ? "text-[#aebac1] hover:bg-[#2a3942]"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {state === "recording" ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </motion.button>
      )}

      {/* Send Button - Show when recorded or as slide-to-send alternative */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={state === "recorded" ? handleSend : stopRecording}
        disabled={duration < 1}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          duration < 1
            ? isDarkMode
              ? "text-[#8696a0] cursor-not-allowed"
              : "text-gray-400 cursor-not-allowed"
            : "bg-[#00a884] text-white hover:bg-[#00a884]/90"
        )}
      >
        <Send className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
