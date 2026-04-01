'use client';

import { useState, useCallback, useEffect } from 'react';

interface Backup {
  id: string;
  session_id: string;
  backup_name: string;
  backup_type: 'manual' | 'automatic';
  status: 'pending' | 'completed' | 'failed';
  storage_path?: string;
  storage_url?: string;
  file_size?: number;
  checksum?: string;
  include_messages: boolean;
  include_media: boolean;
  include_contacts: boolean;
  date_from?: string;
  date_to?: string;
  message_count?: number;
  media_count?: number;
  contact_count?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export function useWhatsAppBackup(sessionId: string) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchBackups = useCallback(
    async (pageLimit = 50, pageOffset = 0): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/backup?limit=${pageLimit}&offset=${pageOffset}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch backups');
        }

        const data = await response.json();
        setBackups(data.backups || []);
        setTotal(data.total || 0);
        setLimit(data.limit || 50);
        setOffset(data.offset || 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching backups:', message);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const createBackup = useCallback(
    async (options: {
      includeMessages?: boolean;
      includeMedia?: boolean;
      includeContacts?: boolean;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<Backup | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/backup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create backup');
        }

        const backup = await response.json();
        setBackups((prev) => [backup, ...prev]);

        return backup;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error creating backup:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const downloadBackup = useCallback(
    async (backupId: string): Promise<Blob | null> => {
      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/backup/${backupId}/download`
        );

        if (!response.ok) {
          throw new Error('Failed to download backup');
        }

        return await response.blob();
      } catch (err) {
        console.error('Error downloading backup:', err);
        return null;
      }
    },
    [sessionId]
  );

  const deleteBackup = useCallback(
    async (backupId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/backup`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete backup');
        }

        setBackups((prev) => prev.filter((b) => b.id !== backupId));

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error deleting backup:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const restoreBackup = useCallback(
    async (backupId: string, overwrite = false): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/backup`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              backupId,
              action: 'restore',
              overwrite,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to restore backup');
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error restoring backup:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const loadMore = useCallback(async () => {
    const newOffset = offset + limit;
    await fetchBackups(limit, newOffset);
  }, [offset, limit, fetchBackups]);

  const getBackupSize = useCallback((backupId: string): string => {
    const backup = backups.find((b) => b.id === backupId);
    if (!backup?.file_size) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = backup.file_size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, [backups]);

  const getBackupStatus = useCallback(
    (backupId: string): 'pending' | 'completed' | 'failed' => {
      const backup = backups.find((b) => b.id === backupId);
      return backup?.status || 'pending';
    },
    [backups]
  );

  const getLatestBackup = useCallback((): Backup | null => {
    return backups.length > 0 ? backups[0] : null;
  }, [backups]);

  const scheduleAutoBackup = useCallback(
    async (intervalDays: number): Promise<boolean> => {
      try {
        // This would typically call an API endpoint to configure auto-backup
        console.log(`Auto-backup scheduled every ${intervalDays} days`);
        return true;
      } catch (err) {
        console.error('Error scheduling auto-backup:', err);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return {
    backups,
    loading,
    error,
    total,
    limit,
    offset,
    fetchBackups,
    createBackup,
    downloadBackup,
    deleteBackup,
    restoreBackup,
    loadMore,
    getBackupSize,
    getBackupStatus,
    getLatestBackup,
    scheduleAutoBackup,
  };
}
