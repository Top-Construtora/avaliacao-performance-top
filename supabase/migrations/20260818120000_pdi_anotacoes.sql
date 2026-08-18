-- Anotações de acompanhamento por item do PDI.
--
-- As `evidencias` do item são o relato final: um texto que a pessoa reescreve
-- até ficar bom. Só que desenvolvimento não acontece de uma vez — acontece em
-- pedaços ("comecei o curso", "apresentei no comitê", "travei aqui"). Reescrever
-- o relato apaga esse caminho.
--
-- Por isso a anotação é registro, não campo: cada uma guarda quem escreveu e
-- quando, e nada sobrescreve o que veio antes. Lida em ordem, a lista mostra o
-- avanço da ação ao longo do ciclo — que é o que a conversa de acompanhamento
-- entre líder e liderado precisa ter à mão.
--
-- Líder e colaborador escrevem no mesmo fio, cada um identificado. Um PDI
-- acompanhado a dois vale mais que dois diários paralelos.
--
-- Roda duas vezes sem erro: na produção este SQL é colado no SQL Editor, e um
-- script que só funciona na primeira tentativa vira dúvida ("já apliquei ou
-- não?") justamente na hora em que ninguém quer adivinhar.

CREATE TABLE IF NOT EXISTS "public"."pdi_action_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "development_plan_id" "uuid" NOT NULL,
    "action_id" "text" NOT NULL,
    "texto" "text" NOT NULL,
    "author_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."pdi_action_notes" OWNER TO "postgres";

COMMENT ON TABLE "public"."pdi_action_notes" IS
  'Diário de acompanhamento de uma ação do PDI: um registro por anotação, com autor e data.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'pdi_action_notes_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."pdi_action_notes"
      ADD CONSTRAINT "pdi_action_notes_pkey" PRIMARY KEY ("id");
  END IF;

  -- Mesma cascata dos anexos: item removido do PDI leva junto o que foi anotado
  -- nele, sem deixar registro apontando para ação inexistente.
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'pdi_action_notes_action_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."pdi_action_notes"
      ADD CONSTRAINT "pdi_action_notes_action_fkey"
      FOREIGN KEY ("development_plan_id", "action_id")
      REFERENCES "public"."pdi_actions"("development_plan_id", "id") ON DELETE CASCADE;
  END IF;

  -- Autor some do sistema, a anotação fica: o histórico do PDI não depende de
  -- quem continua na empresa.
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'pdi_action_notes_author_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."pdi_action_notes"
      ADD CONSTRAINT "pdi_action_notes_author_fkey"
      FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_pdi_action_notes_action"
    ON "public"."pdi_action_notes" USING "btree" ("development_plan_id", "action_id", "created_at");

ALTER TABLE "public"."pdi_action_notes" ENABLE ROW LEVEL SECURITY;

-- Anotação é dado pessoal de acompanhamento: quem lê passa pelo backend, que
-- confere se a pessoa é dona do plano, líder direto ou RH.
DROP POLICY IF EXISTS "Service manages pdi notes" ON "public"."pdi_action_notes";
CREATE POLICY "Service manages pdi notes" ON "public"."pdi_action_notes"
    TO "service_role" USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."pdi_action_notes" TO "service_role";
