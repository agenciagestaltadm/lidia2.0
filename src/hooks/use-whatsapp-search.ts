'use client';

import { useState, useCallback, useEffect } from 'react';

interface Message {
  id: string;
  message_text?: string;
  caption?: string;
  message_type: string;
  contact_phone: string;
  is_from_me: boolean;
  is_deleted: boolean;
  is_forwarded: boolean;
  reaction_count: number;
  forward_count: number;
  created_at: string;
}

interface SearchFilters {
  from?: string;
  to?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  hasReactions?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
}

export function useWhatsAppSearch(sessionId: string) {
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const searchMessages = useCallback(
    async (
      query: string,
      filters?: SearchFilters,
      pageLimit = 50,
      pageOffset = 0
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('q', query);
        params.append('limit', pageLimit.toString());
        params.append('offset', pageOffset.toString());

        if (filters?.from) params.append('from', filters.from);
        if (filters?.to) params.append('to', filters.to);
        if (filters?.type) params.append('type', filters.type);
        if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters?.dateTo) params.append('dateTo', filters.dateTo);
        if (filters?.hasReactions !== undefined)
          params.append('hasReactions', filters.hasReactions.toString());
        if (filters?.isDeleted !== undefined)
          params.append('isDeleted', filters.isDeleted.toString());
        if (filters?.isForwarded !== undefined)
          params.append('isForwarded', filters.isForwarded.toString());

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/search?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to search messages');
        }

        const data = await response.json();
        setResults(data.results || []);
        setTotal(data.total || 0);
        setLimit(data.limit || 50);
        setOffset(data.offset || 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error searching messages:', message);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const clearSearch = useCallback(() => {
    setResults([]);
    setTotal(0);
    setOffset(0);
    setError(null);
  }, []);

  const loadMore = useCallback(
    async (query: string, filters?: SearchFilters) => {
      const newOffset = offset + limit;
      await searchMessages(query, filters, limit, newOffset);
    },
    [offset, limit, searchMessages]
  );

  const getFilteredResults = useCallback(
    (filterKey: keyof SearchFilters, filterValue: any): Message[] => {
      return results.filter((msg) => {
        switch (filterKey) {
          case 'from':
            return msg.contact_phone === filterValue;
          case 'type':
            return msg.message_type === filterValue;
          case 'hasReactions':
            return filterValue ? msg.reaction_count > 0 : msg.reaction_count === 0;
          case 'isDeleted':
            return msg.is_deleted === filterValue;
          case 'isForwarded':
            return msg.is_forwarded === filterValue;
          default:
            return true;
        }
      });
    },
    [results]
  );

  const getResultsByType = useCallback(
    (type: string): Message[] => {
      return results.filter((msg) => msg.message_type === type);
    },
    [results]
  );

  const getResultsByDate = useCallback(
    (dateFrom: string, dateTo: string): Message[] => {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime();

      return results.filter((msg) => {
        const msgDate = new Date(msg.created_at).getTime();
        return msgDate >= from && msgDate <= to;
      });
    },
    [results]
  );

  const exportResults = useCallback(
    async (format: 'json' | 'csv'): Promise<Blob> => {
      if (format === 'json') {
        const json = JSON.stringify(results, null, 2);
        return new Blob([json], { type: 'application/json' });
      } else if (format === 'csv') {
        const headers = [
          'ID',
          'Mensagem',
          'Tipo',
          'Contato',
          'De Mim',
          'Deletada',
          'Encaminhada',
          'Reações',
          'Data',
        ];
        const rows = results.map((msg) => [
          msg.id,
          msg.message_text || msg.caption || '',
          msg.message_type,
          msg.contact_phone,
          msg.is_from_me ? 'Sim' : 'Não',
          msg.is_deleted ? 'Sim' : 'Não',
          msg.is_forwarded ? 'Sim' : 'Não',
          msg.reaction_count,
          new Date(msg.created_at).toLocaleString('pt-BR'),
        ]);

        const csv = [
          headers.join(','),
          ...rows.map((row) =>
            row
              .map((cell) =>
                typeof cell === 'string' && cell.includes(',')
                  ? `"${cell}"`
                  : cell
              )
              .join(',')
          ),
        ].join('\n');

        return new Blob([csv], { type: 'text/csv' });
      }

      throw new Error('Unsupported export format');
    },
    [results]
  );

  return {
    results,
    loading,
    error,
    total,
    limit,
    offset,
    searchMessages,
    clearSearch,
    loadMore,
    getFilteredResults,
    getResultsByType,
    getResultsByDate,
    exportResults,
  };
}
