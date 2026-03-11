"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus,
  Smile,
  Mic,
  Send,
  X,
  Clock,
  Zap,
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
  QuickRepliesManagerModal,
} from "./modals";
import { QuickRepliesDropdown } from "./QuickRepliesDropdown";
import { useQuickReplies } from "@/hooks/use-quick-replies";
import { AudioRecorder } from "./AudioRecorder";
import EmojiPicker, { Theme } from "emoji-picker-react";

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
  
  // Quick replies hook
  const { quickReplies, addQuickReply, updateQuickReply, deleteQuickReply, getByShortcut } = useQuickReplies();
  
  // Quick replies UI states
  const [showQuickRepliesManager, setShowQuickRepliesManager] = useState(false);
  const [showQuickRepliesDropdown, setShowQuickRepliesDropdown] = useState(false);
  const [quickReplySearchTerm, setQuickReplySearchTerm] = useState("");
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Audio recorder state
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
   
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
      // Check if message is a quick reply shortcut
      const trimmedMessage = message.trim();
      if (trimmedMessage.startsWith("/")) {
        const shortcut = trimmedMessage.slice(1).toLowerCase();
        const reply = getByShortcut(shortcut);
        if (reply) {
          onSend(reply.content);
          setMessage("");
          if (inputRef.current) {
            inputRef.current.style.height = "auto";
          }
          return;
        }
      }
      
      onSend(trimmedMessage);
      setMessage("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't send if quick replies dropdown is open (let it handle Enter)
    if (showQuickRepliesDropdown && e.key === "Enter") {
      return;
    }
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle message change with quick reply detection
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check if user typed "/" to show quick replies dropdown
    const lastSlashIndex = value.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const afterSlash = value.slice(lastSlashIndex + 1);
      // Only show if there's no space after the slash (user is typing a command)
      if (!afterSlash.includes(" ")) {
        setQuickReplySearchTerm(afterSlash);
        setShowQuickRepliesDropdown(true);
      } else {
        setShowQuickRepliesDropdown(false);
      }
    } else {
      setShowQuickRepliesDropdown(false);
    }
    
    // Auto-resize
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  // Handle quick reply selection
  const handleQuickReplySelect = (reply: { shortcut: string; content: string }) => {
    // Replace the "/" and search term with the full content
    const lastSlashIndex = message.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const beforeSlash = message.slice(0, lastSlashIndex);
      const newMessage = beforeSlash + reply.content;
      setMessage(newMessage);
      setShowQuickRepliesDropdown(false);
      setQuickReplySearchTerm("");
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
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

          {/* Quick Replies Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowQuickRepliesManager(true)}
            disabled={disabled}
            title="Mensagens Rápidas"
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDarkMode 
                ? "text-[#aebac1] hover:bg-[#2a3942]" 
                : "text-gray-600 hover:bg-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className="w-5 h-5" />
          </motion.button>

          {/* Emoji Button */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                showEmojiPicker
                  ? "bg-[#00a884] text-white"
                  : isDarkMode 
                    ? "text-[#aebac1] hover:bg-[#2a3942]" 
                    : "text-gray-600 hover:bg-gray-100",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            
            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "absolute bottom-12 left-0 z-[102] rounded-xl shadow-2xl overflow-hidden",
                    isDarkMode ? "border border-[#2a2a2a]" : "border border-gray-200"
                  )}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiObject, event) => {
                      event?.stopPropagation();
                      const emoji = emojiObject.emoji;
                      if (emoji) {
                        setMessage(prev => prev + emoji);
                      }
                      setShowEmojiPicker(false);
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 0);
                    }}
                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                    width={350}
                    height={400}
                    lazyLoadEmojis={true}
                    searchPlaceholder="Buscar emoji..."
                    previewConfig={{ showPreview: false }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                onChange={handleMessageChange}
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
                setShowAudioRecorder(true);
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

      {/* Quick Replies Dropdown */}
      <QuickRepliesDropdown
        isOpen={showQuickRepliesDropdown}
        searchTerm={quickReplySearchTerm}
        quickReplies={quickReplies}
        isDarkMode={isDarkMode}
        onSelect={handleQuickReplySelect}
        onClose={() => {
          setShowQuickRepliesDropdown(false);
          setQuickReplySearchTerm("");
        }}
        inputRef={inputRef}
      />

      {/* Quick Replies Manager Modal */}
      <QuickRepliesManagerModal
        isOpen={showQuickRepliesManager}
        onClose={() => setShowQuickRepliesManager(false)}
        isDarkMode={isDarkMode}
        quickReplies={quickReplies}
        onAdd={addQuickReply}
        onUpdate={updateQuickReply}
        onDelete={deleteQuickReply}
      />

      {/* Audio Recorder */}
      <AnimatePresence>
        {showAudioRecorder && (
          <AudioRecorder
            isDarkMode={isDarkMode}
            onSend={(audioBlob, duration, waveformData) => {
              // Prevent double sending
              if (isSendingAudio) return;
              setIsSendingAudio(true);
              
              // Create a message with audio and real waveform data
              onSendMessage?.('🎤 Áudio', 'audio', { 
                audioBlob, 
                duration,
                mimeType: audioBlob.type || 'audio/webm',
                waveformData
              });
              
              // Close recorder after a small delay to ensure state is updated
              setTimeout(() => {
                setShowAudioRecorder(false);
                setIsSendingAudio(false);
              }, 100);
            }}
            onCancel={() => {
              setIsSendingAudio(false);
              setShowAudioRecorder(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
