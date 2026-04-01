'use client';

import { useState, useCallback, useEffect } from 'react';

interface ArchivedConversation {
  id: string;
  session_id: string;
  contact_phone: string;
  contact_name?: string;
  reason?: string;
  archived_at: string;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppArchive(sessionId: string) {
  const [archivedConversations, setArchivedConversations] = useState<
    ArchivedConversation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchArchived = useCallback(
    async (pageLimit = 50, pageOffset = 0): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/archive?limit=${pageLimit}&offset=${pageOffset}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch archived conversations');
        }

        const data = await response.json();
        setArchivedConversations(data.archived || []);
        setTotal(data.total || 0);
        setLimit(data.limit || 50);
        setOffset(data.offset || 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching archived conversations:', message);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const archiveConversation = useCallback(
    async (
      contactPhone: string,
      contactName?: string,
      reason?: string
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/archive`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactPhone,
              contactName,
              reason,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to archive conversation');
        }

        const archived = await response.json();
        setArchivedConversations((prev) => [archived, ...prev]);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error archiving conversation:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const unarchiveConversation = useCallback(
    async (archiveId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/archive`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archiveId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unarchive conversation');
        }

        setArchivedConversations((prev) =>
          prev.filter((a) => a.id !== archiveId)
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error unarchiving conversation:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const deleteArchived = useCallback(
    async (archiveId: string): Promise<boolean> => {
      return unarchiveConversation(archiveId);
    },
    [unarchiveConversation]
  );

  const loadMore = useCallback(async () => {
    const newOffset = offset + limit;
    await fetchArchived(limit, newOffset);
  }, [offset, limit, fetchArchived]);

  const getArchivedByDate = useCallback(
    (dateFrom: string, dateTo: string): ArchivedConversation[] => {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime();

      return archivedConversations.filter((archived) => {
        const archivedDate = new Date(archived.archived_at).getTime();
        return archivedDate >= from && archivedDate <= to;
      });
    },
    [archivedConversations]
  );

  const searchArchived = useCallback(
    (query: string): ArchivedConversation[] => {
      const lowerQuery = query.toLowerCase();
      return archivedConversations.filter(
        (archived) =>
          archived.contact_phone.toLowerCase().includes(lowerQuery) ||
          archived.contact_name?.toLowerCase().includes(lowerQuery) ||
          archived.reason?.toLowerCase().includes(lowerQuery)
      );
    },
    [archivedConversations]
  );

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  return {
    archivedConversations,
    loading,
    error,
    total,
    limit,
    offset,
    fetchArchived,
    archiveConversation,
    unarchiveConversation,
    deleteArchived,
    loadMore,
    getArchivedByDate,
    searchArchived,
  };
}
