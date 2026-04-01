'use client';

import React, { useState, useCallback } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { useWhatsAppSchedule } from '@/hooks/use-whatsapp-schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  contactPhone?: string;
  contactName?: string;
  isDarkMode?: boolean;
  onScheduled?: (message: any) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  sessionId,
  contactPhone = '',
  contactName = '',
  isDarkMode = false,
  onScheduled,
}: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    contactPhone,
    contactName,
    message: '',
    scheduledDate: '',
    scheduledTime: '',
    mediaUrl: '',
    mediaType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { scheduleMessage, loading } = useWhatsAppSchedule(sessionId);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Número do contato é obrigatório';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Data é obrigatória';
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Hora é obrigatória';
    }

    // Validate scheduled time is in the future
    if (formData.scheduledDate && formData.scheduledTime) {
      const scheduledDateTime = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}`
      );
      if (scheduledDateTime <= new Date()) {
        newErrors.scheduledDate =
          'Data e hora devem ser no futuro';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      const scheduledAt = `${formData.scheduledDate}T${formData.scheduledTime}:00Z`;

      const result = await scheduleMessage(
        formData.contactPhone,
        formData.message,
        scheduledAt,
        formData.contactName,
        formData.mediaUrl || undefined,
        formData.mediaType || undefined
      );

      if (result) {
        onScheduled?.(result);
        handleClose();
      }
    },
    [formData, scheduleMessage, validateForm, onScheduled]
  );

  const handleClose = useCallback(() => {
    setFormData({
      contactPhone,
      contactName,
      message: '',
      scheduledDate: '',
      scheduledTime: '',
      mediaUrl: '',
      mediaType: '',
    });
    setErrors({});
    onClose();
  }, [contactPhone, contactName, onClose]);

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`max-w-md w-full mx-4 rounded-lg shadow-lg ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-700'
            : 'bg-white border border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Agendar Mensagem
          </h2>
          <button
            onClick={handleClose}
            className={`p-1 rounded hover:bg-slate-200 ${
              isDarkMode ? 'hover:bg-slate-800' : ''
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Phone */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Número do Contato
              </label>
              <Input
                type="text"
                placeholder="5511999999999"
                value={formData.contactPhone}
                onChange={(e) =>
                  handleInputChange('contactPhone', e.target.value)
                }
                disabled={!!contactPhone}
                className={`${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-slate-300'
                } ${errors.contactPhone ? 'border-red-500' : ''}`}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPhone}
                </p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Nome do Contato (opcional)
              </label>
              <Input
                type="text"
                placeholder="Nome"
                value={formData.contactName}
                onChange={(e) =>
                  handleInputChange('contactName', e.target.value)
                }
                className={`${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-slate-300'
                }`}
              />
            </div>

            {/* Message */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Mensagem
              </label>
              <textarea
                placeholder="Digite sua mensagem..."
                value={formData.message}
                onChange={(e) =>
                  handleInputChange('message', e.target.value)
                }
                rows={4}
                className={`w-full rounded border px-3 py-2 text-sm resize-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-slate-300'
                } ${errors.message ? 'border-red-500' : ''}`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data
                </label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    handleInputChange('scheduledDate', e.target.value)
                  }
                  className={`${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300'
                  } ${errors.scheduledDate ? 'border-red-500' : ''}`}
                />
                {errors.scheduledDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.scheduledDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Hora
                </label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    handleInputChange('scheduledTime', e.target.value)
                  }
                  className={`${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300'
                  } ${errors.scheduledTime ? 'border-red-500' : ''}`}
                />
                {errors.scheduledTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.scheduledTime}
                  </p>
                )}
              </div>
            </div>

            {/* Media URL (optional) */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                URL da Mídia (opcional)
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={formData.mediaUrl}
                onChange={(e) =>
                  handleInputChange('mediaUrl', e.target.value)
                }
                className={`${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-slate-300'
                }`}
              />
            </div>

            {/* Media Type */}
            {formData.mediaUrl && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Tipo de Mídia
                </label>
                <select
                  value={formData.mediaType}
                  onChange={(e) =>
                    handleInputChange('mediaType', e.target.value)
                  }
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="">Selecione...</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                  <option value="audio">Áudio</option>
                  <option value="document">Documento</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
