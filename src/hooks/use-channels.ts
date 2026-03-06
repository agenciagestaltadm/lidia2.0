"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Channel {
  id: string;
  company_id: string;
  type: "WHATSAPP" | "EMAIL" | "SMS" | "OTHER";
  name: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  credentials: Record<string, unknown> | null;
  last_error: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
}

interface ChannelsState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export function useChannels() {
  const [state, setState] = useState<ChannelsState>({
    channels: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  const supabase = createClient();

  const fetchChannels = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch channels with company details
      const { data, error } = await supabase
        .from("channels")
        .select(`
          *,
          company:company_id (id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get total count
      const { count } = await supabase
        .from("channels")
        .select("*", { count: "exact", head: true });

      setState({
        channels: (data as Channel[]) || [],
        loading: false,
        error: null,
        totalCount: count || 0,
      });
    } catch (err) {
      console.error("Error fetching channels:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar canais",
      }));
    }
  }, [supabase]);

  const updateChannelStatus = useCallback(
    async (channelId: string, status: Channel["status"]): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("channels")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", channelId);

        if (error) throw error;

        await fetchChannels();
        return { success: true };
      } catch (err) {
        console.error("Error updating channel status:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar status",
        };
      }
    },
    [supabase, fetchChannels]
  );

  const deleteChannel = useCallback(
    async (channelId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("channels")
          .delete()
          .eq("id", channelId);

        if (error) throw error;

        await fetchChannels();
        return { success: true };
      } catch (err) {
        console.error("Error deleting channel:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao excluir canal",
        };
      }
    },
    [supabase, fetchChannels]
  );

  useEffect(() => {
    fetchChannels();

    // Subscribe to channels changes
    const channelsSubscription = supabase
      .channel("channels-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channels" },
        () => fetchChannels()
      )
      .subscribe();

    return () => {
      channelsSubscription.unsubscribe();
    };
  }, [fetchChannels, supabase]);

  const refetch = useCallback(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    ...state,
    refetch,
    updateChannelStatus,
    deleteChannel,
  };
}
