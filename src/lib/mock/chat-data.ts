import { Conversation, Message, Contact, ChatTemplate, InternalNote, Task, QuickReply } from '@/types/chat';

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '+55 11 98765-4321',
    avatar: undefined,
    isRegistered: true,
    source: 'whatsapp',
    email: 'joao.silva@email.com',
    tags: ['VIP', 'Cliente Antigo'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-09'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '+55 11 91234-5678',
    avatar: undefined,
    isRegistered: true,
    source: 'whatsapp',
    tags: ['Novo Cliente'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-09'),
  },
  {
    id: '3',
    name: 'Pedro Costa',
    phone: '+55 21 99876-5432',
    avatar: undefined,
    isRegistered: false,
    source: 'whatsapp',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-09'),
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    phone: '+55 31 98765-1234',
    avatar: undefined,
    isRegistered: true,
    source: 'whatsapp',
    email: 'ana.oliveira@empresa.com',
    tags: ['B2B'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-09'),
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    phone: '+55 41 99999-8888',
    avatar: undefined,
    isRegistered: true,
    source: 'whatsapp',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-09'),
  },
  {
    id: '6',
    name: 'Juliana Lima',
    phone: '+55 51 98888-7777',
    avatar: undefined,
    isRegistered: true,
    source: 'whatsapp',
    tags: ['Suporte Técnico'],
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-09'),
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    contact: mockContacts[0],
    status: 'open',
    priority: 'high',
    lastMessage: {
      content: 'Olá, preciso de ajuda com meu pedido #1234. Ele ainda não chegou!',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
      type: 'text',
      isFromMe: false,
      status: 'read',
    },
    unreadCount: 3,
    assignedTo: {
      id: 'agent-1',
      name: 'Agente Teste',
      avatar: undefined,
    },
    tags: ['Urgente', 'Pedido'],
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 'conv-2',
    contact: mockContacts[1],
    status: 'open',
    priority: 'medium',
    lastMessage: {
      content: 'Aguardando retorno sobre o orçamento que solicitei ontem',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      type: 'text',
      isFromMe: false,
      status: 'delivered',
    },
    unreadCount: 1,
    tags: ['Orçamento'],
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'conv-3',
    contact: mockContacts[2],
    status: 'pending',
    priority: 'low',
    lastMessage: {
      content: 'Quero saber mais sobre os planos disponíveis',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      type: 'text',
      isFromMe: false,
      status: 'read',
    },
    unreadCount: 0,
    tags: ['Vendas'],
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'conv-4',
    contact: mockContacts[3],
    status: 'resolved',
    priority: 'high',
    lastMessage: {
      content: 'Problema resolvido, obrigada pelo atendimento!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'text',
      isFromMe: false,
      status: 'read',
    },
    unreadCount: 0,
    assignedTo: {
      id: 'agent-1',
      name: 'Agente Teste',
      avatar: undefined,
    },
    tags: ['Suporte', 'Resolvido'],
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'conv-5',
    contact: mockContacts[4],
    status: 'open',
    priority: 'urgent',
    lastMessage: {
      content: 'AFS, VENDI! KSKS 🎉',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      type: 'text',
      isFromMe: true,
      status: 'read',
    },
    unreadCount: 0,
    assignedTo: {
      id: 'agent-1',
      name: 'Agente Teste',
      avatar: undefined,
    },
    tags: ['Vendas', 'Celebrar'],
    channel: 'whatsapp',
    isTyping: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'conv-6',
    contact: mockContacts[5],
    status: 'open',
    priority: 'medium',
    lastMessage: {
      content: 'KKK VIRA HONI',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      type: 'text',
      isFromMe: false,
      status: 'delivered',
    },
    unreadCount: 2,
    tags: ['Dúvida'],
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000),
  },
];

// Mock Messages for Conversation 1
export const mockMessagesConv1: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    content: 'Olá! Bem-vindo à nossa loja. Como posso ajudar?',
    type: 'text',
    status: 'read',
    isFromMe: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    content: 'Oi! Fiz um pedido ontem e gostaria de saber quando chega',
    type: 'text',
    status: 'read',
    isFromMe: false,
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    content: 'Claro! Qual o número do pedido?',
    type: 'text',
    status: 'read',
    isFromMe: true,
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000 + 5 * 60 * 1000),
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    content: 'É o #1234',
    type: 'text',
    status: 'read',
    isFromMe: false,
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    content: 'Vou verificar para você, só um momento...',
    type: 'text',
    status: 'read',
    isFromMe: true,
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000 + 2 * 60 * 1000),
  },
  {
    id: 'msg-6',
    conversationId: 'conv-1',
    content: 'Olá, preciso de ajuda com meu pedido #1234. Ele ainda não chegou!',
    type: 'text',
    status: 'read',
    isFromMe: false,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
];

// Mock Messages for Conversation 5 (with audio)
export const mockMessagesConv5: Message[] = [
  {
    id: 'msg-audio-1',
    conversationId: 'conv-5',
    content: '',
    type: 'audio',
    status: 'read',
    isFromMe: true,
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    metadata: {
      duration: 15,
      mimeType: 'audio/ogg',
    },
  },
  {
    id: 'msg-7',
    conversationId: 'conv-5',
    content: 'AFS, VENDI! KSKS 🎉',
    type: 'text',
    status: 'read',
    isFromMe: true,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
];

// Mock Templates
export const mockTemplates: ChatTemplate[] = [
  {
    id: 'tpl-1',
    name: 'boas_vindas',
    category: 'UTILITY',
    language: 'pt_BR',
    components: [
      {
        type: 'BODY',
        text: 'Olá {{1}}! Bem-vindo à nossa empresa. Como podemos ajudar você hoje?',
        example: {
          body_text: [['João']],
        },
      },
    ],
    status: 'APPROVED',
  },
  {
    id: 'tpl-2',
    name: 'status_pedido',
    category: 'UTILITY',
    language: 'pt_BR',
    components: [
      {
        type: 'BODY',
        text: 'Seu pedido #{{1}} está {{2}}. Previsão de entrega: {{3}}.',
        example: {
          body_text: [['1234', 'em transporte', '10/03/2024']],
        },
      },
    ],
    status: 'APPROVED',
  },
  {
    id: 'tpl-3',
    name: 'promocao',
    category: 'MARKETING',
    language: 'pt_BR',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🔥 Promoção Especial!',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}}! Temos uma oferta especial para você: {{2}}. Válido até {{3}}.',
        example: {
          body_text: [['Maria', '20% de desconto', '15/03/2024']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Quero aproveitar!',
          },
          {
            type: 'URL',
            text: 'Ver oferta',
            url: 'https://exemplo.com/promo',
          },
        ],
      },
    ],
    status: 'APPROVED',
  },
];

// Mock Internal Notes
export const mockNotes: InternalNote[] = [
  {
    id: 'note-1',
    conversationId: 'conv-1',
    content: 'Cliente está insatisfeito com atraso. Priorizar resolução.',
    createdBy: {
      id: 'agent-1',
      name: 'Agente Teste',
    },
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: 'note-2',
    conversationId: 'conv-1',
    content: 'Verificado: pedido #1234 saiu para entrega hoje pela manhã.',
    createdBy: {
      id: 'agent-2',
      name: 'Supervisor',
    },
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    conversationId: 'conv-1',
    title: 'Verificar status do pedido #1234',
    description: 'Entrar em contato com transportadora',
    status: 'in_progress',
    priority: 'high',
    assignedTo: {
      id: 'agent-1',
      name: 'Agente Teste',
    },
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    createdBy: {
      id: 'agent-1',
      name: 'Agente Teste',
    },
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
  },
  {
    id: 'task-2',
    conversationId: 'conv-2',
    title: 'Enviar orçamento detalhado',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdBy: {
      id: 'agent-1',
      name: 'Agente Teste',
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
];

// Mock Quick Replies
export const mockQuickReplies: QuickReply[] = [
  { id: 'qr-1', shortcut: '/ola', message: 'Olá! Como posso ajudar você hoje?', category: 'Saudações' },
  { id: 'qr-2', shortcut: '/agrad', message: 'Obrigado por entrar em contato conosco!', category: 'Agradecimentos' },
  { id: 'qr-3', shortcut: '/aguarde', message: 'Só um momento, por favor. Vou verificar isso para você.', category: 'Atendimento' },
  { id: 'qr-4', shortcut: '/horario', message: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.', category: 'Informações' },
  { id: 'qr-5', shortcut: '/despedida', message: 'Foi um prazer atendê-lo! Tenha um ótimo dia! 😊', category: 'Saudações' },
  { id: 'qr-6', shortcut: '/encerrar', message: 'Caso não tenha mais dúvidas, vou encerrar este atendimento. Fique à vontade para nos contactar quando precisar!', category: 'Atendimento' },
];

// Helper functions
export const getConversationMessages = (conversationId: string): Message[] => {
  if (conversationId === 'conv-1') return mockMessagesConv1;
  if (conversationId === 'conv-5') return mockMessagesConv5;
  return [];
};

export const getConversationById = (id: string): Conversation | undefined => {
  return mockConversations.find(c => c.id === id);
};

export const filterConversations = (
  conversations: Conversation[],
  filter: 'all' | 'open' | 'pending' | 'resolved',
  searchQuery: string
): Conversation[] => {
  return conversations.filter(conv => {
    const matchesFilter = filter === 'all' || conv.status === filter;
    const matchesSearch = 
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.phone.includes(searchQuery) ||
      conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
};
