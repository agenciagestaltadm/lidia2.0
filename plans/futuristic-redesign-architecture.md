# Arquitetura de Design Futurista - LIDIA 2.0

## Sistema de Cores

```mermaid
graph TD
    A[Paleta Futurista] --> B[Backgrounds]
    A --> C[Neon Accents]
    A --> D[Estados]
    
    B --> B1[Slate 950 #020617<br/>Deep space]
    B --> B2[Slate 900 #0f172a<br/>Primary bg]
    B --> B3[Slate 800 #1e293b<br/>Secondary]
    
    C --> C1[Cyan Neon #00f0ff<br/>Primary accent]
    C --> C2[Violet #8b5cf6<br/>Secondary accent]
    C --> C3[Fuchsia #d946ef<br/>Tertiary accent]
    C --> C4[Emerald #10b981<br/>Success]
    
    D --> D1[Red 500 #ef4444<br/>Error]
    D --> D2[Amber 500 #f59e0b<br/>Warning]
    D --> D3[Cyan 400 #22d3ee<br/>Info]
```

## Estrutura de Componentes

```mermaid
graph TD
    subgraph UI[Futuristic UI Kit]
        G1[GlassCard<br/>backdrop-blur-xl<br/>bg-white/5<br/>border-white/10]
        G2[NeonButton<br/>glow-cyan hover:glow-lg<br/>gradient cyan-violet]
        G3[GlowBadge<br/>neon border<br/>pulse animation]
        G4[AnimatedInput<br/>floating label<br/>focus glow]
    end
    
    subgraph Animation[Animation System]
        A1[PageTransition<br/>AnimatePresence]
        A2[StaggerChildren<br/>delay stagger]
        A3[FloatingParticles<br/>random motion]
        A4[GradientMesh<br/>animated bg]
    end
    
    subgraph Layout[Responsive Layout]
        L1[BentoGrid<br/>auto-fit minmax]
        L2[NestedSidebar<br/>collapsible tree]
        L3[MobileDrawer<br/>gesture support]
    end
```

## Flow de Navegação

```mermaid
graph LR
    subgraph Auth[Authentication]
        Login[Login Page<br/>particles + mesh bg<br/>glassmorphism form]
    end
    
    subgraph Dashboard[Dashboard Central]
        Bento[Bento Grid<br/>6 widget cards<br/>staggered entrance]
        Charts[DataViz<br/>Recharts + glow tooltips]
    end
    
    subgraph Pages[Module Pages]
        Analytics[Analytics<br/>metrics + trends]
        Users[User Management<br/>table + filters]
        Settings[Settings<br/>organized sections]
        Notifications[Notifications<br/>interactive list]
        Profile[Profile<br/>editable form]
    end
    
    Login -->|auth success| Dashboard
    Dashboard -->|navigate| Pages
    Pages -->|sidebar| Pages
```

## Glassmorphism Specification

```css
/* Base Glass Effect */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Neon Glow Effects */
.glow-cyan {
  box-shadow: 
    0 0 20px rgba(0, 240, 255, 0.3),
    0 0 40px rgba(0, 240, 255, 0.1);
}

.glow-violet {
  box-shadow: 
    0 0 20px rgba(139, 92, 246, 0.3),
    0 0 40px rgba(139, 92, 246, 0.1);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Responsividade

| Breakpoint | Sidebar | Grid | Typography |
|------------|---------|------|------------|
| Mobile (<640px) | Drawer slide-out | 1 column | 14px base |
| Tablet (640-1024px) | Collapsible rail | 2 columns | 15px base |
| Desktop (>1024px) | Full expanded | 3-4 columns | 16px base |

## Estrutura de Arquivos

```
src/
├── app/
│   ├── login/page.tsx           # Auth com animações
│   ├── (dashboard)/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Dashboard layout
│   │   │   ├── central/page.tsx # Bento grid
│   │   │   ├── analytics/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
├── components/
│   ├── ui/
│   │   ├── glass-card.tsx
│   │   ├── neon-button.tsx
│   │   ├── glow-badge.tsx
│   │   └── animated-input.tsx
│   ├── animations/
│   │   ├── page-transition.tsx
│   │   ├── floating-particles.tsx
│   │   └── gradient-mesh.tsx
│   ├── sidebar.tsx              # Nested nav
│   ├── header.tsx               # Futuristic
│   └── bento-grid.tsx           # Dashboard layout
├── lib/
│   ├── animations.ts            # Framer variants
│   └── utils.ts
└── styles/
    └── futuristic-theme.css     # Custom properties
```
