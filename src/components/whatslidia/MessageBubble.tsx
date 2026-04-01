"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { Check, CheckCheck, Clock, AlertCircle, File, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { extractWaveformFromBlob, generateDefaultWaveform } from "@/lib/audio-analysis";
import { MessageStatusIcon } from "./PresenceIndicator";

// Audio Player Component with real waveform visualization
function AudioPlayer({ message, isDarkMode }: { message: Message; isDarkMode: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  // Create audio URL from blob
  useEffect(() => {
    if (message.metadata?.audioBlob) {
      const url = URL.createObjectURL(message.metadata.audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [message.metadata?.audioBlob]);

  // Load waveform data - use stored data or extract from blob
  useEffect(() => {
    const loadWaveform = async () => {
      // First priority: use stored waveform data from recording
      if (message.metadata?.waveformData && message.metadata.waveformData.length > 0) {
        setWaveformData(message.metadata.waveformData);
        return;
      }

      // Second priority: extract from blob if available
      if (message.metadata?.audioBlob) {
        setIsLoadingWaveform(true);
        try {
          const extractedWaveform = await extractWaveformFromBlob(
            message.metadata.audioBlob,
            { barCount: 30, samplesPerSecond: 20 }
          );
          setWaveformData(extractedWaveform);
        } catch (error) {
          console.error("Failed to extract waveform:", error);
          setWaveformData(generateDefaultWaveform(30));
        } finally {
          setIsLoadingWaveform(false);
        }
      } else {
        // Fallback: default waveform
        setWaveformData(generateDefaultWaveform(30));
      }
    };

    loadWaveform();
  }, [message.metadata?.waveformData, message.metadata?.audioBlob]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        // Auto-play blocked or error
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const duration = message.metadata?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[300px]">
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors shrink-0",
          isDarkMode
            ? "bg-[#00a884] hover:bg-[#00a884]/90"
            : "bg-[#00a884] hover:bg-[#00a884]/90"
        )}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform visualization with real data */}
        <div className="h-6 flex items-center overflow-hidden">
          {isLoadingWaveform ? (
            <div className="flex items-center gap-[2px] h-full">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full animate-pulse",
                    isDarkMode ? "bg-[#374045]" : "bg-gray-300"
                  )}
                  style={{ height: "30%", animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          ) : (
            <WaveformVisualizer
              data={waveformData}
              progress={progress}
              isPlaying={isPlaying}
              variant={isPlaying ? "playback" : "inactive"}
              height={24}
              barWidth={3}
              barGap={2}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
        
        {/* Progress slider */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className={cn(
            "w-full h-1 rounded-lg appearance-none cursor-pointer",
            isDarkMode ? "bg-[#374045]" : "bg-gray-200"
          )}
          style={{
            background: `linear-gradient(to right, #00a884 ${progress}%, ${isDarkMode ? '#374045' : '#e5e7eb'} ${progress}%)`
          }}
        />
      </div>

      {/* Duration */}
      <span className={cn(
        "text-xs tabular-nums shrink-0",
        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
      )}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isDarkMode?: boolean;
}

export function MessageBubble({
  message,
  isFirstInGroup = false,
  isLastInGroup = false,
  isDarkMode = true,
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    if (!message.isFromMe) return null;

    switch (message.status) {
      case "sent":
        return <MessageStatusIcon status="sent" isDarkMode={isDarkMode} size="sm" />;
      case "delivered":
        return <MessageStatusIcon status="delivered" isDarkMode={isDarkMode} size="sm" />;
      case "read":
        return <MessageStatusIcon status="read" isDarkMode={isDarkMode} size="sm" />;
      case "failed":
        return <MessageStatusIcon status="failed" isDarkMode={isDarkMode} size="sm" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#8696a0]" />;
    }
  };

  const renderMediaContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="relative group cursor-pointer">
            <div className="bg-[#2a3942] rounded-lg w-48 h-48 flex items-center justify-center">
              <span className="text-[#8696a0] text-xs">[Imagem]</span>
            </div>
            {message.metadata?.caption && (
              <p className="mt-1 text-sm">{message.metadata.caption}</p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="relative group cursor-pointer">
            <div className="bg-[#2a3942] rounded-lg w-48 h-36 flex items-center justify-center">
              <Play className="w-10 h-10 text-white/70" />
            </div>
            {message.metadata?.duration && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {Math.floor(message.metadata.duration / 60)}:
                {String(message.metadata.duration % 60).padStart(2, "0")}
              </span>
            )}
            {message.metadata?.caption && (
              <p className="mt-1 text-sm">{message.metadata.caption}</p>
            )}
          </div>
        );

       case "audio":
         return (
           <div className="flex items-center gap-3">
             <AudioPlayer message={message} isDarkMode={isDarkMode} />
             {message.metadata?.caption && (
               <p className="text-sm ml-2">{message.metadata.caption}</p>
             )}
           </div>
         );

      case "document":
        return (
          <div className="flex items-center gap-3 bg-[#2a3942] rounded-lg p-3 cursor-pointer hover:bg-[#2a3942]/80 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#1f2c33] flex items-center justify-center">
              <File className="w-6 h-6 text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.metadata?.fileName || "Documento"}
              </p>
              {message.metadata?.fileSize && (
                <p className="text-xs text-[#8696a0]">
                  {(message.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex",
        message.isFromMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] min-w-[80px] relative transition-colors duration-300",
          message.isFromMe
            ? isDarkMode 
              ? "bg-[#005c4b] rounded-l-2xl rounded-tr-2xl rounded-br-md"
              : "bg-emerald-100 rounded-l-2xl rounded-tr-2xl rounded-br-md"
            : isDarkMode
              ? "bg-[#202c33] rounded-r-2xl rounded-tl-2xl rounded-bl-md"
              : "bg-white rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-sm",
          isFirstInGroup && (message.isFromMe ? "rounded-tr-none" : "rounded-tl-none"),
          isLastInGroup && (message.isFromMe ? "rounded-br-md" : "rounded-bl-md")
        )}
      >
        {/* Message Content */}
        <div className="px-3 py-2">
          {/* Sender name for group chats */}
          {!message.isFromMe && message.sender && (
            <p className="text-[#53bdeb] text-sm font-medium mb-1">
              {message.sender.name}
            </p>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={cn(
              "border-l-4 border-[#00a884] pl-2 mb-2 py-1 rounded-r",
              isDarkMode ? "bg-black/10" : "bg-gray-100"
            )}>
              <p className="text-xs text-[#00a884] font-medium">
                {message.replyTo.sender}
              </p>
              <p className={cn(
                "text-xs truncate",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Media content */}
          {message.type !== "text" && message.type !== "template" && (
            <div className="mb-1">{renderMediaContent()}</div>
          )}

          {/* Text content */}
          {(message.type === "text" || message.metadata?.caption) && (
            <p className={cn(
              "text-sm whitespace-pre-wrap break-words",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              {message.type === "text" ? message.content : message.metadata?.caption}
            </p>
          )}

          {/* Template message */}
          {message.type === "template" && (
            <div className="border border-[#00a884]/30 rounded-lg p-2 bg-[#00a884]/5">
              <p className="text-xs text-[#00a884] mb-1">Template</p>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>{message.content}</p>
            </div>
          )}
        </div>

        {/* Footer: Time and Status */}
        <div className="flex items-center justify-end gap-1 px-3 pb-1 -mt-1">
          <span className={cn(
            "text-[10px]",
            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
          )}>
            {formatTime(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>

        {/* Triangle pointer for first in group */}
        {isFirstInGroup && (
          <div
            className={cn(
              "absolute top-0 w-3 h-3",
              message.isFromMe
                ? isDarkMode 
                  ? "right-[-4px] bg-[#005c4b]"
                  : "right-[-4px] bg-emerald-100"
                : isDarkMode
                  ? "left-[-4px] bg-[#202c33]"
                  : "left-[-4px] bg-white"
            )}
            style={{
              clipPath: message.isFromMe
                ? "polygon(0 0, 0% 100%, 100% 0)"
                : "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
