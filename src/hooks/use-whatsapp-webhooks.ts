'use client';

import { useState, useCallback, useEffect } from 'react';

interface Webhook {
  id: string;
  session_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  retry_policy: {
    maxRetries: number;
    retryDelayMs: number;
  };
  headers: Record<string, string>;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
}

interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed';
  http_status_code?: number;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppWebhooks(sessionId: string) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/webhooks`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }

      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching webhooks:', message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const createWebhook = useCallback(
    async (
      url: string,
      events: string[],
      retryPolicy?: { maxRetries: number; retryDelayMs: number },
      headers?: Record<string, string>
    ): Promise<Webhook | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/webhooks`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              events,
              isActive: true,
              retryPolicy,
              headers,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create webhook');
        }

        const webhook = await response.json();
        setWebhooks((prev) => [webhook, ...prev]);

        return webhook;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error creating webhook:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const updateWebhook = useCallback(
    async (
      webhookId: string,
      updates: Partial<Webhook>
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/webhooks`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookId,
              ...updates,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update webhook');
        }

        const webhook = await response.json();
        setWebhooks((prev) =>
          prev.map((w) => (w.id === webhookId ? webhook : w))
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error updating webhook:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const deleteWebhook = useCallback(
    async (webhookId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/webhooks`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhookId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete webhook');
        }

        setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error deleting webhook:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const toggleWebhook = useCallback(
    async (webhookId: string, isActive: boolean): Promise<boolean> => {
      return updateWebhook(webhookId, { is_active: isActive });
    },
    [updateWebhook]
  );

  const fetchWebhookEvents = useCallback(
    async (
      webhookId: string,
      limit = 50,
      offset = 0
    ): Promise<WebhookEvent[]> => {
      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/webhooks/${webhookId}/events?limit=${limit}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch webhook events');
        }

        const data = await response.json();
        return data.events || [];
      } catch (err) {
        console.error('Error fetching webhook events:', err);
        return [];
      }
    },
    [sessionId]
  );

  const retryWebhookEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/webhooks/events/${eventId}/retry`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to retry webhook event');
        }

        return true;
      } catch (err) {
        console.error('Error retrying webhook event:', err);
        return false;
      }
    },
    [sessionId]
  );

  const getWebhookStatus = useCallback(
    (webhookId: string): 'active' | 'inactive' | 'error' => {
      const webhook = webhooks.find((w) => w.id === webhookId);
      if (!webhook) return 'inactive';
      return webhook.is_active ? 'active' : 'inactive';
    },
    [webhooks]
  );

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    fetchWebhookEvents,
    retryWebhookEvent,
    getWebhookStatus,
  };
}
