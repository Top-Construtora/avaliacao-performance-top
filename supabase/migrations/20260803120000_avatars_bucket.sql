-- Bucket público para fotos de perfil. As fotos deixavam de ~17,6 MB de
-- base64 na coluna users.profile_image em toda listagem; passam a ser
-- objetos no Storage com a URL pública gravada na coluna (upload só pelo
-- backend/service_role; leitura pública via URL — avatar, não dado sensível).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
