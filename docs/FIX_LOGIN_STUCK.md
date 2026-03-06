# Corrigir Login Travado em "Entrando..."

## Problema
Ao clicar em "Entrar", o botão fica travado em "Entrando..." e não sai da tela.

## Causa
No arquivo `src/hooks/use-auth.ts`, a consulta `.single()` na tabela `super_users` gera um erro quando não encontra o usuário, interrompendo o fluxo de login.

## Solução

Edite o arquivo `src/hooks/use-auth.ts` e altere a função `fetchUserProfile` (linhas 37-59):

### Código Atual (PROBLEMA):
```typescript
const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
  const supabase = supabaseRef.current;
  if (!supabase) return null;

  try {
    // First check if user is a super user
    const { data: superUser, error: superError } = await supabase
      .from("super_users")
      .select("*")
      .eq("id", userId)
      .single();  // <-- PROBLEMA: Gera erro se não encontrar

    if (superUser) {
      return { ... } as User;
    }
    // ...
```

### Código Corrigido:
```typescript
const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
  const supabase = supabaseRef.current;
  if (!supabase) return null;

  try {
    // First check if user is a super user
    const { data: superUser, error: superError } = await supabase
      .from("super_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();  // <-- CORREÇÃO: Não gera erro se não encontrar

    if (superUser) {
      return {
        id: superUser.id,
        email: superUser.email,
        name: superUser.name,
        role: "SUPER_USER" as UserRole,
        isActive: superUser.is_active,
        createdAt: superUser.created_at,
        lastLoginAt: superUser.last_login_at,
      } as User;
    }
    // ... resto do código
```

## Alteração Simples
Mude `.single()` para `.maybeSingle()` na linha 47.

## O que faz:
- `.single()` → Gera erro se não encontrar exatamente 1 registro
- `.maybeSingle()` → Retorna null se não encontrar, sem erro

## Depois da correção:
1. Salve o arquivo
2. Espere o Next.js recompilar (ou reinicie o servidor)
3. Teste o login novamente
