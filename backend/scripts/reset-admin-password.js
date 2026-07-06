// Redefine a senha de um usuário do Supabase Auth usando a service_role key.
//
// Uso (dentro da pasta backend/):
//   node scripts/reset-admin-password.js "NovaSenhaAqui"
//   node scripts/reset-admin-password.js "NovaSenhaAqui" outro@email.com
//
// A senha é passada como argumento — nada fica salvo em arquivo.

const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Carrega o backend/.env independente de onde o script foi chamado
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const newPassword = process.argv[2];
const email = (process.argv[3] || 'admintop@sistema.com').toLowerCase();

if (!newPassword) {
  console.error(
    '❌ Faltou a senha nova. Ex.: node scripts/reset-admin-password.js "MinhaSenha123"',
  );
  process.exit(1);
}
if (newPassword.length < 6) {
  console.error('❌ A senha precisa ter pelo menos 6 caracteres.');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no backend/.env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  // listUsers pagina de 50 em 50; percorre até achar
  for (let page = 1; page <= 40; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || '').toLowerCase() === targetEmail);
    if (found) return found;
    if (data.users.length < 50) break; // última página
  }
  return null;
}

(async () => {
  try {
    console.log(`🔎 Procurando usuário ${email} ...`);
    const user = await findUserByEmail(email);
    if (!user) {
      console.error(`❌ Nenhum usuário com email ${email} no Supabase Auth.`);
      process.exit(1);
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (error) throw error;

    console.log(`✅ Senha redefinida com sucesso para ${email} (id: ${user.id}).`);
    console.log('   Agora é só fazer login com a senha nova.');
  } catch (err) {
    console.error('❌ Erro ao redefinir a senha:', err.message || err);
    process.exit(1);
  }
})();
