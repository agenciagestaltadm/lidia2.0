/**
 * Design Tokens - Kanban
 * Sistema de design consistente para todos os componentes do Kanban
 */

// ============================================
// CORES
// ============================================
export const colors = {
  // Prioridades
  priority: {
    LOW: {
      bg: "bg-slate-500/15",
      bgSolid: "bg-slate-500",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/30",
      hover: "hover:bg-slate-500/25",
      label: "Baixa",
      icon: "ArrowDown",
    },
    MEDIUM: {
      bg: "bg-amber-500/15",
      bgSolid: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/30",
      hover: "hover:bg-amber-500/25",
      label: "Média",
      icon: "Minus",
    },
    HIGH: {
      bg: "bg-orange-500/15",
      bgSolid: "bg-orange-500",
      text: "text-orange-700 dark:text-orange-300",
      border: "border-orange-500/30",
      hover: "hover:bg-orange-500/25",
      label: "Alta",
      icon: "ArrowUp",
    },
    URGENT: {
      bg: "bg-red-500/15",
      bgSolid: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-500/30",
      hover: "hover:bg-red-500/25",
      label: "Urgente",
      icon: "AlertCircle",
    },
  },

  // Tipos de Card
  cardType: {
    TASK: {
      icon: "CheckCircle2",
      color: "#3b82f6",
      bg: "bg-blue-500/15",
      text: "text-blue-700 dark:text-blue-300",
      label: "Tarefa",
    },
    BUG: {
      icon: "Bug",
      color: "#ef4444",
      bg: "bg-red-500/15",
      text: "text-red-700 dark:text-red-300",
      label: "Bug",
    },
    FEATURE: {
      icon: "Sparkles",
      color: "#8b5cf6",
      bg: "bg-violet-500/15",
      text: "text-violet-700 dark:text-violet-300",
      label: "Funcionalidade",
    },
    EPIC: {
      icon: "Rocket",
      color: "#f59e0b",
      bg: "bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-300",
      label: "Épico",
    },
    STORY: {
      icon: "BookOpen",
      color: "#10b981",
      bg: "bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-300",
      label: "História",
    },
  },

  // Estados
  state: {
    default: {
      bg: "bg-white dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-700",
      text: "text-slate-900 dark:text-slate-100",
    },
    hover: {
      bg: "hover:bg-slate-50 dark:hover:bg-slate-700/50",
      border: "hover:border-emerald-500/50",
    },
    active: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    dragging: {
      bg: "bg-white dark:bg-slate-800",
      border: "border-emerald-500",
      shadow: "shadow-xl",
      opacity: "opacity-90",
    },
    completed: {
      bg: "bg-slate-100 dark:bg-slate-800/50",
      text: "text-slate-500 dark:text-slate-400",
      decoration: "line-through",
    },
  },

  // WIP Limit
  wip: {
    normal: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    warning: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
    },
    exceeded: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
    },
  },

  // Labels/Etiquetas
  label: [
    { name: "Vermelho", color: "#ef4444", bg: "bg-red-500" },
    { name: "Laranja", color: "#f97316", bg: "bg-orange-500" },
    { name: "Âmbar", color: "#f59e0b", bg: "bg-amber-500" },
    { name: "Verde", color: "#22c55e", bg: "bg-green-500" },
    { name: "Esmeralda", color: "#10b981", bg: "bg-emerald-500" },
    { name: "Ciano", color: "#06b6d4", bg: "bg-cyan-500" },
    { name: "Azul", color: "#3b82f6", bg: "bg-blue-500" },
    { name: "Índigo", color: "#6366f1", bg: "bg-indigo-500" },
    { name: "Violeta", color: "#8b5cf6", bg: "bg-violet-500" },
    { name: "Roxo", color: "#a855f7", bg: "bg-purple-500" },
    { name: "Rosa", color: "#ec4899", bg: "bg-pink-500" },
    { name: "Rosa Choque", color: "#f43f5e", bg: "bg-rose-500" },
    { name: "Cinza", color: "#6b7280", bg: "bg-gray-500" },
  ],
};

// ============================================
// ESPAÇAMENTO
// ============================================
export const spacing = {
  column: {
    width: "w-80", // 320px - largura padrão das colunas
    minWidth: "min-w-[320px]",
    gap: "gap-4",
    padding: "p-3",
    borderRadius: "rounded-xl",
  },
  card: {
    padding: "p-3",
    gap: "gap-2",
    borderRadius: "rounded-lg",
    shadow: "shadow-sm hover:shadow-md",
  },
  modal: {
    padding: "p-6",
    gap: "gap-4",
    borderRadius: "rounded-2xl",
    maxHeight: "max-h-[90vh]",
  },
  header: {
    height: "h-14",
    padding: "px-4 py-3",
  },
};

// ============================================
// TIPOGRAFIA
// ============================================
export const typography = {
  column: {
    title: "font-semibold text-sm text-slate-800 dark:text-slate-200",
    count: "text-xs text-slate-500 font-medium",
  },
  card: {
    title: "font-medium text-sm text-slate-800 dark:text-slate-200 leading-snug",
    description: "text-xs text-slate-500 dark:text-slate-400 line-clamp-2",
    meta: "text-xs text-slate-400 dark:text-slate-500",
  },
  badge: {
    default: "text-xs font-medium px-2 py-0.5 rounded-full",
    priority: "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
  },
};

// ============================================
// ANIMAÇÕES
// ============================================
export const animations = {
  card: {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, y: -8 },
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  column: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  modal: {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    content: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { duration: 0.2, ease: "easeOut" },
    },
  },
  drag: {
    overlay: {
      scale: 1.02,
      rotate: 2,
      shadow: "shadow-2xl",
      opacity: 0.9,
    },
    placeholder: {
      opacity: 0.4,
      scale: 0.98,
    },
  },
  stagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2 },
    },
  },
};

// ============================================
// Z-INDEX SCALE
// ============================================
export const zIndex = {
  column: 10,
  card: 20,
  cardHover: 25,
  dragOverlay: 50,
  dropdown: 60,
  dropdownMenu: 70,
  modal: 100,
  modalOverlay: 99,
  toast: 110,
  tooltip: 120,
};

// ============================================
// SOMBRAS
// ============================================
export const shadows = {
  card: "shadow-sm hover:shadow-md transition-shadow duration-200",
  cardHover: "shadow-lg",
  modal: "shadow-2xl",
  dragOverlay: "shadow-2xl shadow-black/20",
  dropdown: "shadow-lg shadow-black/10",
};

// ============================================
// BORDAS
// ============================================
export const borders = {
  card: "border border-slate-200 dark:border-slate-700",
  cardHover: "hover:border-emerald-500/50",
  column: "border border-slate-200/50 dark:border-slate-700/50",
  modal: "border border-slate-200 dark:border-slate-700",
  active: "border-emerald-500",
};

// ============================================
// HELPERS
// ============================================
export const getPriorityStyles = (priority: keyof typeof colors.priority) => {
  return colors.priority[priority] || colors.priority.MEDIUM;
};

export const getCardTypeStyles = (type: keyof typeof colors.cardType) => {
  return colors.cardType[type] || colors.cardType.TASK;
};

export const getWipStyles = (current: number, limit: number) => {
  if (current > limit) return colors.wip.exceeded;
  if (current >= limit * 0.8) return colors.wip.warning;
  return colors.wip.normal;
};

// ============================================
// TEMAS
// ============================================
export const theme = {
  light: {
    bg: {
      primary: "bg-white",
      secondary: "bg-slate-50",
      tertiary: "bg-slate-100",
    },
    text: {
      primary: "text-slate-900",
      secondary: "text-slate-600",
      tertiary: "text-slate-400",
    },
    border: "border-slate-200",
  },
  dark: {
    bg: {
      primary: "bg-slate-900",
      secondary: "bg-slate-800",
      tertiary: "bg-slate-700",
    },
    text: {
      primary: "text-slate-100",
      secondary: "text-slate-300",
      tertiary: "text-slate-500",
    },
    border: "border-slate-700",
  },
};

// ============================================
// CONSTANTES
// ============================================
export const constants = {
  COLUMN_WIDTH: 320, // pixels
  COLUMN_MIN_WIDTH: 280,
  COLUMN_MAX_WIDTH: 400,
  CARD_MAX_HEIGHT: 200, // pixels
  BOARD_MAX_COLUMNS: 10,
  WIP_LIMIT_DEFAULT: 10,
  ANIMATION_DURATION: 200, // ms
  DRAG_ACTIVATION_DISTANCE: 5, // pixels
  SCROLL_SPEED: 15, // pixels per frame
};
