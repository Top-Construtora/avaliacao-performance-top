// Migra fotos de perfil em base64 (users.profile_image como data URL) para o
// bucket público `avatars` do Storage, gravando a URL pública na coluna.
//
// Antes de alterar qualquer linha, salva um backup completo de
// { id, name, profile_image } em backend/.backup/ — é o caminho de volta se
// algo der errado.
//
// Uso:
//   npx ts-node src/scripts/migrate-profile-images.ts --dry-run   (só relata)
//   npx ts-node src/scripts/migrate-profile-images.ts             (executa)

import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase';

const AVATARS_BUCKET = 'avatars';
const DATA_IMAGE_PARTS_RE = /^data:image\/(png|jpe?g|webp);base64,(.+)$/;

// Garante o bucket (mesmo efeito da migração 20260803120000_avatars_bucket.sql;
// idempotente — ignora "já existe")
async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(AVATARS_BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) {
    console.error('Erro ao criar bucket avatars:', error.message);
    process.exit(1);
  }
  console.log(`Bucket "${AVATARS_BUCKET}" pronto${error ? ' (já existia)' : ' (criado)'}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await ensureBucket();

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, profile_image')
    .order('name');

  if (error) {
    console.error('Erro ao listar usuários:', error.message);
    process.exit(1);
  }

  const withBase64 = (users || []).filter(
    (u) => typeof u.profile_image === 'string' && u.profile_image.startsWith('data:'),
  );

  console.log(`Usuários: ${users?.length ?? 0} | com foto base64: ${withBase64.length}`);
  if (withBase64.length === 0) {
    console.log('Nada a migrar.');
    return;
  }

  if (dryRun) {
    for (const u of withBase64) {
      console.log(`  [dry-run] ${u.name} (${(u.profile_image!.length / 1024) | 0} KB)`);
    }
    return;
  }

  // Backup antes de qualquer escrita
  const backupDir = path.resolve(__dirname, '../../.backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(
    backupDir,
    `profile-images-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(backupFile, JSON.stringify(withBase64, null, 2));
  console.log(`Backup salvo em ${backupFile}`);

  let ok = 0;
  let failed = 0;

  for (const u of withBase64) {
    const match = u.profile_image!.match(DATA_IMAGE_PARTS_RE);
    if (!match) {
      console.warn(`  ✗ ${u.name}: data URL em formato inesperado — pulado`);
      failed++;
      continue;
    }
    const [, rawType, base64] = match;
    const type = rawType.toLowerCase() === 'jpg' ? 'jpeg' : rawType.toLowerCase();
    const ext = type === 'jpeg' ? 'jpg' : type;
    const objectPath = `users/${u.id}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(objectPath, Buffer.from(base64, 'base64'), {
        contentType: `image/${type}`,
        upsert: true,
      });
    if (uploadError) {
      console.warn(`  ✗ ${u.name}: upload falhou — ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: pub } = supabaseAdmin.storage.from(AVATARS_BUCKET).getPublicUrl(objectPath);
    if (!pub?.publicUrl) {
      console.warn(`  ✗ ${u.name}: sem URL pública`);
      failed++;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ profile_image: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', u.id);
    if (updateError) {
      console.warn(`  ✗ ${u.name}: update falhou — ${updateError.message}`);
      failed++;
      continue;
    }

    ok++;
    console.log(`  ✓ ${u.name}`);
  }

  console.log(`\nConcluído: ${ok} migrados, ${failed} falhas.`);
  if (failed > 0) process.exit(1);
}

main();
