'use client';

import React, { useState, useCallback } from 'react';
import { Download, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useWhatsAppBackup } from '@/hooks/use-whatsapp-backup';
import { Button } from '@/components/ui/button';

interface BackupManagerProps {
  sessionId: string;
  isDarkMode?: boolean;
  onBackupCreated?: (backup: any) => void;
  onBackupDeleted?: (backupId: string) => void;
  onBackupRestored?: (backupId: string) => void;
}

export function BackupManager({
  sessionId,
  isDarkMode = false,
  onBackupCreated,
  onBackupDeleted,
  onBackupRestored,
}: BackupManagerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backupOptions, setBackupOptions] = useState({
    includeMessages: true,
    includeMedia: true,
    includeContacts: true,
  });

  const {
    backups,
    loading,
    createBackup,
    downloadBackup,
    deleteBackup,
    restoreBackup,
    getBackupSize,
    getBackupStatus,
    loadMore,
  } = useWhatsAppBackup(sessionId);

  const handleCreateBackup = useCallback(async () => {
    const backup = await createBackup(backupOptions);
    if (backup) {
      onBackupCreated?.(backup);
      setShowOptions(false);
    }
  }, [backupOptions, createBackup, onBackupCreated]);

  const handleDownloadBackup = useCallback(
    async (backupId: string) => {
      const blob = await downloadBackup(backupId);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    },
    [downloadBackup]
  );

  const handleDeleteBackup = useCallback(
    async (backupId: string) => {
      if (window.confirm('Tem certeza que deseja deletar este backup?')) {
        const success = await deleteBackup(backupId);
        if (success) {
          onBackupDeleted?.(backupId);
        }
      }
    },
    [deleteBackup, onBackupDeleted]
  );

  const handleRestoreBackup = useCallback(
    async (backupId: string) => {
      if (
        window.confirm(
          'Tem certeza que deseja restaurar este backup? Isso pode sobrescrever dados existentes.'
        )
      ) {
        const success = await restoreBackup(backupId, true);
        if (success) {
          onBackupRestored?.(backupId);
        }
      }
    },
    [restoreBackup, onBackupRestored]
  );

  return (
    <div
      className={`w-full rounded-lg border p-4 ${
        isDarkMode
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Backups
        </h3>
        <Button
          onClick={() => setShowOptions(!showOptions)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Backup
        </Button>
      </div>

      {/* Create Backup Options */}
      {showOptions && (
        <div
          className={`mb-4 p-4 rounded border ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={backupOptions.includeMessages}
                onChange={(e) =>
                  setBackupOptions({
                    ...backupOptions,
                    includeMessages: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Incluir Mensagens
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={backupOptions.includeMedia}
                onChange={(e) =>
                  setBackupOptions({
                    ...backupOptions,
                    includeMedia: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Incluir Mídia
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={backupOptions.includeContacts}
                onChange={(e) =>
                  setBackupOptions({
                    ...backupOptions,
                    includeContacts: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Incluir Contatos
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateBackup}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Criando...' : 'Criar Backup'}
              </Button>
              <Button
                onClick={() => setShowOptions(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="space-y-2">
        {backups.length === 0 ? (
          <p
            className={`text-center py-8 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Nenhum backup disponível
          </p>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className={`flex items-center justify-between p-3 rounded border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {backup.backup_name}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div>
                    Criado em:{' '}
                    {new Date(backup.created_at).toLocaleString('pt-BR')}
                  </div>
                  <div>
                    Tamanho: {getBackupSize(backup.id)} | Status:{' '}
                    <span
                      className={`font-medium ${
                        backup.status === 'completed'
                          ? 'text-green-600'
                          : backup.status === 'failed'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {backup.status === 'completed'
                        ? 'Concluído'
                        : backup.status === 'failed'
                        ? 'Falhou'
                        : 'Pendente'}
                    </span>
                  </div>
                  {backup.message_count && (
                    <div>
                      Mensagens: {backup.message_count} | Mídia:{' '}
                      {backup.media_count} | Contatos: {backup.contact_count}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDownloadBackup(backup.id)}
                  className={`p-2 rounded hover:bg-slate-200 ${
                    isDarkMode ? 'hover:bg-slate-700' : ''
                  }`}
                  title="Baixar backup"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                </button>

                <button
                  onClick={() => handleRestoreBackup(backup.id)}
                  className={`p-2 rounded hover:bg-slate-200 ${
                    isDarkMode ? 'hover:bg-slate-700' : ''
                  }`}
                  title="Restaurar backup"
                >
                  <RefreshCw className="w-4 h-4 text-green-600" />
                </button>

                <button
                  onClick={() => handleDeleteBackup(backup.id)}
                  className={`p-2 rounded hover:bg-slate-200 ${
                    isDarkMode ? 'hover:bg-slate-700' : ''
                  }`}
                  title="Deletar backup"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {backups.length > 0 && (
        <div className="mt-4 text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </Button>
        </div>
      )}
    </div>
  );
}
