/**
 * Script para resetar a senha do usuário admin
 * 
 * COMO USAR:
 * 1. Obtenha a Service Role Key do Supabase:
 *    - Vá em Project Settings → API
 *    - Copie a "service_role secret" (não a anon key!)
 * 
 * 2. Configure as variáveis abaixo:
 */

const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';  // 🔴 SUBSTITUA PELO SEU
const SUPABASE_SERVICE_KEY = 'sua-service-role-key-aqui'; // 🔴 SUBSTITUA PELA SERVICE ROLE KEY

const ADMIN_EMAIL = 'adminlidia@superusuario.com.br';
const ADMIN_PASSWORD = '123456Ag@';
const ADMIN_NAME = 'Super Administrador LIDIA';

// ============================================
// NÃO ALTERE A PARTIR DAQUI
// ============================================

async function resetAdminPassword() {
  console.log('🔐 Resetando senha do admin...\n');

  if (SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_SERVICE_KEY.includes('sua-service-role')) {
    console.error('❌ ERRO: Você precisa configurar SUPABASE_URL e SUPABASE_SERVICE_KEY no script!');
    console.log('\n📋 Como obter a Service Role Key:');
    console.log('   1. Acesse: https://app.supabase.com');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em: Project Settings → API');
    console.log('   4. Copie a "service_role secret" (começa com "eyJ...")');
    console.log('\n⚠️  IMPORTANTE: Nunca compartilhe a service_role key!');
    process.exit(1);
  }

  try {
    // Passo 1: Buscar o usuário existente
    console.log('🔍 Buscando usuário...');
    const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      },
    });

    const users = await listResponse.json();
    let userId = null;

    if (users && users.users && users.users.length > 0) {
      userId = users.users[0].id;
      console.log(`✅ Usuário encontrado: ${userId}`);
    }

    // Passo 2: Se o usuário existe, atualizar a senha
    if (userId) {
      console.log('\n📝 Atualizando senha...');
      
      const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            role: 'SUPER_USER',
            full_name: ADMIN_NAME,
          },
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Erro ao atualizar: ${JSON.stringify(error)}`);
      }

      console.log('✅ Senha atualizada com sucesso!');
    } else {
      // Passo 3: Se não existe, criar o usuário
      console.log('\n➕ Criando novo usuário...');
      
      const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            role: 'SUPER_USER',
            full_name: ADMIN_NAME,
          },
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Erro ao criar: ${JSON.stringify(error)}`);
      }

      const newUser = await createResponse.json();
      userId = newUser.id;
      console.log(`✅ Usuário criado: ${userId}`);
    }

    // Passo 4: Verificar/Criar perfil
    console.log('\n👤 Verificando perfil...');
    
    // Verifica se o perfil existe via SQL (precisamos de outra abordagem)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.log('   Criando perfil...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          role: 'SUPER_USER',
          is_active: true,
        });

      if (insertError) {
        console.warn('   ⚠️ Erro ao criar perfil:', insertError.message);
      } else {
        console.log('   ✅ Perfil criado!');
      }
    } else {
      console.log('   ✅ Perfil já existe');
      
      // Atualiza o perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'SUPER_USER',
          full_name: ADMIN_NAME,
          is_active: true,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.warn('   ⚠️ Erro ao atualizar perfil:', updateError.message);
      } else {
        console.log('   ✅ Perfil atualizado!');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Senha: ${ADMIN_PASSWORD}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Verifique se o SUPABASE_URL está correto.');
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 Verifique se a SERVICE_ROLE_KEY está correta.');
    }
    
    process.exit(1);
  }
}

// Executa o script
resetAdminPassword();
