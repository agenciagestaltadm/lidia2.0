# Reformulação do Dashboard Central - Documentação

## Resumo da Implementação

Esta documentação descreve a reformulação completa do dashboard central do sistema LIDIA 2.0, focada em modernização visual, integração de dados reais e isolamento rigoroso por empresa.

---

## 🎯 Objetivos Alcançados

### 1. Modernização dos Componentes de Visualização

**Biblioteca Adotada:** ApexCharts

**Componentes Criados:**
- [`ApexPieChart`](src/components/analytics/widgets/ApexPieChart.tsx) - Gráficos de pizza/donut modernos
- [`ApexLineChart`](src/components/analytics/widgets/ApexLineChart.tsx) - Gráficos de linha/área com zoom e pan
- [`ApexBarChart`](src/components/widgets/ApexBarChart.tsx) - Gráficos de barras verticais/horizontais

**Features Implementadas:**
- Animações suaves e fluidas
- Tooltips interativos ricos
- Zoom e pan em gráficos de linha
- Gradientes de cores modernos
- Suporte completo a temas dark/light
- Responsividade nativa
- Legendas configuráveis

### 2. Integração de Dados Reais

**Hooks Atualizados:**
- [`useAttendanceByStatus`](src/hooks/use-analytics.ts) - Atendimentos por status
- [`useAttendanceByUser`](src/hooks/use-analytics.ts) - Atendimentos por usuário
- [`useAttendanceByChannel`](src/hooks/use-analytics.ts) - Atendimentos por canal
- [`useAttendanceEvolution`](src/hooks/use-analytics.ts) - Evolução temporal
- [`useSummaryMetrics`](src/hooks/use-analytics.ts) - Métricas de resumo
- [`useTeamPerformance`](src/hooks/use-analytics.ts) - Performance da equipe

### 3. Filtro Rigoroso por Empresa

**Hook Criado:** [`useCompanyEmails`](src/hooks/use-company-emails.ts)

**Características de Segurança:**
- Filtro obrigatório por `company_id` em todas as queries
- Verificação de autenticação antes de buscar dados
- Isolamento total entre empresas via RLS (Row Level Security)
- Logs de debug para auditoria

### 4. Remoção de Dados Hardcoded

**Eliminados:**
- ❌ Referências a "CALVES PIZZA" nos dados mockados
- ❌ Referências a "calvespizza" em canais
- ❌ Dados de demonstração com emails externos
- ❌ Fallback com dados de exemplo em `useTeamPerformance`

### 5. Listagem Dinâmica de E-mails Corporativos

**Componente Criado:** [`CompanyEmailsWidget`](src/components/analytics/CompanyEmailsWidget.tsx)

**Features:**
- Busca dinâmica de usuários da empresa atual
- Exibição de nome, email e cargo
- Badges coloridos por tipo de usuário
- Animações de entrada
- Estado vazio amigável
- Scroll para listas longas

---

## 📁 Arquivos Modificados/Criados

### Novos Arquivos
```
src/components/analytics/widgets/
├── ApexPieChart.tsx          # Gráfico de pizza/donut moderno
├── ApexLineChart.tsx         # Gráfico de linha/área
└── ApexBarChart.tsx          # Gráfico de barras

src/components/analytics/
└── CompanyEmailsWidget.tsx   # Listagem de emails corporativos

src/hooks/
└── use-company-emails.ts     # Hook para buscar emails da empresa

docs/
└── DASHBOARD_REFACTORING.md  # Esta documentação

.env.local                     # Variáveis de ambiente para build
```

### Arquivos Modificados
```
src/app/(dashboard)/app/central/page.tsx    # Página central reformulada
src/app/(dashboard)/app/layout.tsx          # Adicionado QueryClientProvider
src/components/analytics/index.ts           # Exportações dos novos componentes
src/hooks/index.ts                          # Exportação do useCompanyEmails
src/hooks/use-dashboard-layout.ts           # Adicionado widget company-emails
src/hooks/use-analytics.ts                  # Removido fallback de demonstração
```

---

## 🎨 Design System

### Cores Utilizadas nos Gráficos
```typescript
const CHART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];
```

### Temas
- **Dark Mode:** Background `#0a0a0a`, texto `slate-200`
- **Light Mode:** Background `white`, texto `slate-800`

### Responsividade
- Grid adaptativo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 🔒 Segurança e Isolamento

### Filtros Implementados
1. **Autenticação:** Apenas usuários logados acessam dados
2. **Company ID:** Todas as queries filtram por `company_id`
3. **RLS:** Row Level Security do Supabase ativo
4. **Enabled:** Hooks só executam quando `companyId` existe

### Exemplo de Query Segura
```typescript
const { data } = await supabase
  .from("tickets")
  .select("status")
  .eq("company_id", user.companyId)  // Filtro obrigatório
  .gte("created_at", startDate)
  .lte("created_at", endDate);
```

---

## 📊 Widgets Disponíveis

| Widget | Tipo | Dados |
|--------|------|-------|
| Resumo (Cards) | Cards | Total, Ativos, Receptivos, Novos Contatos, TMA |
| Atendimento por Fila | Donut Chart | Percentuais por fila |
| Atendimento por Usuário | Donut Chart | Distribuição % por agente |
| Atendimento por Status | Donut Chart | Abertos, Pendentes, Fechados |
| Atendimento por Canal (Conexão) | Donut Chart | WhatsApp, Email, SMS |
| Atendimento por Canal (Nome) | Donut Chart | Por nome do canal |
| Atendimento por Demanda | Donut Chart | (placeholder) |
| Evolução de Atendimentos | Area Chart | Série temporal |
| Evolução de Valores | Line Chart | Série temporal |
| Evolução por Canal | Bar Chart | Barras temporais |
| Desempenho da Equipe | Tabela | Métricas por agente |
| E-mails Corporativos | List | Usuários da empresa |

---

## 🚀 Como Usar

### Adicionar Novo Widget
1. Criar componente em `src/components/analytics/widgets/`
2. Exportar em `src/components/analytics/index.ts`
3. Adicionar tipo em `src/hooks/use-dashboard-layout.ts`
4. Adicionar ao layout padrão
5. Importar e usar na página central

### Exemplo de Uso do ApexPieChart
```tsx
<ApexPieChart
  title="Atendimento por Status"
  data={[
    { name: "Abertos", value: 50, color: "#10b981" },
    { name: "Pendentes", value: 30, color: "#f59e0b" },
    { name: "Fechados", value: 20, color: "#3b82f6" },
  ]}
  type="donut"
  showLegend={true}
/>
```

---

## 🧪 Testes

### Build
```bash
npm run build
```

### Desenvolvimento
```bash
npm run dev
```

### Variáveis de Ambiente Necessárias
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-instancia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

---

## 📈 Melhorias Futuras

- [ ] Adicionar exportação de relatórios (PDF/Excel)
- [ ] Implementar comparação de períodos
- [ ] Adicionar gráficos de radar para análise multivariada
- [ ] Implementar dashboards customizáveis por usuário
- [ ] Adicionar notificações de alertas de métricas

---

## 📝 Notas Técnicas

### SSR e Hydration
- Todos os hooks verificam `typeof window !== "undefined"`
- Gráficos usam `dynamic` import com `ssr: false`
- Estado de `mounted` controla renderização inicial

### Performance
- React Query com stale time de 5 minutos
- Refetch automático em focus da janela
- Cache por company_id e dateRange

### Acessibilidade
- Cores com contraste adequado
- Labels descritivos em todos os gráficos
- Estados de loading claros

---

**Data da Implementação:** 09/03/2026  
**Versão:** 2.0.0  
**Autor:** Kilo Code
