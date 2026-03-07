-- ============================================================
-- Migration: Adicionar campos de trial para Planos e Empresas
-- ============================================================

-- Adicionar campos de trial na tabela plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 3;

-- Adicionar campos na tabela companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_connections INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS identity TEXT,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_period INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Adicionar comentários para documentação
COMMENT ON COLUMN plans.is_trial IS 'Indica se o plano é um trial/período de teste';
COMMENT ON COLUMN plans.trial_days IS 'Quantidade de dias do período de trial';

COMMENT ON COLUMN companies.max_users IS 'Limite máximo de usuários para esta empresa';
COMMENT ON COLUMN companies.max_connections IS 'Limite máximo de conexões para esta empresa';
COMMENT ON COLUMN companies.identity IS 'Identidade da empresa (nome fantasia ou identificador)';
COMMENT ON COLUMN companies.is_trial IS 'Indica se a empresa está em período de trial';
COMMENT ON COLUMN companies.trial_period IS 'Período de teste em dias';
COMMENT ON COLUMN companies.trial_end_date IS 'Data de término do período de trial';

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_companies_is_trial ON companies(is_trial);
CREATE INDEX IF NOT EXISTS idx_companies_trial_end_date ON companies(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_plans_is_trial ON plans(is_trial);

-- Atualizar registros existentes com valores padrão
UPDATE companies SET max_users = 1 WHERE max_users IS NULL;
UPDATE companies SET max_connections = 1 WHERE max_connections IS NULL;
UPDATE companies SET is_trial = false WHERE is_trial IS NULL;
UPDATE companies SET trial_period = 3 WHERE trial_period IS NULL;

UPDATE plans SET is_trial = false WHERE is_trial IS NULL;
UPDATE plans SET trial_days = 3 WHERE trial_days IS NULL;

-- Garantir que os campos não permitam NULL após a migração
ALTER TABLE plans ALTER COLUMN is_trial SET NOT NULL;
ALTER TABLE plans ALTER COLUMN trial_days SET NOT NULL;
ALTER TABLE companies ALTER COLUMN max_users SET NOT NULL;
ALTER TABLE companies ALTER COLUMN max_connections SET NOT NULL;
ALTER TABLE companies ALTER COLUMN is_trial SET NOT NULL;
ALTER TABLE companies ALTER COLUMN trial_period SET NOT NULL;