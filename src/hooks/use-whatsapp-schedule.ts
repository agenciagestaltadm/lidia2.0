'use client';

import { useState, useCallback, useEffect } from 'react';

interface ScheduledMessage {
  id: string;
  session_id: string;
  contact_phone: string;
  contact_name?: string;
  message: string;
  media_url?: string;
  media_type?: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppSchedule(sessionId: string) {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchScheduled = useCallback(
    async (status?: string, pageLimit = 50, pageOffset = 0): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/whatsapp/sessions/${sessionId}/schedule?limit=${pageLimit}&offset=${pageOffset}`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch scheduled messages');
        }

        const data = await response.json();
        setScheduledMessages(data.scheduled || []);
        setTotal(data.total || 0);
        setLimit(data.limit || 50);
        setOffset(data.offset || 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching scheduled messages:', message);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const scheduleMessage = useCallback(
    async (
      contactPhone: string,
      message: string,
      scheduledAt: string,
      contactName?: string,
      mediaUrl?: string,
      mediaType?: string
    ): Promise<ScheduledMessage | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/schedule`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactPhone,
              contactName,
              message,
              scheduledAt,
              mediaUrl,
              mediaType,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to schedule message');
        }

        const scheduled = await response.json();
        setScheduledMessages((prev) => [scheduled, ...prev]);

        return scheduled;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error scheduling message:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const updateSchedule = useCallback(
    async (
      scheduleId: string,
      updates: Partial<ScheduledMessage>
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/schedule`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleId,
              ...updates,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update schedule');
        }

        const updated = await response.json();
        setScheduledMessages((prev) =>
          prev.map((s) => (s.id === scheduleId ? updated : s))
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error updating schedule:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const cancelSchedule = useCallback(
    async (scheduleId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/schedule`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduleId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to cancel schedule');
        }

        setScheduledMessages((prev) =>
          prev.map((s) =>
            s.id === scheduleId ? { ...s, status: 'cancelled' as const } : s
          )
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error cancelling schedule:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const executeSchedule = useCallback(
    async (scheduleId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/schedule/${scheduleId}/execute`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to execute schedule');
        }

        setScheduledMessages((prev) =>
          prev.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  status: 'sent' as const,
                  sent_at: new Date().toISOString(),
                }
              : s
          )
        );

        return true;
      } catch (err) {
        console.error('Error executing schedule:', err);
        return false;
      }
    },
    [sessionId]
  );

  const loadMore = useCallback(async () => {
    const newOffset = offset + limit;
    await fetchScheduled(undefined, limit, newOffset);
  }, [offset, limit, fetchScheduled]);

  const getScheduledByStatus = useCallback(
    (status: string): ScheduledMessage[] => {
      return scheduledMessages.filter((s) => s.status === status);
    },
    [scheduledMessages]
  );

  const getScheduledByDate = useCallback(
    (dateFrom: string, dateTo: string): ScheduledMessage[] => {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime();

      return scheduledMessages.filter((s) => {
        const scheduledDate = new Date(s.scheduled_at).getTime();
        return scheduledDate >= from && scheduledDate <= to;
      });
    },
    [scheduledMessages]
  );

  const getUpcomingMessages = useCallback(
    (hoursAhead: number): ScheduledMessage[] => {
      const now = new Date().getTime();
      const future = now + hoursAhead * 60 * 60 * 1000;

      return scheduledMessages.filter((s) => {
        if (s.status !== 'pending') return false;
        const scheduledDate = new Date(s.scheduled_at).getTime();
        return scheduledDate >= now && scheduledDate <= future;
      });
    },
    [scheduledMessages]
  );

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  return {
    scheduledMessages,
    loading,
    error,
    total,
    limit,
    offset,
    fetchScheduled,
    scheduleMessage,
    updateSchedule,
    cancelSchedule,
    executeSchedule,
    loadMore,
    getScheduledByStatus,
    getScheduledByDate,
    getUpcomingMessages,
  };
}
