"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus,
  Smile,
  Mic,
  Send,
  X,
  Clock,
} from "lucide-react";
import { AttachmentMenu, AttachmentFile } from "./AttachmentMenu";
import {
  VideoConfModal,
  ContactPickerModal,
  ListBuilderModal,
  TemplatePickerModal,
  CTABuilderModal,
  ReplyButtonsModal,
  LocationModal,
} from "./modals";

interface MessageInputProps {
  onSend: (message: string) => void;
  onSendAttachments?: (files: AttachmentFile[], caption?: string) => void;
  onSendMessage?: (content: string, type?: string, metadata?: any) => void;
  disabled?: boolean;
  isWithin24Hours?: boolean;
  isDarkMode?: boolean;
  conversationStatus?: 'open' | 'pending' | 'resolved';
}

export function MessageInput({
  onSend,
  onSendAttachments,
  onSendMessage,
  disabled = false,
  isWithin24Hours = true,
  isDarkMode = true,
  conversationStatus = 'open',
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Modal states
  const [showVideoConf, setShowVideoConf] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showListBuilder, setShowListBuilder] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCTABuilder, setShowCTABuilder] = useState(false);
  const [showReplyButtons, setShowReplyButtons] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [locationMode, setLocationMode] = useState<'send' | 'request'>('send');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle attachment send
  const handleSendAttachments = (files: AttachmentFile[], caption?: string) => {
    onSendAttachments?.(files, caption);
    setShowAttachments(false);
  };

  // Handle video conference
  const handleOpenVideoConf = () => {
    setShowVideoConf(true);
  };

  const handleSendVideoConf = (jitsiLink: string) => {
    onSendMessage?.(jitsiLink, 'videoconf', { url: jitsiLink, platform: 'jitsi' });
    window.open(jitsiLink, '_blank');
  };

  // Handle contact picker
  const handleOpenContactPicker = () => {
    setShowContactPicker(true);
  };

  const handleSendContact = (contact: { name: string; phone: string }) => {
    onSendMessage?.(`👤 ${contact.name}\n📞 ${contact.phone}`, 'contact', contact);
  };

  // Handle list builder
  const handleOpenListBuilder = () => {
    setShowListBuilder(true);
  };

  const handleSendList = (listData: { header: string; body: string; footer: string; buttons: string[] }) => {
    const content = `📋 *${listData.header}*\n\n${listData.body}\n\n${listData.buttons.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\n_${listData.footer}_`;
    onSendMessage?.(content, 'list', listData);
  };

  // Handle template picker
  const handleOpenTemplatePicker = () => {
    setShowTemplatePicker(true);
  };

  const handleSendTemplate = (template: { name: string; content: string }) => {
    onSendMessage?.(template.content, 'template', { templateName: template.name });
  };

  // Handle CTA builder
  const handleOpenCTABuilder = () => {
    setShowCTABuilder(true);
  };

  const handleSendCTA = (ctaData: { text: string; buttonText: string; url: string }) => {
    const content = `${ctaData.text}\n\n[${ctaData.buttonText}](${ctaData.url})`;
    onSendMessage?.(content, 'cta', ctaData);
  };

  // Handle reply buttons
  const handleOpenReplyButtons = () => {
    setShowReplyButtons(true);
  };

  const handleSendReplyButtons = (data: { title: string; message: string; buttons: string[] }) => {
    const content = `*${data.title}*\n\n${data.message}\n\n${data.buttons.map((b, i) => `▫️ ${b}`).join('\n')}`;
    onSendMessage?.(content, 'replybuttons', data);
  };

  // Handle location
  const handleSendLocationRequest = () => {
    setLocationMode('request');
    setShowLocation(true);
  };

  const handleSendLocationAddress = () => {
    setLocationMode('send');
    setShowLocation(true);
  };

  const handleSendLocation = (locationData: { address: string; lat?: number; lng?: number }) => {
    if (locationMode === 'request') {
      onSendMessage?.('📍 Por favor, compartilhe sua localização atual.', 'location_request');
    } else {
      onSendMessage?.(`📍 ${locationData.address}`, 'location', locationData);
    }
  };

  // Check if attachments are allowed
  const canSendAttachments = conversationStatus === 'open' && !disabled && isWithin24Hours;

  if (!isWithin24Hours) {
    return (
      <div className={cn(
        "h-16 px-4 flex items-center justify-center border-t transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            Janela de 24h fechada. Use um template para contatar.
          </span>
          <button className="px-4 py-2 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/90 transition-colors">
            Ver Templates
          </button>
        </div>
      </div>
    );
  }

  // Show blocked message for non-open conversations
  if (conversationStatus !== 'open') {
    return (
      <div className={cn(
        "h-16 px-4 flex items-center justify-center border-t transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            {conversationStatus === 'pending' 
              ? 'Conversa pendente. Abra a conversa para enviar mensagens.' 
              : 'Conversa resolvida. Reabra para enviar mensagens.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "border-t transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-white border-gray-200"
      )}>
        {/* Attachment Menu */}
        <AttachmentMenu
          isOpen={showAttachments}
          onClose={() => setShowAttachments(false)}
          isDarkMode={isDarkMode}
          onSendAttachments={handleSendAttachments}
          onOpenVideoConf={handleOpenVideoConf}
          onOpenContactPicker={handleOpenContactPicker}
          onOpenListBuilder={handleOpenListBuilder}
          onOpenTemplatePicker={handleOpenTemplatePicker}
          onOpenCTABuilder={handleOpenCTABuilder}
          onOpenReplyButtons={handleOpenReplyButtons}
          onSendLocationRequest={handleSendLocationRequest}
          onSendLocationAddress={handleSendLocationAddress}
          disabled={!canSendAttachments}
          maxFileSize={100}
        />

        {/* Input Area */}
        <div className="h-16 px-4 flex items-center gap-3">
          {/* Attachment Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAttachments(!showAttachments)}
            disabled={!canSendAttachments}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              showAttachments
                ? "bg-[#00a884] text-white"
                : isDarkMode 
                  ? "text-[#aebac1] hover:bg-[#2a3942]"
                  : "text-gray-600 hover:bg-gray-100",
              !canSendAttachments && "opacity-50 cursor-not-allowed"
            )}
          >
            {showAttachments ? (
              <X className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </motion.button>

          {/* Emoji Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={disabled}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDarkMode 
                ? "text-[#aebac1] hover:bg-[#2a3942]" 
                : "text-gray-600 hover:bg-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* Input Field */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className={cn(
                "font-medium",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                Gravando {formatRecordingTime(recordingTime)}
              </span>
            </div>
          ) : (
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem"
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full min-h-[44px] max-h-[120px] px-4 py-2.5 text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all",
                  isDarkMode 
                    ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] scrollbar-thin scrollbar-thumb-[#374045]"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500 scrollbar-thin scrollbar-thumb-gray-300",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          )}

          {/* Send/Record Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (message.trim()) {
                handleSend();
              } else {
                setIsRecording(!isRecording);
              }
            }}
            disabled={disabled}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              message.trim()
                ? "bg-[#00a884] text-white"
                : isDarkMode 
                  ? "text-[#aebac1] hover:bg-[#2a3942]"
                  : "text-gray-600 hover:bg-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {message.trim() ? (
              <Send className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Modals */}
      <VideoConfModal
        isOpen={showVideoConf}
        onClose={() => setShowVideoConf(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendVideoConf}
      />

      <ContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendContact}
      />

      <ListBuilderModal
        isOpen={showListBuilder}
        onClose={() => setShowListBuilder(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendList}
      />

      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendTemplate}
      />

      <CTABuilderModal
        isOpen={showCTABuilder}
        onClose={() => setShowCTABuilder(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendCTA}
      />

      <ReplyButtonsModal
        isOpen={showReplyButtons}
        onClose={() => setShowReplyButtons(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendReplyButtons}
      />

      <LocationModal
        isOpen={showLocation}
        onClose={() => setShowLocation(false)}
        isDarkMode={isDarkMode}
        onSend={handleSendLocation}
        mode={locationMode}
      />
    </>
  );
}
