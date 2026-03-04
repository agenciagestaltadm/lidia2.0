/**
 * Script para criar usuário admin no Supabase
 * 
 * Como usar:
 * 1. Configure as variáveis abaixo com seus dados do Supabase
 * 2. Execute: node scripts/create-admin-user.js
 * 
 * Ou use o npx ts-node se estiver em ambiente TypeScript:
 * npx ts-node scripts/create-admin-user.ts
 */

// CONFIGURAÇÕES - ALTERE AQUI
const SUPABASE_URL = 'https://seu-projeto.supabase.co';  // Substitua pelo seu URL
const SUPABASE_SERVICE_KEY = 'sua-service-role-key-aqui'; // Substitua pela sua service_role key

// DADOS DO USUÁRIO ADMIN
const ADMIN_EMAIL = 'adminlidia@superusuario.com.br';
const ADMIN_PASSWORD = '123456Ag@';
const ADMIN_NAME = 'Super Administrador LIDIA';

// ============================================
// NÃO ALTERE A PARTIR DAQUI
// ============================================

async function createAdminUser() {
  console.log('🚀 Criando usuário admin...');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  
  try {
    // Faz a requisição para criar o usuário
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,  // Confirma o email automaticamente
        user_metadata: {
          role: 'SUPER_USER',
          full_name: ADMIN_NAME,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.msg?.includes('already been taken') || data.message?.includes('already exists')) {
        console.log('⚠️  Usuário já existe. Vamos atualizar...');
        // Aqui você poderia adicionar lógica para atualizar o usuário
        console.log('✅ Usuário já existe no sistema.');
        return;
      }
      throw new Error(`Erro ao criar usuário: ${JSON.stringify(data)}`);
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: SUPER_USER`);
    console.log('');
    console.log('🔑 Credenciais para login:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('💡 Alternativa: Crie o usuário manualmente pelo painel do Supabase:');
    console.log('   1. Vá em Authentication → Users');
    console.log('   2. Clique em "Add user" → "Create new user"');
    console.log(`   3. Email: ${ADMIN_EMAIL}`);
    console.log(`   4. Password: ${ADMIN_PASSWORD}`);
    console.log('   5. Marque "Auto-confirm email"');
    console.log('   6. Clique em "Create user"');
  }
}

// Executa o script
createAdminUser();
