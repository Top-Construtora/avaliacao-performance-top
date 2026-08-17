-- Evidências e anexos por item do PDI.
--
-- Até aqui o PDI só guardava o que o líder planejou: o que a pessoa
-- efetivamente fez não tinha onde ser registrado. `evidencias` é o relato do
-- próprio dono do plano, e os anexos são o comprovante (certificado, foto,
-- documento, apresentação) — um conjunto por item de cada duração.
--
-- Os arquivos ficam num bucket PRIVADO: evidência de PDI é dado pessoal do
-- colaborador. O acesso passa sempre pelo backend, que confere quem pode ver
-- antes de assinar uma URL temporária — diferente do bucket `learning`, que é
-- público porque material de curso é o mesmo para todo mundo.

ALTER TABLE "public"."pdi_actions"
  ADD COLUMN IF NOT EXISTS "evidencias" "text";

COMMENT ON COLUMN "public"."pdi_actions"."evidencias" IS
  'Relato do próprio colaborador sobre o que fez nesta ação do PDI.';

CREATE TABLE IF NOT EXISTS "public"."pdi_action_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "development_plan_id" "uuid" NOT NULL,
    "action_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "content_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."pdi_action_attachments" OWNER TO "postgres";

ALTER TABLE ONLY "public"."pdi_action_attachments"
    ADD CONSTRAINT "pdi_action_attachments_pkey" PRIMARY KEY ("id");

-- Cascata pela chave composta da ação: item removido do PDI leva junto os
-- anexos, sem deixar arquivo órfão apontando para ação inexistente.
ALTER TABLE ONLY "public"."pdi_action_attachments"
    ADD CONSTRAINT "pdi_action_attachments_action_fkey"
    FOREIGN KEY ("development_plan_id", "action_id")
    REFERENCES "public"."pdi_actions"("development_plan_id", "id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pdi_action_attachments"
    ADD CONSTRAINT "pdi_action_attachments_uploaded_by_fkey"
    FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_pdi_action_attachments_action"
    ON "public"."pdi_action_attachments" USING "btree" ("development_plan_id", "action_id");

ALTER TABLE "public"."pdi_action_attachments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service manages pdi attachments" ON "public"."pdi_action_attachments"
    TO "service_role" USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."pdi_action_attachments" TO "service_role";

-- Bucket privado dos anexos. Sem política para `authenticated`: ninguém lê
-- direto do Storage, só através da URL assinada que o backend devolve.
INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('pdi-evidencias', 'pdi-evidencias', false)
ON CONFLICT ("id") DO NOTHING;
