-- ============================================================
-- CORRIGIR POLÍTICA RLS DA TABELA SUPER_USERS
-- Isso permite que o sistema leia a tabela ao fazer login
-- ============================================================

-- Remover política antiga
DROP POLICY IF EXISTS "Super users can view all" ON super_users;

-- Criar política que permite usuários autenticados lerem seus próprios dados
-- ou qualquer super_user ver todos os super_users
CREATE POLICY "Allow authenticated users to read super_users" ON super_users
    FOR SELECT 
    USING (
        auth.uid() = id  -- Próprio usuário
        OR 
        EXISTS (  -- Ou é um super_user existente
            SELECT 1 FROM super_users su 
            WHERE su.id = auth.uid()
        )
    );

-- Política para permitir inserção (apenas para setup inicial ou super users)
CREATE POLICY "Allow super users to manage all" ON super_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM super_users su 
            WHERE su.id = auth.uid()
        )
    );

-- Verificar se o usuário existe na tabela
-- Substitua 'SEU_ID_AQUI' pelo seu UUID para testar
SELECT 
    'Super user encontrado!' as status,
    id,
    email,
    name,
    is_active
FROM super_users
WHERE id = 'SEU_ID_AQUI';  -- <-- SUBSTITUA PELO SEU UUID

-- Se não retornar nada, o super user não foi criado corretamente
-- Se retornar dados, o RLS agora está funcionando!
