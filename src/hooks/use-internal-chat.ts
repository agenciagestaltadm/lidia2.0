"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatChannel,
  ChatMessage,
  ChatUser,
  ChatUserStatus,
  ChatTypingIndicator,
  ChatPinnedMessage,
  DirectConversation,
  SendMessageRequest,
  CreateChannelRequest,
  ChatSearchFilters,
  ChatSearchResult,
} from "@/types/internal-chat";

const supabase = createClient();

// Query keys
const chatKeys = {
  all: ["internal-chat"] as const,
  channels: () => [...chatKeys.all, "channels"] as const,
  channel: (id: string) => [...chatKeys.channels(), id] as const,
  messages: (channelId: string) => [...chatKeys.all, "messages", channelId] as const,
  directMessages: (userId: string) => [...chatKeys.all, "direct", userId] as const,
  pinned: (channelId: string) => [...chatKeys.all, "pinned", channelId] as const,
  search: (query: string) => [...chatKeys.all, "search", query] as const,
  users: () => [...chatKeys.all, "users"] as const,
};

// ============================================================
// HOOK: LISTAR CANAIS
// ============================================================

export function useChatChannels() {
  return useQuery({
    queryKey: chatKeys.channels(),
    queryFn: async (): Promise<ChatChannel[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Buscar canais do usuário
      const { data: memberships, error: membershipError } = await supabase
        .from("chat_channel_members")
        .select("channel_id, last_read_at, is_muted, role")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const channelIds = memberships?.map((m: { channel_id: string }) => m.channel_id) || [];

      if (channelIds.length === 0) return [];

      // Buscar detalhes dos canais
      const { data: channels, error: channelsError } = await supabase
        .from("chat_channels")
        .select("*")
        .in("id", channelIds)
        .eq("is_active", true)
        .order("is_general", { ascending: false })
        .order("last_message_at", { ascending: false });

      if (channelsError) throw channelsError;

      // Calcular mensagens não lidas
      const channelsWithUnread = await Promise.all(
        channels?.map(async (channel: any) => {
          const membership = memberships?.find((m: { channel_id: string }) => m.channel_id === channel.id);
          
          let unreadCount = 0;
          if (membership?.last_read_at) {
            const { count } = await supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id)
              .gt("created_at", membership.last_read_at);
            unreadCount = count || 0;
          } else {
            const { count } = await supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id);
            unreadCount = count || 0;
          }

          return {
            ...channel,
            unreadCount,
            isMuted: membership?.is_muted || false,
            lastReadAt: membership?.last_read_at,
            myRole: membership?.role || "member",
          };
        }) || []
      );

      return channelsWithUnread;
    },
  });
}

// ============================================================
// HOOK: BUSCAR MENSAGENS DE UM CANAL
// ============================================================

interface UseMessagesOptions {
  channelId: string | null;
  limit?: number;
}

export function useChannelMessages({ channelId, limit = 50 }: UseMessagesOptions) {
  return useQuery({
    queryKey: chatKeys.messages(channelId || ""),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!channelId) return [];

      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:profiles(user_id, full_name, avatar_url),
          reactions:chat_message_reactions(emoji, user_id),
          attachments:chat_attachments(*)
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Processar mensagens
      const processedMessages = messages?.map((msg: any) => {
        const reactionsMap = new Map<string, { count: number; users: string[] }>();
        
        msg.reactions?.forEach((r: { emoji: string; user_id: string }) => {
          if (!reactionsMap.has(r.emoji)) {
            reactionsMap.set(r.emoji, { count: 0, users: [] });
          }
          const reaction = reactionsMap.get(r.emoji)!;
          reaction.count++;
          reaction.users.push(r.user_id);
        });

        return {
          ...msg,
          sender: msg.sender ? {
            id: msg.sender.user_id,
            name: msg.sender.full_name,
            avatar: msg.sender.avatar_url,
          } : undefined,
          reactions: Array.from(reactionsMap.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            userReacted: false, // Será atualizado depois
            users: data.users,
          })),
        };
      }).reverse() || [];

      return processedMessages;
    },
    enabled: !!channelId,
  });
}

// ============================================================
// HOOK: BUSCAR MENSAGENS DIRETAS
// ============================================================

export function useDirectMessages(userId: string | null) {
  return useQuery({
    queryKey: chatKeys.directMessages(userId || ""),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!userId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:profiles(user_id, full_name, avatar_url),
          reactions:chat_message_reactions(emoji, user_id),
          attachments:chat_attachments(*)
        `)
        .or(`and(sender_id.eq.${user.id},direct_recipient_id.eq.${userId}),and(sender_id.eq.${userId},direct_recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return messages?.map((msg: any) => ({
        ...msg,
        sender: msg.sender ? {
          id: msg.sender.user_id,
          name: msg.sender.full_name,
          avatar: msg.sender.avatar_url,
        } : undefined,
      })) || [];
    },
    enabled: !!userId,
  });
}

// ============================================================
// HOOK: ENVIAR MENSAGEM
// ============================================================

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest): Promise<ChatMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Buscar company_id do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data: message, error } = await supabase
        .from("chat_messages")
        .insert({
          channel_id: data.channelId,
          direct_recipient_id: data.recipientId,
          sender_id: user.id,
          company_id: profile.company_id,
          type: data.type || "text",
          content: data.content,
          reply_to_id: data.replyToId,
          metadata: data.metadata,
        })
        .select("*")
        .single();

      if (error) throw error;

      return message;
    },
    onSuccess: (data, variables) => {
      if (variables.channelId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.channelId) });
        queryClient.invalidateQueries({ queryKey: chatKeys.channels() });
      }
      if (variables.recipientId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.directMessages(variables.recipientId) });
      }
    },
  });
}

// ============================================================
// HOOK: CRIAR CANAL
// ============================================================

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelRequest): Promise<ChatChannel> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Criar canal
      const { data: channel, error: channelError } = await supabase
        .from("chat_channels")
        .insert({
          company_id: profile.company_id,
          name: data.name,
          description: data.description,
          type: data.type,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (channelError) throw channelError;

      // Adicionar membros
      const members = [...(data.memberIds || []), user.id];
      const uniqueMembers = [...new Set(members)];

      const { error: membersError } = await supabase
        .from("chat_channel_members")
        .insert(
          uniqueMembers.map((memberId) => ({
            channel_id: channel.id,
            user_id: memberId,
            role: memberId === user.id ? "admin" : "member",
          }))
        );

      if (membersError) throw membersError;

      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels() });
    },
  });
}

// ============================================================
// HOOK: ADICIONAR REAÇÃO
// ============================================================

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_message_reactions")
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries afetadas
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

// ============================================================
// HOOK: MARCAR COMO LIDO
// ============================================================

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_channel_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", channelId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels() });
      queryClient.invalidateQueries({ queryKey: chatKeys.channel(channelId) });
    },
  });
}

// ============================================================
// HOOK: BUSCAR USUÁRIOS DA EMPRESA
// ============================================================

export function useCompanyUsers() {
  return useQuery({
    queryKey: chatKeys.users(),
    queryFn: async (): Promise<ChatUser[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Buscar company_id do usuário atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Buscar usuários da mesma empresa
      const { data: users, error } = await supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          email,
          avatar_url,
          role,
          status:chat_user_status(status, last_seen_at, custom_status)
        `)
        .eq("company_id", profile.company_id)
        .eq("is_active", true);

      if (error) throw error;

      return users?.map((u: any) => ({
        id: u.user_id,
        name: u.full_name,
        email: u.email,
        avatar: u.avatar_url,
        role: u.role,
        status: u.status?.[0]?.status || "offline",
        lastSeenAt: u.status?.[0]?.last_seen_at,
        customStatus: u.status?.[0]?.custom_status,
      })) || [];
    },
  });
}

// ============================================================
// HOOK: BUSCAR MENSAGENS FIXADAS
// ============================================================

export function usePinnedMessages(channelId: string | null) {
  return useQuery({
    queryKey: chatKeys.pinned(channelId || ""),
    queryFn: async (): Promise<ChatPinnedMessage[]> => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from("chat_pinned_messages")
        .select(`
          *,
          message:chat_messages(*, sender:profiles(user_id, full_name, avatar_url))
        `)
        .eq("channel_id", channelId)
        .order("pinned_at", { ascending: false });

      if (error) throw error;

      return data?.map((p: any) => ({
        ...p,
        message: p.message ? {
          ...p.message,
          sender: p.message.sender ? {
            id: p.message.sender.user_id,
            name: p.message.sender.full_name,
            avatar: p.message.sender.avatar_url,
          } : undefined,
        } : undefined,
      })) || [];
    },
    enabled: !!channelId,
  });
}

// ============================================================
// HOOK: REALTIME - SUBSCRIÇÕES
// ============================================================

export function useChatRealtime(channelId: string | null) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<ChatTypingIndicator[]>([]);

  useEffect(() => {
    if (!channelId) return;

    // Subscrever a novas mensagens
    const messagesSubscription = supabase
      .channel(`channel:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
        }
      )
      .subscribe();

    // Subscrever a reações
    const reactionsSubscription = supabase
      .channel(`reactions:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_message_reactions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [channelId, queryClient]);

  return { typingUsers };
}

// ============================================================
// HOOK: STATUS DO USUÁRIO
// ============================================================

export function useUserStatus() {
  const [onlineUsers, setOnlineUsers] = useState<ChatUserStatus[]>([]);

  useEffect(() => {
    // Subscrever a mudanças de status
    const statusSubscription = supabase
      .channel("user_status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_user_status",
        },
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setOnlineUsers((prev) => {
              const filtered = prev.filter((u) => u.userId !== payload.new.user_id);
              return [...filtered, payload.new as unknown as ChatUserStatus];
            });
          }
        }
      )
      .subscribe();

    // Atualizar status do usuário atual
    const updateStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;

      await supabase.from("chat_user_status").upsert({
        user_id: user.id,
        company_id: profile.company_id,
        status: "online",
        last_seen_at: new Date().toISOString(),
      });
    };

    updateStatus();

    // Atualizar status periodicamente
    const interval = setInterval(updateStatus, 30000);

    // Marcar como offline ao sair
    const handleBeforeUnload = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("chat_user_status")
        .update({ status: "offline" })
        .eq("user_id", user.id);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      statusSubscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const setUserStatus = useCallback(async (status: ChatUserStatus["status"], customStatus?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("chat_user_status")
      .update({ status, custom_status: customStatus, last_seen_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }, []);

  return { onlineUsers, setUserStatus };
}

// ============================================================
// HOOK: BUSCAR MENSAGENS
// ============================================================

export function useSearchMessages() {
  return useMutation({
    mutationFn: async ({ query, filters }: { query: string; filters?: ChatSearchFilters }): Promise<ChatSearchResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Usar a função de busca do PostgreSQL
      const { data: messages, error } = await supabase
        .rpc("search_messages", {
          p_company_id: profile.company_id,
          p_query: query,
          p_channel_id: filters?.channelId,
          p_user_id: filters?.userId,
          p_date_from: filters?.dateFrom,
          p_date_to: filters?.dateTo,
        });

      if (error) throw error;

      return {
        messages: messages || [],
        channels: [],
        users: [],
        totalCount: messages?.length || 0,
      };
    },
  });
}

// ============================================================
// HOOK: CONVERSAS DIRETAS (DMS)
// ============================================================

export function useDirectConversations() {
  return useQuery({
    queryKey: [...chatKeys.all, "direct-conversations"],
    queryFn: async (): Promise<DirectConversation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Buscar última mensagem com cada usuário
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:profiles(user_id, full_name, avatar_url),
          recipient:profiles!chat_messages_direct_recipient_id_fkey(user_id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},direct_recipient_id.eq.${user.id}`)
        .is("channel_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupar por conversa
      const conversationsMap = new Map<string, DirectConversation>();

      messages?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.direct_recipient_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            user: {
              id: otherUser.user_id,
              name: otherUser.full_name,
              avatar: otherUser.avatar_url,
            },
            lastMessage: msg,
            unreadCount: 0,
            isMuted: false,
            updatedAt: msg.created_at,
          });
        }
      });

      return Array.from(conversationsMap.values());
    },
  });
}

// ============================================================
// HOOK: STATUS DE LEITURA DAS MENSAGENS
// ============================================================

export function useMessageReadStatus(messageId: string | null) {
  return useQuery({
    queryKey: [...chatKeys.all, "read-status", messageId],
    queryFn: async (): Promise<{ userId: string; readAt: string }[]> => {
      if (!messageId) return [];

      const { data, error } = await supabase
        .from("chat_message_read_status")
        .select("user_id, read_at")
        .eq("message_id", messageId);

      if (error) throw error;

      return data?.map((r: { user_id: string; read_at: string | null }) => ({ userId: r.user_id, readAt: r.read_at })) || [];
    },
    enabled: !!messageId,
  });
}

// ============================================================
// HOOK: MARCAR MENSAGEM COMO LIDA
// ============================================================

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_message_read_status")
        .upsert({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString(),
        }, {
          onConflict: "message_id,user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

// ============================================================
// HOOK: INDICADOR DE DIGITAÇÃO
// ============================================================

export function useTypingIndicator() {
  const queryClient = useQueryClient();

  const setTyping = useCallback(async (channelId: string, isTyping: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isTyping) {
      await supabase
        .from("chat_typing_indicators")
        .upsert({
          channel_id: channelId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5000).toISOString(), // Expira em 5s
        }, {
          onConflict: "channel_id,user_id",
        });
    } else {
      await supabase
        .from("chat_typing_indicators")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
    }
  }, []);

  return { setTyping };
}

// ============================================================
// HOOK: BUSCAR QUEM ESTÁ DIGITANDO
// ============================================================

export function useTypingUsers(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);

  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }

    // Buscar inicial
    const fetchTyping = async () => {
      const { data } = await supabase
        .from("chat_typing_indicators")
        .select("user_id, profiles(full_name)")
        .eq("channel_id", channelId)
        .gt("expires_at", new Date().toISOString());

      const users = data?.map((t: any) => ({
        userId: t.user_id,
        name: t.profiles?.full_name || "Alguém",
      })) || [];

      setTypingUsers(users);
    };

    fetchTyping();

    // Subscrever a mudanças
    const subscription = supabase
      .channel(`typing:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing_indicators",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          fetchTyping();
        }
      )
      .subscribe();

    // Atualizar periodicamente para limpar expirados
    const interval = setInterval(fetchTyping, 2000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [channelId]);

  return typingUsers;
}

// ============================================================
// HOOK: FIXAR MENSAGEM
// ============================================================

export function usePinMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, channelId }: { messageId: string; channelId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_pinned_messages")
        .insert({
          message_id: messageId,
          channel_id: channelId,
          pinned_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.pinned(variables.channelId) });
    },
  });
}

// ============================================================
// HOOK: DESFIXAR MENSAGEM
// ============================================================

export function useUnpinMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pinnedMessageId, channelId }: { pinnedMessageId: string; channelId: string }) => {
      const { error } = await supabase
        .from("chat_pinned_messages")
        .delete()
        .eq("id", pinnedMessageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.pinned(variables.channelId) });
    },
  });
}

// ============================================================
// HOOK: MENÇÕES @USUARIO
// ============================================================

export function useMentions() {
  const extractMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map((m) => m.substring(1)) : [];
  }, []);

  const formatMentions = useCallback((text: string, users: ChatUser[]): { text: string; mentions: string[] } => {
    const mentions: string[] = [];
    let formattedText = text;

    users.forEach((user) => {
      const mentionPattern = new RegExp(`@${user.name.replace(/\s+/g, "")}`, "gi");
      if (mentionPattern.test(text)) {
        mentions.push(user.id);
        formattedText = formattedText.replace(
          mentionPattern,
          `<span class="mention" data-user-id="${user.id}">@${user.name}</span>`
        );
      }
    });

    return { text: formattedText, mentions };
  }, []);

  return { extractMentions, formatMentions };
}

// ============================================================
// HOOK: UPLOAD DE ANEXOS
// ============================================================

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async ({
      file,
      messageId
    }: {
      file: File;
      messageId: string
    }): Promise<{ url: string; type: string }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Upload do arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-attachments/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      // Registrar no banco
      const { error: dbError } = await supabase
        .from("chat_attachments")
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      return { url: publicUrl, type: file.type };
    },
  });
}

// ============================================================
// HOOK: NOTIFICAÇÕES DE MENSAGENS
// ============================================================

export function useChatNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_channel_members")
        .select("notification_count")
        .eq("user_id", user.id);

      if (!error && data) {
        const total = data.reduce((sum: number, item: { notification_count: number | null }) => sum + (item.notification_count || 0), 0);
        setUnreadCount(total);
      }
    };

    fetchUnreadCount();

    // Subscrever a notificações
    const subscription = supabase
      .channel("chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_channel_members",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    // Criar som simples usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  return { unreadCount, playNotificationSound };
}

// ============================================================
// HOOK: DELETAR MENSAGEM
// ============================================================

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", user.id); // Só pode deletar próprias mensagens

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

// ============================================================
// HOOK: EDITAR MENSAGEM
// ============================================================

export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("chat_messages")
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", user.id); // Só pode editar próprias mensagens

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
