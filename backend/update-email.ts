import { supabaseAdmin } from './src/config/supabase';

async function updateUserEmail() {
  const userId = '9f4977e0-3061-48f3-a714-18ac66281f1e';
  const newEmail = 'debora.alves@topconstrutora.com';

  try {
    // Atualizar o email usando a API Admin do Supabase
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (error) {
      console.error('Erro ao atualizar email:', error);
      process.exit(1);
    }

    console.log('Email atualizado com sucesso!');
    console.log('Dados do usuário:', data);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

updateUserEmail();
