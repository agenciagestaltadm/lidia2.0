# Plano: Dashboard Analítico Central para Agentes

## Estrutura do Banco de Dados (Schema Analisado)

### Tabelas Relevantes:
- `tickets` - Atendimentos (status: OPEN, PENDING, CLOSED)
- `contacts` - Contatos
- `channels` - Canais (type: WHATSAPP, EMAIL, SMS)
- `profiles` - Usuários/agentes
- `companies` - Empresas (tenant)

## Componentes a Desenvolver

### 1. Hooks de Dados Analíticos
```
src/hooks/use-analytics.ts
- useAttendanceByQueue
- useAttendanceByUser
- useAttendanceByStatus
- useAttendanceByChannel
- useAttendanceByDemand
- useChannelEvolution
- useAttendanceEvolution
- useValuesEvolution
- useSummaryCards
- useTeamPerformance
```

### 2. Componentes de UI
```
src/components/analytics/
- DateRangePicker.tsx       # Seletor de período
- PanelCustomizer.tsx       # Personalizar painéis (drag-drop)
- SummaryCards.tsx          # Cards de resumo
- PieChartWidget.tsx        # Gráficos de pizza
- BarChartWidget.tsx        # Gráficos de barras
- LineChartWidget.tsx       # Gráficos de linha
- TeamPerformanceTable.tsx  # Tabela de desempenho
- WidgetContainer.tsx       # Container de widget com loading state
```

### 3. Página Central Atualizada
```
src/app/(dashboard)/app/central/page.tsx
```

## Especificações dos Módulos

### Seletor de Período
- Campos: Data Início e Data Fim
- Formato: DD/MM/AAAA
- Botão GERAR para aplicar filtros
- Estado compartilhado entre todos os widgets

### Personalizar Painéis
- Drag-and-drop para reorganizar
- Toggle de visibilidade por widget
- Persistência em localStorage
- Botão "Restaurar Padrão"

### Widgets Analíticos

| Widget | Tipo | Dados |
|--------|------|-------|
| Atendimento por Fila | Pizza | Percentuais por fila ou "Não informado" |
| Atendimento por Usuário | Pizza | Distribuição % (ex: CALVES PIZZA 64,9%) |
| Atendimento por Status | Pizza | Abertos 59,2%, Pendentes 24,7%, Fechados 16,1% |
| Atendimento por Canal (Conexão) | Pizza | WhatsApp Official 100% |
| Atendimento por Canal (Nome) | Pizza | calves pizza 100% |
| Atendimento por Demanda | Estado Vazio | "Sem dados" quando vazio |
| Evolução por Canal | Barras | Temporal 03/03 a 09/03/2026 |
| Evolução de Atendimentos | Área/Line | Pico 04/03 (~800 atendimentos) |
| Evolução de Valores | Line | Próximo de zero |

### Cards de Resumo
- Total Atendimentos: 1323
- Ativo: 952
- Receptivo: 371
- Novos Contatos: 823
- TMA: 1 minuto
- Tempo Médio 1ª Resposta: 1 minuto

### Tabela Desempenho da Equipe
Colunas:
- Usuário
- Pendentes
- Atendendo
- Finalizados
- Total
- Média de Avaliações
- Tempo Médio 1ª Resposta
- Tempo Médio de Atendimento (TMA)

Dados exemplo:
- Não informado: 77 pendentes, 0 atendendo, 782 finalizados, total 859
- CALVES PIZZA: 250 pendentes, 213 atendendo, 1 finalizado, total 464, 3min 1ª resposta, 2min TMA

## Queries Supabase Necessárias

### 1. Atendimentos por Status
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM tickets
WHERE company_id = :company_id
  AND created_at BETWEEN :start_date AND :end_date
GROUP BY status
```

### 2. Atendimentos por Usuário
```sql
SELECT 
  p.full_name,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM tickets t
JOIN profiles p ON t.responsible_id = p.user_id
WHERE t.company_id = :company_id
  AND t.created_at BETWEEN :start_date AND :end_date
GROUP BY p.full_name
```

### 3. Evolução Temporal
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM tickets
WHERE company_id = :company_id
  AND created_at BETWEEN :start_date AND :end_date
GROUP BY DATE(created_at)
ORDER BY date
```

### 4. Performance da Equipe
```sql
SELECT 
  p.full_name,
  p.email,
  COUNT(*) FILTER (WHERE t.status = 'PENDING') as pendentes,
  COUNT(*) FILTER (WHERE t.status = 'OPEN') as atendendo,
  COUNT(*) FILTER (WHERE t.status = 'CLOSED') as finalizados,
  COUNT(*) as total
FROM tickets t
JOIN profiles p ON t.responsible_id = p.user_id
WHERE t.company_id = :company_id
  AND t.created_at BETWEEN :start_date AND :end_date
GROUP BY p.full_name, p.email
```

## Dependências Necessárias

```bash
npm install recharts @dnd-kit/core @dnd-kit/sortable date-fns
```

## Design System

### Cores (do globals.css existente)
- Primary: #10b981 (emerald-500)
- Background: #000000 (dark) / #ffffff (light)
- Surface: #0a0a0a (dark) / #f8fafc (light)
- Text Primary: #f8fafc (dark) / #0f172a (light)
- Text Secondary: #94a3b8 (dark) / #64748b (light)

### Tipografia
- Fonte: Geist Sans (já configurada)
- Títulos: font-semibold
- Body: font-normal

### Componentes Base
- Usar Card do projeto existente
- Usar Button existente
- Usar Skeleton para loading states

## Estrutura de Pastas

```
src/
├── hooks/
│   ├── use-analytics.ts          # Hooks de dados
│   └── use-dashboard-layout.ts   # Persistência do layout
├── components/
│   ├── analytics/
│   │   ├── index.ts
│   │   ├── DateRangePicker.tsx
│   │   ├── PanelCustomizer.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── charts/
│   │   │   ├── PieChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── LineChart.tsx
│   │   ├── widgets/
│   │   │   ├── QueueWidget.tsx
│   │   │   ├── UserWidget.tsx
│   │   │   ├── StatusWidget.tsx
│   │   │   ├── ChannelWidget.tsx
│   │   │   ├── DemandWidget.tsx
│   │   │   ├── ChannelEvolutionWidget.tsx
│   │   │   ├── AttendanceEvolutionWidget.tsx
│   │   │   └── ValuesEvolutionWidget.tsx
│   │   └── tables/
│   │       └── TeamPerformanceTable.tsx
│   └── ui/
│       └── skeleton.tsx          # Já existe
├── lib/
│   └── analytics-utils.ts        # Utilitários de cálculo
└── app/(dashboard)/app/central/
    └── page.tsx                  # Página atualizada
```

## Critérios de Aceitação

- [ ] Seletor de período funcional com DatePicker
- [ ] Botão GERAR atualiza todos os widgets
- [ ] Personalizar Painéis com drag-and-drop
- [ ] Toggle de visibilidade funciona
- [ ] Layout persiste no localStorage
- [ ] Todos os 9 widgets renderizam dados
- [ ] Cards de resumo com métricas corretas
- [ ] Tabela de desempenho com dados reais
- [ ] Skeleton loading em todos os widgets
- [ ] Tratamento de dados nulos/"Não informado"
- [ ] Responsividade mobile-first
- [ ] Cache otimizado (React Query/SWR)
- [ ] Integração real com Supabase
