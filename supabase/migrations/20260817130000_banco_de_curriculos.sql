-- Banco de currículos: o candidato se cadastra sozinho.
--
-- Até aqui o candidato só existia colado a uma vaga (job_candidates), digitado
-- à mão pelo RH: a mesma pessoa concorrendo a duas vagas virava dois cadastros
-- sem ligação, e nada sobrava quando a vaga fechava.
--
-- Agora a pessoa é uma linha em `candidates` — o mini currículo, que vive além
-- da vaga — e cada candidatura é uma linha em job_candidates apontando para
-- ela. Um índice único garante o "uma vez por vaga".

CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "city" "text",
    "state" "text",
    "linkedin_url" "text",
    -- Currículo em arquivo: guardamos o caminho no bucket privado, nunca uma
    -- URL pública. O download passa pelo backend, que assina na hora.
    "resume_path" "text",
    "resume_name" "text",
    "summary" "text",
    "education" "text",
    "experience" "text",
    "skills" "text",
    "salary_expectation" numeric,
    "availability" "text",
    "source" "text" DEFAULT 'portal'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."candidates" OWNER TO "postgres";

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");

-- E-mail é a identidade do candidato: é por ele que a segunda candidatura
-- reencontra o currículo em vez de criar outro.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_candidates_email"
    ON "public"."candidates" USING "btree" ("lower"("email"));

CREATE INDEX IF NOT EXISTS "idx_candidates_name"
    ON "public"."candidates" USING "btree" ("lower"("name"));

ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service manages candidates" ON "public"."candidates"
    TO "service_role" USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."candidates" TO "service_role";

-- Candidatura passa a apontar para o currículo. Fica anulável porque os
-- candidatos já cadastrados à mão não têm um — eles seguem válidos como estão.
ALTER TABLE "public"."job_candidates"
    ADD COLUMN IF NOT EXISTS "candidate_id" "uuid";

ALTER TABLE ONLY "public"."job_candidates"
    ADD CONSTRAINT "job_candidates_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;

-- "Só pode se candidatar uma vez à vaga."
CREATE UNIQUE INDEX IF NOT EXISTS "idx_job_candidates_vaga_candidato"
    ON "public"."job_candidates" USING "btree" ("job_opening_id", "candidate_id")
    WHERE ("candidate_id" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "idx_job_candidates_candidate"
    ON "public"."job_candidates" USING "btree" ("candidate_id")
    WHERE ("candidate_id" IS NOT NULL);

-- Bucket privado dos currículos enviados pelo portal.
INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('curriculos', 'curriculos', false)
ON CONFLICT ("id") DO NOTHING;
