

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."candidate_status" AS ENUM (
    'received',
    'screening',
    'interview_scheduled',
    'interviewed',
    'approved',
    'rejected',
    'hired'
);


ALTER TYPE "public"."candidate_status" OWNER TO "postgres";


CREATE TYPE "public"."contract_type" AS ENUM (
    'CLT',
    'PJ',
    'Estagiário',
    'Temporário'
);


ALTER TYPE "public"."contract_type" OWNER TO "postgres";


CREATE TYPE "public"."interview_status" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."interview_status" OWNER TO "postgres";


CREATE TYPE "public"."interview_type" AS ENUM (
    'ninety_days',
    'exit',
    'onboarding',
    'sixty_days'
);


ALTER TYPE "public"."interview_type" OWNER TO "postgres";


CREATE TYPE "public"."job_opening_status" AS ENUM (
    'draft',
    'open',
    'in_progress',
    'closed',
    'cancelled'
);


ALTER TYPE "public"."job_opening_status" OWNER TO "postgres";


CREATE TYPE "public"."progression_type" AS ENUM (
    'salary_level',
    'position',
    'promotion',
    'horizontal',
    'vertical',
    'merit'
);


ALTER TYPE "public"."progression_type" OWNER TO "postgres";


CREATE TYPE "public"."survey_status" AS ENUM (
    'draft',
    'active',
    'closed'
);


ALTER TYPE "public"."survey_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_salary"("p_track_position_id" "uuid", "p_salary_level_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_base_salary DECIMAL(10,2);
    v_level_percentage DECIMAL(5,2);
BEGIN
    -- Buscar salário base do cargo (se a tabela track_positions existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'track_positions') THEN
        SELECT base_salary INTO v_base_salary
        FROM track_positions
        WHERE id = p_track_position_id;

        -- Buscar percentual do nível (se a tabela salary_levels existir)
        SELECT percentage INTO v_level_percentage
        FROM salary_levels
        WHERE id = p_salary_level_id;

        -- Calcular salário final
        IF v_base_salary IS NOT NULL AND v_level_percentage IS NOT NULL THEN
            RETURN v_base_salary * (1 + v_level_percentage / 100);
        END IF;
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."calculate_salary"("p_track_position_id" "uuid", "p_salary_level_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_employee"("target_employee" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() = target_employee
    or exists (select 1 from public.users e where e.id = target_employee and e.reports_to = auth.uid())
    or exists (select 1 from public.users v where v.id = auth.uid()
      and (coalesce(v.is_director,false) or coalesce((to_jsonb(v)->>'is_admin')::boolean,false)));
$$;


ALTER FUNCTION "public"."can_view_employee"("target_employee" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_no_circular_reporting"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_id UUID;
    checked_ids UUID[] := ARRAY[]::UUID[];
BEGIN
    -- Se não há supervisor definido, nada a validar
    IF NEW.reports_to IS NULL THEN
        RETURN NEW;
    END IF;

    current_id := NEW.reports_to;
    checked_ids := array_append(checked_ids, NEW.id);

    WHILE current_id IS NOT NULL LOOP
        -- Detecta loop na hierarquia
        IF current_id = ANY(checked_ids) THEN
            RAISE EXCEPTION 'Hierarquia circular detectada';
        END IF;

        checked_ids := array_append(checked_ids, current_id);

        SELECT reports_to INTO current_id
        FROM public.users
        WHERE id = current_id;
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_no_circular_reporting"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_update_permissions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Permitir se for o próprio sistema (sem auth.uid())
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Permitir se for diretor ou admin
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (is_director = true OR is_admin = true)
    ) THEN
        RETURN NEW;
    END IF;

    -- Para outros usuários, verificar o que está sendo alterado
    IF auth.uid() = NEW.id THEN
        -- Usuário editando próprio perfil - não pode mudar certos campos
        IF OLD.is_leader IS DISTINCT FROM NEW.is_leader OR
           OLD.is_director IS DISTINCT FROM NEW.is_director OR
           OLD.is_admin IS DISTINCT FROM NEW.is_admin OR
           OLD.active IS DISTINCT FROM NEW.active OR
           OLD.reports_to IS DISTINCT FROM NEW.reports_to THEN
            RAISE EXCEPTION 'Você não tem permissão para alterar estes campos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_user_update_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Apenas registra alterações importantes
    IF TG_OP = 'DELETE' OR OLD IS DISTINCT FROM NEW THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,          -- Corrigido: era "operation", agora é "action"
            table_name,
            record_id,
            old_data,
            new_data
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."create_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_audit_row"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_record_id uuid;
  v_old jsonb;
  v_new jsonb;
begin
  -- Escritas do backend usam service_role (auth.uid() nulo) e já são
  -- auditadas pelo auditService com o ator completo. O trigger cobre
  -- apenas o caminho direto do frontend (authenticated).
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    v_record_id := old.id;
    v_old := to_jsonb(old);
    v_new := null;
  elsif tg_op = 'INSERT' then
    v_record_id := new.id;
    v_old := null;
    v_new := to_jsonb(new);
  else
    v_record_id := new.id;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  end if;

  insert into public.audit_logs
    (user_id, action, table_name, record_id, old_data, new_data, created_at)
  values
    (auth.uid(), lower(tg_op), tg_table_name, v_record_id, v_old, v_new, now());

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
exception when others then
  -- Auditoria nunca pode derrubar a operação principal
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;


ALTER FUNCTION "public"."fn_audit_row"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar se o usuário já existe na tabela users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (
      id,
      email,
      name,
      position,
      active,
      is_leader,
      is_director,
      is_admin,
      join_date,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'position', 'Colaborador'),
      true,
      COALESCE((NEW.raw_user_meta_data->>'is_leader')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'is_director')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
      CURRENT_DATE,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não impede a criação do usuário no Auth
    RAISE WARNING 'Erro ao criar usuário na tabela users: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_user_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND active = true
    );
END;
$$;


ALTER FUNCTION "public"."is_active_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_director"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (is_director = true OR is_admin = true)
        AND active = true
    );
END;
$$;


ALTER FUNCTION "public"."is_director"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organizational_competencies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_organizational_competencies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_salary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Atualizar salário calculado quando cargo e nível estiverem definidos
    IF NEW.current_track_position_id IS NOT NULL AND NEW.current_salary_level_id IS NOT NULL THEN
        NEW.current_salary := calculate_salary(NEW.current_track_position_id, NEW.current_salary_level_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_salary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_pdi_items"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF jsonb_typeof(NEW.items) <> 'array' THEN
        RAISE EXCEPTION 'O campo items deve ser um array JSON válido.';
    END IF;

    IF jsonb_array_length(NEW.items) = 0 THEN
        RAISE EXCEPTION 'O PDI deve conter pelo menos um item.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_pdi_items"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "actor_email" "text",
    "request_id" "text"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_id" "uuid",
    "name" character varying NOT NULL,
    "code" character varying,
    "description" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."career_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mandatory" boolean DEFAULT false NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "completed_at" timestamp with time zone,
    "enrolled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "class_enrollments_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."class_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competencies" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "competencies_category_check" CHECK (("category" = ANY (ARRAY['technical'::"text", 'behavioral'::"text", 'deliveries'::"text"])))
);


ALTER TABLE "public"."competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consensus_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "self_evaluation_id" "uuid",
    "leader_evaluation_id" "uuid",
    "consensus_score" numeric,
    "potential_score" numeric,
    "nine_box_position" "text",
    "notes" "text",
    "evaluation_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cycle_id" "uuid",
    "promoted_potential_quadrant" integer,
    "promoted_by" "uuid",
    "promoted_at" timestamp with time zone,
    "committee_deliberations" "text",
    CONSTRAINT "consensus_evaluations_consensus_score_check" CHECK ((("consensus_score" >= (1)::numeric) AND ("consensus_score" <= (4)::numeric))),
    CONSTRAINT "consensus_evaluations_potential_score_check" CHECK ((("potential_score" >= (1)::numeric) AND ("potential_score" <= (4)::numeric)))
);


ALTER TABLE "public"."consensus_evaluations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."consensus_evaluations"."promoted_potential_quadrant" IS 'Quadrante de potencial promovido (1=Baixo, 2=Médio, 3=Alto). NULL significa sem promoção.';



COMMENT ON COLUMN "public"."consensus_evaluations"."promoted_by" IS 'ID do usuário (admin/diretor) que realizou a promoção';



COMMENT ON COLUMN "public"."consensus_evaluations"."promoted_at" IS 'Data e hora em que a promoção foi realizada';



COMMENT ON COLUMN "public"."consensus_evaluations"."committee_deliberations" IS 'Deliberações e anotações do Comitê de Gente sobre o colaborador';



CREATE TABLE IF NOT EXISTS "public"."content_progress" (
    "enrollment_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "allow_late_completion" boolean DEFAULT true NOT NULL,
    "self_enrollment" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "survey_id" "uuid"
);


ALTER TABLE "public"."course_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "section" "text",
    "title" "text" NOT NULL,
    "type" "text" DEFAULT 'link'::"text" NOT NULL,
    "url" "text" NOT NULL,
    "mandatory" boolean DEFAULT true NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "course_contents_type_check" CHECK (("type" = ANY (ARRAY['video'::"text", 'link'::"text", 'file'::"text"])))
);


ALTER TABLE "public"."course_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "workload_hours" numeric(6,1),
    "cover_url" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cultural_code_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cultural_code_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cultural_code_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cultural_code_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "responsible_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."development_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "consensus_evaluation_id" "uuid",
    "timeline" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cycle_id" "uuid",
    "leader_evaluation_id" "uuid",
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "periodo" "text",
    "created_by" "uuid",
    CONSTRAINT "development_plans_items_check" CHECK ((("jsonb_array_length"("items") > 0) OR ("items" = '[]'::"jsonb"))),
    CONSTRAINT "development_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."development_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_competencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluation_id" "uuid" NOT NULL,
    "criterion_name" "text" NOT NULL,
    "criterion_description" "text",
    "category" "text" NOT NULL,
    "score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "written_response" "text",
    "weight" numeric DEFAULT 1.0,
    "self_evaluation_id" "uuid",
    "leader_evaluation_id" "uuid",
    CONSTRAINT "evaluation_competencies_category_check" CHECK (("category" = ANY (ARRAY['technical'::"text", 'behavioral'::"text", 'deliveries'::"text"]))),
    CONSTRAINT "evaluation_competencies_score_check" CHECK ((("score" >= (1)::numeric) AND ("score" <= (4)::numeric)))
);


ALTER TABLE "public"."evaluation_competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_cycles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" character varying DEFAULT 'draft'::character varying,
    "is_editable" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    CONSTRAINT "evaluation_cycles_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('open'::character varying)::"text", ('closed'::character varying)::"text"])))
);


ALTER TABLE "public"."evaluation_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "institution" "text",
    "workload_hours" numeric(6,1),
    "completed_at" "date",
    "certificate_url" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "review_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "external_courses_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."external_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "requested_id" "uuid" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "feedback_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedback_requests_no_self" CHECK (("requester_id" <> "requested_id")),
    CONSTRAINT "feedback_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'fulfilled'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."feedback_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'gray'::"text" NOT NULL,
    "icon" "text" DEFAULT 'MessageSquare'::"text" NOT NULL,
    "restricted_to_admin" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feedback_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "competencies" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "internal_note" "text",
    "request_id" "uuid",
    "read_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone,
    "recipient_comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedbacks_no_self" CHECK (("author_id" <> "recipient_id"))
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "rating_value" integer,
    "text_value" "text",
    "boolean_value" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_exit_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "departure_reason" "text" NOT NULL,
    "departure_reason_details" "text",
    "work_environment_rating" integer,
    "work_environment_comments" "text",
    "leadership_rating" integer,
    "leadership_comments" "text",
    "growth_opportunities_rating" integer,
    "growth_opportunities_comments" "text",
    "compensation_rating" integer,
    "compensation_comments" "text",
    "workload_rating" integer,
    "workload_comments" "text",
    "what_liked_most" "text",
    "what_could_improve" "text",
    "would_return" boolean,
    "would_recommend" boolean,
    "destination" "text",
    "additional_comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interview_exit_answers_compensation_rating_check" CHECK ((("compensation_rating" >= 1) AND ("compensation_rating" <= 5))),
    CONSTRAINT "interview_exit_answers_growth_opportunities_rating_check" CHECK ((("growth_opportunities_rating" >= 1) AND ("growth_opportunities_rating" <= 5))),
    CONSTRAINT "interview_exit_answers_leadership_rating_check" CHECK ((("leadership_rating" >= 1) AND ("leadership_rating" <= 5))),
    CONSTRAINT "interview_exit_answers_work_environment_rating_check" CHECK ((("work_environment_rating" >= 1) AND ("work_environment_rating" <= 5))),
    CONSTRAINT "interview_exit_answers_workload_rating_check" CHECK ((("workload_rating" >= 1) AND ("workload_rating" <= 5)))
);


ALTER TABLE "public"."interview_exit_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_ninety_days_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "adaptation_rating" integer,
    "adaptation_comments" "text",
    "team_integration_rating" integer,
    "team_integration_comments" "text",
    "role_clarity_rating" integer,
    "role_clarity_comments" "text",
    "leadership_support_rating" integer,
    "leadership_support_comments" "text",
    "tools_and_resources_rating" integer,
    "tools_and_resources_comments" "text",
    "expectations_met" boolean,
    "expectations_comments" "text",
    "challenges" "text",
    "suggestions" "text",
    "overall_satisfaction_rating" integer,
    "recommend_company" boolean,
    "additional_comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interview_ninety_days_answers_adaptation_rating_check" CHECK ((("adaptation_rating" >= 1) AND ("adaptation_rating" <= 5))),
    CONSTRAINT "interview_ninety_days_answers_leadership_support_rating_check" CHECK ((("leadership_support_rating" >= 1) AND ("leadership_support_rating" <= 5))),
    CONSTRAINT "interview_ninety_days_answers_overall_satisfaction_rating_check" CHECK ((("overall_satisfaction_rating" >= 1) AND ("overall_satisfaction_rating" <= 5))),
    CONSTRAINT "interview_ninety_days_answers_role_clarity_rating_check" CHECK ((("role_clarity_rating" >= 1) AND ("role_clarity_rating" <= 5))),
    CONSTRAINT "interview_ninety_days_answers_team_integration_rating_check" CHECK ((("team_integration_rating" >= 1) AND ("team_integration_rating" <= 5))),
    CONSTRAINT "interview_ninety_days_answers_tools_and_resources_rating_check" CHECK ((("tools_and_resources_rating" >= 1) AND ("tools_and_resources_rating" <= 5)))
);


ALTER TABLE "public"."interview_ninety_days_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" DEFAULT 'rating'::"text" NOT NULL,
    "rating_scale" integer DEFAULT 5 NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "required" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."interview_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_template_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" DEFAULT 'rating'::"text" NOT NULL,
    "rating_scale" integer DEFAULT 5 NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    CONSTRAINT "interview_template_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['rating'::"text", 'text'::"text", 'yes_no'::"text"])))
);


ALTER TABLE "public"."interview_template_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "interview_templates_type_check" CHECK (("type" = ANY (ARRAY['onboarding'::"text", 'sixty_days'::"text", 'ninety_days'::"text", 'exit'::"text"])))
);


ALTER TABLE "public"."interview_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."interview_type" NOT NULL,
    "status" "public"."interview_status" DEFAULT 'scheduled'::"public"."interview_status" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "scheduled_date" "date",
    "completed_date" timestamp with time zone,
    "observations" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "meeting_url" "text",
    "public_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "interviews_type_check" CHECK (("type" = ANY (ARRAY['onboarding'::"public"."interview_type", 'sixty_days'::"public"."interview_type", 'ninety_days'::"public"."interview_type", 'exit'::"public"."interview_type"])))
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_opening_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "resume_url" "text",
    "linkedin_url" "text",
    "status" "public"."candidate_status" DEFAULT 'received'::"public"."candidate_status" NOT NULL,
    "source" "text",
    "observations" "text",
    "rating" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_candidates_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."job_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_openings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "department_id" "uuid",
    "status" "public"."job_opening_status" DEFAULT 'draft'::"public"."job_opening_status" NOT NULL,
    "positions_count" integer DEFAULT 1 NOT NULL,
    "location" "text",
    "contract_type" "text",
    "salary_range_min" numeric,
    "salary_range_max" numeric,
    "requirements" "text",
    "benefits" "text",
    "priority" "text" DEFAULT 'normal'::"text",
    "requested_by" "uuid" NOT NULL,
    "brief_reason" "text",
    "brief_expected_start" "date",
    "brief_team_context" "text",
    "brief_key_activities" "text",
    "brief_required_skills" "text",
    "brief_nice_to_have" "text",
    "brief_observations" "text",
    "opened_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_openings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "code" character varying,
    "description" "text",
    "is_multifunctional" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "can_view_people_committee" boolean DEFAULT false
);


ALTER TABLE "public"."job_positions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."job_positions"."can_view_people_committee" IS 'Define se usuários com este cargo podem visualizar o Comitê de Gente (Nine Box) dos seus liderados';



CREATE TABLE IF NOT EXISTS "public"."leader_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "evaluator_id" "uuid" NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "technical_score" numeric,
    "behavioral_score" numeric,
    "deliveries_score" numeric,
    "final_score" numeric,
    "potential_score" numeric,
    "evaluation_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "potential_details" "jsonb",
    CONSTRAINT "leader_evaluations_behavioral_score_check" CHECK ((("behavioral_score" >= (1)::numeric) AND ("behavioral_score" <= (4)::numeric))),
    CONSTRAINT "leader_evaluations_deliveries_score_check" CHECK ((("deliveries_score" >= (1)::numeric) AND ("deliveries_score" <= (4)::numeric))),
    CONSTRAINT "leader_evaluations_final_score_check" CHECK ((("final_score" >= (1)::numeric) AND ("final_score" <= (4)::numeric))),
    CONSTRAINT "leader_evaluations_potential_score_check" CHECK ((("potential_score" >= (1)::numeric) AND ("potential_score" <= (4)::numeric))),
    CONSTRAINT "leader_evaluations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in-progress'::"text", 'completed'::"text"]))),
    CONSTRAINT "leader_evaluations_technical_score_check" CHECK ((("technical_score" >= (1)::numeric) AND ("technical_score" <= (4)::numeric)))
);


ALTER TABLE "public"."leader_evaluations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leader_evaluations"."potential_details" IS 'Notas individuais das 4 competências de potencial: pot1 (Potencial p/ função subsequente), pot2 (Aprendizado contínuo), pot3 (Alinhamento Cultural), pot4 (Visão sistêmica)';



CREATE TABLE IF NOT EXISTS "public"."learning_track_courses" (
    "track_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."learning_track_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_track_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "track_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "enrolled_by" "uuid",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."learning_track_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."learning_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meeting_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_participants" (
    "meeting_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."meeting_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "assignee_id" "uuid",
    "due_date" "date",
    "done_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meeting_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "covered" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meeting_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meeting_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type_id" "uuid" NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "title" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30 NOT NULL,
    "location" "text",
    "meeting_url" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "recurrence" "text" DEFAULT 'none'::"text" NOT NULL,
    "parent_meeting_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meetings_recurrence_check" CHECK (("recurrence" = ANY (ARRAY['none'::"text", 'weekly'::"text", 'biweekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "meetings_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "email_enabled" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_preferences_category_check" CHECK (("category" = ANY (ARRAY['avaliacoes'::"text", 'pdi'::"text", 'pesquisas'::"text", 'entrevistas'::"text", 'carreira'::"text", 'recrutamento'::"text", 'equipe'::"text", 'feedbacks'::"text", 'reunioes'::"text", 'learning'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "action_url" "text",
    "entity_type" "text",
    "entity_id" "text",
    "group_key" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false,
    "archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    CONSTRAINT "notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizational_competencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."organizational_competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdi_actions" (
    "development_plan_id" "uuid" NOT NULL,
    "id" "text" NOT NULL,
    "competencia" "text" DEFAULT ''::"text" NOT NULL,
    "prazo" "text" DEFAULT 'curto'::"text" NOT NULL,
    "resultados_esperados" "text",
    "como_desenvolver" "text",
    "calendarizacao" "text",
    "observacao" "text",
    "status" "text" DEFAULT '1'::"text" NOT NULL,
    "due_date" "date",
    "course_id" "uuid",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "course_url" "text",
    "course_url_title" "text",
    CONSTRAINT "pdi_actions_prazo_check" CHECK (("prazo" = ANY (ARRAY['curto'::"text", 'medio'::"text", 'longo'::"text"]))),
    CONSTRAINT "pdi_actions_status_check" CHECK (("status" = ANY (ARRAY['1'::"text", '2'::"text", '3'::"text", '4'::"text", '5'::"text"])))
);


ALTER TABLE "public"."pdi_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progression_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_track_position_id" "uuid",
    "to_track_position_id" "uuid" NOT NULL,
    "from_salary_level_id" "uuid",
    "to_salary_level_id" "uuid" NOT NULL,
    "from_salary" numeric,
    "to_salary" numeric NOT NULL,
    "progression_type" "public"."progression_type" NOT NULL,
    "progression_date" "date" NOT NULL,
    "reason" "text",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."progression_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recruitment_interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "interviewer_id" "uuid",
    "scheduled_date" timestamp with time zone,
    "interview_type" "text" DEFAULT 'online'::"text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "notes" "text",
    "rating" integer,
    "recommendation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "recruitment_interviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."recruitment_interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salary_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."salary_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salary_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "percentage" numeric NOT NULL,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."salary_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "response_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "rating_value" integer,
    "text_value" "text",
    "boolean_value" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "satisfaction_answers_rating_value_check" CHECK ((("rating_value" IS NULL) OR (("rating_value" >= 1) AND ("rating_value" <= 10))))
);


ALTER TABLE "public"."satisfaction_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."satisfaction_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" DEFAULT 'rating'::"text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "rating_scale" integer DEFAULT 5 NOT NULL
);


ALTER TABLE "public"."satisfaction_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "respondent_id" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."satisfaction_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."survey_status" DEFAULT 'draft'::"public"."survey_status" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "is_anonymous" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."satisfaction_surveys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."self_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "technical_score" numeric,
    "behavioral_score" numeric,
    "deliveries_score" numeric,
    "final_score" numeric,
    "evaluation_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "knowledge" "text"[],
    "tools" "text"[],
    "strengths_internal" "text"[],
    "qualities" "text"[],
    CONSTRAINT "self_evaluations_behavioral_score_check" CHECK ((("behavioral_score" >= (1)::numeric) AND ("behavioral_score" <= (4)::numeric))),
    CONSTRAINT "self_evaluations_final_score_check" CHECK ((("final_score" >= (1)::numeric) AND ("final_score" <= (4)::numeric))),
    CONSTRAINT "self_evaluations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in-progress'::"text", 'completed'::"text"]))),
    CONSTRAINT "self_evaluations_technical_score_check" CHECK ((("technical_score" >= (1)::numeric) AND ("technical_score" <= (4)::numeric)))
);


ALTER TABLE "public"."self_evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "department_id" "uuid",
    "responsible_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_position_levels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "track_position_id" "uuid" NOT NULL,
    "salary_level_id" "uuid" NOT NULL,
    "custom_percentage" numeric(5,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."track_position_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "track_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "base_salary" numeric NOT NULL,
    "order_index" integer NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "custom_level_percentages" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."track_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "is_leader" boolean DEFAULT false,
    "is_director" boolean DEFAULT false,
    "phone" "text",
    "birth_date" "date",
    "join_date" "date" DEFAULT CURRENT_DATE,
    "active" boolean DEFAULT true,
    "reports_to" "uuid",
    "profile_image" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contract_type" "public"."contract_type" DEFAULT 'CLT'::"public"."contract_type",
    "current_track_position_id" "uuid",
    "current_salary_level_id" "uuid",
    "current_salary" numeric,
    "position_start_date" "date",
    "department_id" "uuid",
    "track_id" "uuid",
    "position_id" "uuid",
    "intern_level" "text" DEFAULT 'A'::"text",
    "is_admin" boolean DEFAULT false,
    "must_change_password" boolean DEFAULT true,
    "observations" "text",
    "can_view_subordinate_ninebox" boolean DEFAULT false,
    "position_is_confidential" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_calculated_salaries" AS
 SELECT "u"."id",
    "u"."name",
    "u"."email",
    "u"."contract_type",
    "ct"."name" AS "track_name",
    "tp"."base_salary",
    "sl"."name" AS "salary_level",
    "sl"."percentage" AS "level_percentage",
    "round"(("tp"."base_salary" * ((1)::numeric + ("sl"."percentage" / (100)::numeric))), 2) AS "calculated_salary",
    "u"."current_salary",
    "d"."name" AS "department_name",
    "jp"."name" AS "position_name",
    "sc"."code" AS "class_code"
   FROM (((((("public"."users" "u"
     LEFT JOIN "public"."track_positions" "tp" ON (("u"."current_track_position_id" = "tp"."id")))
     LEFT JOIN "public"."career_tracks" "ct" ON (("tp"."track_id" = "ct"."id")))
     LEFT JOIN "public"."salary_levels" "sl" ON (("u"."current_salary_level_id" = "sl"."id")))
     LEFT JOIN "public"."job_positions" "jp" ON (("tp"."position_id" = "jp"."id")))
     LEFT JOIN "public"."salary_classes" "sc" ON (("tp"."class_id" = "sc"."id")))
     LEFT JOIN "public"."departments" "d" ON (("u"."department_id" = "d"."id")));


ALTER VIEW "public"."user_calculated_salaries" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."users_safe" WITH ("security_invoker"='true') AS
 SELECT ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."id" AS "id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."email" AS "email",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."name" AS "name",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."position" AS "position",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."is_leader" AS "is_leader",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."is_director" AS "is_director",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."phone" AS "phone",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."birth_date" AS "birth_date",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."join_date" AS "join_date",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."active" AS "active",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."reports_to" AS "reports_to",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."profile_image" AS "profile_image",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."created_at" AS "created_at",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."updated_at" AS "updated_at",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."contract_type" AS "contract_type",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."current_track_position_id" AS "current_track_position_id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."current_salary_level_id" AS "current_salary_level_id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."current_salary" AS "current_salary",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."position_start_date" AS "position_start_date",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."department_id" AS "department_id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."track_id" AS "track_id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."position_id" AS "position_id",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."intern_level" AS "intern_level",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."is_admin" AS "is_admin",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."must_change_password" AS "must_change_password",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."observations" AS "observations",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."can_view_subordinate_ninebox" AS "can_view_subordinate_ninebox",
    ("jsonb_populate_record"(NULL::"public"."users", ("to_jsonb"("u".*) || "jsonb_build_object"('position', "v"."final_position"))))."position_is_confidential" AS "position_is_confidential"
   FROM ("public"."users" "u"
     CROSS JOIN LATERAL ( SELECT
                CASE
                    WHEN "calc"."can_view" THEN "u"."position"
                    WHEN (("calc"."base_role" = ''::"text") AND ("calc"."area" = ''::"text")) THEN 'Colaborador'::"text"
                    WHEN ("calc"."base_role" = ''::"text") THEN ('Colaborador de '::"text" || "calc"."area")
                    WHEN ("calc"."area" = ''::"text") THEN "calc"."base_role"
                    ELSE (("calc"."base_role" || ' de '::"text") || "calc"."area")
                END AS "final_position"
           FROM ( SELECT ((COALESCE((("to_jsonb"("u".*) ->> 'position_is_confidential'::"text"))::boolean, false) = false) OR ("auth"."uid"() = "u"."id") OR ("u"."reports_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
                           FROM "public"."users" "vu"
                          WHERE (("vu"."id" = "auth"."uid"()) AND (COALESCE("vu"."is_director", false) OR COALESCE((("to_jsonb"("vu".*) ->> 'is_admin'::"text"))::boolean, false)))))) AS "can_view",
                    COALESCE(NULLIF(TRIM(BOTH FROM ( SELECT "jp"."name"
                           FROM "public"."job_positions" "jp"
                          WHERE ("jp"."id" = "u"."position_id"))), ''::"text"), NULLIF(TRIM(BOTH FROM "regexp_replace"(COALESCE("u"."position", ''::"text"), '\s*-?\s*(M[DCLXVI]+|[IVX]+|\d+|Jr\.?|Pl\.?|Sr\.?|J[uú]nior|Pleno|S[eê]nior)\s*$'::"text", ''::"text", 'i'::"text")), ''::"text"), ''::"text") AS "base_role",
                    COALESCE(NULLIF(TRIM(BOTH FROM ( SELECT "t"."name"
                           FROM ("public"."team_members" "tm"
                             JOIN "public"."teams" "t" ON (("t"."id" = "tm"."team_id")))
                          WHERE ("tm"."user_id" = "u"."id")
                          ORDER BY "tm"."created_at"
                         LIMIT 1)), ''::"text"), NULLIF(TRIM(BOTH FROM ( SELECT "d"."name"
                           FROM "public"."departments" "d"
                          WHERE ("d"."id" = "u"."department_id"))), ''::"text"), ''::"text") AS "area") "calc") "v");


ALTER VIEW "public"."users_safe" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career_tracks"
    ADD CONSTRAINT "career_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_enrollments"
    ADD CONSTRAINT "class_enrollments_class_id_user_id_key" UNIQUE ("class_id", "user_id");



ALTER TABLE ONLY "public"."class_enrollments"
    ADD CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competencies"
    ADD CONSTRAINT "competencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_progress"
    ADD CONSTRAINT "content_progress_pkey" PRIMARY KEY ("enrollment_id", "content_id");



ALTER TABLE ONLY "public"."course_classes"
    ADD CONSTRAINT "course_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_contents"
    ADD CONSTRAINT "course_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cultural_code_items"
    ADD CONSTRAINT "cultural_code_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cultural_code_sections"
    ADD CONSTRAINT "cultural_code_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_competencies"
    ADD CONSTRAINT "evaluation_competencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_cycles"
    ADD CONSTRAINT "evaluation_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_courses"
    ADD CONSTRAINT "external_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_requests"
    ADD CONSTRAINT "feedback_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_types"
    ADD CONSTRAINT "feedback_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."feedback_types"
    ADD CONSTRAINT "feedback_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_answers"
    ADD CONSTRAINT "interview_answers_interview_id_question_id_key" UNIQUE ("interview_id", "question_id");



ALTER TABLE ONLY "public"."interview_answers"
    ADD CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_exit_answers"
    ADD CONSTRAINT "interview_exit_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_ninety_days_answers"
    ADD CONSTRAINT "interview_ninety_days_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_questions"
    ADD CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_template_questions"
    ADD CONSTRAINT "interview_template_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_templates"
    ADD CONSTRAINT "interview_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_templates"
    ADD CONSTRAINT "interview_templates_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_candidates"
    ADD CONSTRAINT "job_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_openings"
    ADD CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_positions"
    ADD CONSTRAINT "job_positions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."job_positions"
    ADD CONSTRAINT "job_positions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."job_positions"
    ADD CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_evaluations"
    ADD CONSTRAINT "leader_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_track_courses"
    ADD CONSTRAINT "learning_track_courses_pkey" PRIMARY KEY ("track_id", "course_id");



ALTER TABLE ONLY "public"."learning_track_enrollments"
    ADD CONSTRAINT "learning_track_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_track_enrollments"
    ADD CONSTRAINT "learning_track_enrollments_track_id_user_id_key" UNIQUE ("track_id", "user_id");



ALTER TABLE ONLY "public"."learning_tracks"
    ADD CONSTRAINT "learning_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("meeting_id", "user_id");



ALTER TABLE ONLY "public"."meeting_tasks"
    ADD CONSTRAINT "meeting_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_topics"
    ADD CONSTRAINT "meeting_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_types"
    ADD CONSTRAINT "meeting_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."meeting_types"
    ADD CONSTRAINT "meeting_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id", "category");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizational_competencies"
    ADD CONSTRAINT "organizational_competencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdi_actions"
    ADD CONSTRAINT "pdi_actions_pkey" PRIMARY KEY ("development_plan_id", "id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recruitment_interviews"
    ADD CONSTRAINT "recruitment_interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salary_classes"
    ADD CONSTRAINT "salary_classes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."salary_classes"
    ADD CONSTRAINT "salary_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salary_levels"
    ADD CONSTRAINT "salary_levels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."salary_levels"
    ADD CONSTRAINT "salary_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_answers"
    ADD CONSTRAINT "satisfaction_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_participants"
    ADD CONSTRAINT "satisfaction_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_participants"
    ADD CONSTRAINT "satisfaction_participants_survey_id_user_id_key" UNIQUE ("survey_id", "user_id");



ALTER TABLE ONLY "public"."satisfaction_questions"
    ADD CONSTRAINT "satisfaction_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_responses"
    ADD CONSTRAINT "satisfaction_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."self_evaluations"
    ADD CONSTRAINT "self_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_position_levels"
    ADD CONSTRAINT "track_position_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_position_levels"
    ADD CONSTRAINT "track_position_levels_track_position_id_salary_level_id_key" UNIQUE ("track_position_id", "salary_level_id");



ALTER TABLE ONLY "public"."track_positions"
    ADD CONSTRAINT "track_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizational_competencies"
    ADD CONSTRAINT "unique_competency_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "cultural_code_items_section_idx" ON "public"."cultural_code_items" USING "btree" ("section_id");



CREATE INDEX "idx_audit_logs_actor" ON "public"."audit_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("table_name", "record_id", "created_at" DESC);



CREATE INDEX "idx_class_enrollments_class" ON "public"."class_enrollments" USING "btree" ("class_id");



CREATE INDEX "idx_class_enrollments_user" ON "public"."class_enrollments" USING "btree" ("user_id");



CREATE INDEX "idx_consensus_evaluations_cycle_id" ON "public"."consensus_evaluations" USING "btree" ("cycle_id");



CREATE INDEX "idx_consensus_evaluations_promoted" ON "public"."consensus_evaluations" USING "btree" ("promoted_potential_quadrant") WHERE ("promoted_potential_quadrant" IS NOT NULL);



CREATE INDEX "idx_course_classes_course" ON "public"."course_classes" USING "btree" ("course_id");



CREATE INDEX "idx_course_contents_course" ON "public"."course_contents" USING "btree" ("course_id", "position");



CREATE INDEX "idx_external_courses_user" ON "public"."external_courses" USING "btree" ("user_id");



CREATE INDEX "idx_feedback_requests_requested" ON "public"."feedback_requests" USING "btree" ("requested_id", "status");



CREATE INDEX "idx_feedback_requests_requester" ON "public"."feedback_requests" USING "btree" ("requester_id", "status");



CREATE INDEX "idx_feedbacks_author" ON "public"."feedbacks" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_feedbacks_recipient" ON "public"."feedbacks" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_interview_exit_interview_id" ON "public"."interview_exit_answers" USING "btree" ("interview_id");



CREATE INDEX "idx_interview_ninety_days_interview_id" ON "public"."interview_ninety_days_answers" USING "btree" ("interview_id");



CREATE INDEX "idx_interviews_employee_id" ON "public"."interviews" USING "btree" ("employee_id");



CREATE INDEX "idx_interviews_scheduled_date" ON "public"."interviews" USING "btree" ("scheduled_date");



CREATE INDEX "idx_interviews_status" ON "public"."interviews" USING "btree" ("status");



CREATE INDEX "idx_interviews_type" ON "public"."interviews" USING "btree" ("type");



CREATE INDEX "idx_job_candidates_job_opening_id" ON "public"."job_candidates" USING "btree" ("job_opening_id");



CREATE INDEX "idx_job_candidates_status" ON "public"."job_candidates" USING "btree" ("status");



CREATE INDEX "idx_job_openings_department_id" ON "public"."job_openings" USING "btree" ("department_id");



CREATE INDEX "idx_job_openings_requested_by" ON "public"."job_openings" USING "btree" ("requested_by");



CREATE INDEX "idx_job_openings_status" ON "public"."job_openings" USING "btree" ("status");



CREATE INDEX "idx_meeting_participants_user" ON "public"."meeting_participants" USING "btree" ("user_id");



CREATE INDEX "idx_meetings_organizer" ON "public"."meetings" USING "btree" ("organizer_id", "scheduled_at" DESC);



CREATE INDEX "idx_meetings_scheduled" ON "public"."meetings" USING "btree" ("status", "scheduled_at");



CREATE INDEX "idx_notifications_group_key" ON "public"."notifications" USING "btree" ("recipient_id", "group_key") WHERE ("read" = false);



CREATE INDEX "idx_notifications_recipient_created" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_unread" ON "public"."notifications" USING "btree" ("recipient_id", "read") WHERE ("archived" = false);



CREATE INDEX "idx_organizational_competencies_active" ON "public"."organizational_competencies" USING "btree" ("is_active");



CREATE INDEX "idx_organizational_competencies_position" ON "public"."organizational_competencies" USING "btree" ("position");



CREATE INDEX "idx_pdi_actions_course" ON "public"."pdi_actions" USING "btree" ("course_id") WHERE ("course_id" IS NOT NULL);



CREATE INDEX "idx_pdi_actions_due" ON "public"."pdi_actions" USING "btree" ("due_date") WHERE ("status" <> ALL (ARRAY['4'::"text", '5'::"text"]));



CREATE INDEX "idx_pdi_actions_plan" ON "public"."pdi_actions" USING "btree" ("development_plan_id");



CREATE INDEX "idx_recruitment_interviews_candidate_id" ON "public"."recruitment_interviews" USING "btree" ("candidate_id");



CREATE INDEX "idx_satisfaction_answers_question_id" ON "public"."satisfaction_answers" USING "btree" ("question_id");



CREATE INDEX "idx_satisfaction_answers_response_id" ON "public"."satisfaction_answers" USING "btree" ("response_id");



CREATE INDEX "idx_satisfaction_questions_survey_id" ON "public"."satisfaction_questions" USING "btree" ("survey_id");



CREATE INDEX "idx_satisfaction_responses_survey_id" ON "public"."satisfaction_responses" USING "btree" ("survey_id");



CREATE INDEX "idx_satisfaction_surveys_status" ON "public"."satisfaction_surveys" USING "btree" ("status");



CREATE INDEX "idx_track_enrollments_user" ON "public"."learning_track_enrollments" USING "btree" ("user_id");



CREATE INDEX "idx_track_position_levels_salary_level_id" ON "public"."track_position_levels" USING "btree" ("salary_level_id");



CREATE INDEX "idx_track_position_levels_track_position_id" ON "public"."track_position_levels" USING "btree" ("track_position_id");



CREATE INDEX "idx_users_position_is_confidential" ON "public"."users" USING "btree" ("position_is_confidential") WHERE ("position_is_confidential" = true);



CREATE INDEX "interview_questions_interview_idx" ON "public"."interview_questions" USING "btree" ("interview_id");



CREATE UNIQUE INDEX "interviews_public_token_key" ON "public"."interviews" USING "btree" ("public_token");



CREATE OR REPLACE TRIGGER "trg_audit_consensus_evaluations" AFTER INSERT OR DELETE OR UPDATE ON "public"."consensus_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_row"();



CREATE OR REPLACE TRIGGER "trg_audit_leader_evaluations" AFTER INSERT OR DELETE OR UPDATE ON "public"."leader_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_row"();



CREATE OR REPLACE TRIGGER "trg_audit_self_evaluations" AFTER INSERT OR DELETE OR UPDATE ON "public"."self_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_row"();



CREATE OR REPLACE TRIGGER "trigger_update_organizational_competencies_updated_at" BEFORE UPDATE ON "public"."organizational_competencies" FOR EACH ROW EXECUTE FUNCTION "public"."update_organizational_competencies_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_pdi_items_trigger" BEFORE INSERT OR UPDATE ON "public"."development_plans" FOR EACH ROW WHEN (("new"."items" IS NOT NULL)) EXECUTE FUNCTION "public"."validate_pdi_items"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."career_tracks"
    ADD CONSTRAINT "career_tracks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."class_enrollments"
    ADD CONSTRAINT "class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_enrollments"
    ADD CONSTRAINT "class_enrollments_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."class_enrollments"
    ADD CONSTRAINT "class_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_leader_evaluation_id_fkey" FOREIGN KEY ("leader_evaluation_id") REFERENCES "public"."leader_evaluations"("id");



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_promoted_by_fkey" FOREIGN KEY ("promoted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."consensus_evaluations"
    ADD CONSTRAINT "consensus_evaluations_self_evaluation_id_fkey" FOREIGN KEY ("self_evaluation_id") REFERENCES "public"."self_evaluations"("id");



ALTER TABLE ONLY "public"."content_progress"
    ADD CONSTRAINT "content_progress_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."course_contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_progress"
    ADD CONSTRAINT "content_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."class_enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_classes"
    ADD CONSTRAINT "course_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_classes"
    ADD CONSTRAINT "course_classes_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."satisfaction_surveys"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."course_contents"
    ADD CONSTRAINT "course_contents_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cultural_code_items"
    ADD CONSTRAINT "cultural_code_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."cultural_code_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_consensus_evaluation_id_fkey" FOREIGN KEY ("consensus_evaluation_id") REFERENCES "public"."consensus_evaluations"("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."development_plans"
    ADD CONSTRAINT "development_plans_leader_evaluation_id_fkey" FOREIGN KEY ("leader_evaluation_id") REFERENCES "public"."leader_evaluations"("id");



ALTER TABLE ONLY "public"."evaluation_competencies"
    ADD CONSTRAINT "evaluation_competencies_leader_evaluation_id_fkey" FOREIGN KEY ("leader_evaluation_id") REFERENCES "public"."leader_evaluations"("id");



ALTER TABLE ONLY "public"."evaluation_competencies"
    ADD CONSTRAINT "evaluation_competencies_self_evaluation_id_fkey" FOREIGN KEY ("self_evaluation_id") REFERENCES "public"."self_evaluations"("id");



ALTER TABLE ONLY "public"."evaluation_cycles"
    ADD CONSTRAINT "evaluation_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."external_courses"
    ADD CONSTRAINT "external_courses_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."external_courses"
    ADD CONSTRAINT "external_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_requests"
    ADD CONSTRAINT "feedback_requests_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedback_requests"
    ADD CONSTRAINT "feedback_requests_requested_id_fkey" FOREIGN KEY ("requested_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."feedback_requests"
    ADD CONSTRAINT "feedback_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."feedback_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."feedback_types"("id");



ALTER TABLE ONLY "public"."interview_answers"
    ADD CONSTRAINT "interview_answers_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_answers"
    ADD CONSTRAINT "interview_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_exit_answers"
    ADD CONSTRAINT "interview_exit_answers_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_ninety_days_answers"
    ADD CONSTRAINT "interview_ninety_days_answers_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_questions"
    ADD CONSTRAINT "interview_questions_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_template_questions"
    ADD CONSTRAINT "interview_template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."interview_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_candidates"
    ADD CONSTRAINT "job_candidates_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "public"."job_openings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_openings"
    ADD CONSTRAINT "job_openings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_openings"
    ADD CONSTRAINT "job_openings_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leader_evaluations"
    ADD CONSTRAINT "leader_evaluations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."leader_evaluations"
    ADD CONSTRAINT "leader_evaluations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leader_evaluations"
    ADD CONSTRAINT "leader_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."learning_track_courses"
    ADD CONSTRAINT "learning_track_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_track_courses"
    ADD CONSTRAINT "learning_track_courses_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_track_enrollments"
    ADD CONSTRAINT "learning_track_enrollments_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."learning_track_enrollments"
    ADD CONSTRAINT "learning_track_enrollments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_track_enrollments"
    ADD CONSTRAINT "learning_track_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_tracks"
    ADD CONSTRAINT "learning_tracks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_tasks"
    ADD CONSTRAINT "meeting_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_tasks"
    ADD CONSTRAINT "meeting_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_tasks"
    ADD CONSTRAINT "meeting_tasks_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_topics"
    ADD CONSTRAINT "meeting_topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_topics"
    ADD CONSTRAINT "meeting_topics_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_parent_meeting_id_fkey" FOREIGN KEY ("parent_meeting_id") REFERENCES "public"."meetings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."meeting_types"("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizational_competencies"
    ADD CONSTRAINT "organizational_competencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pdi_actions"
    ADD CONSTRAINT "pdi_actions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pdi_actions"
    ADD CONSTRAINT "pdi_actions_development_plan_id_fkey" FOREIGN KEY ("development_plan_id") REFERENCES "public"."development_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_from_salary_level_id_fkey" FOREIGN KEY ("from_salary_level_id") REFERENCES "public"."salary_levels"("id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_from_track_position_id_fkey" FOREIGN KEY ("from_track_position_id") REFERENCES "public"."track_positions"("id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_to_salary_level_id_fkey" FOREIGN KEY ("to_salary_level_id") REFERENCES "public"."salary_levels"("id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_to_track_position_id_fkey" FOREIGN KEY ("to_track_position_id") REFERENCES "public"."track_positions"("id");



ALTER TABLE ONLY "public"."progression_history"
    ADD CONSTRAINT "progression_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."recruitment_interviews"
    ADD CONSTRAINT "recruitment_interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."job_candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recruitment_interviews"
    ADD CONSTRAINT "recruitment_interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."satisfaction_answers"
    ADD CONSTRAINT "satisfaction_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."satisfaction_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_answers"
    ADD CONSTRAINT "satisfaction_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."satisfaction_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_participants"
    ADD CONSTRAINT "satisfaction_participants_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."satisfaction_surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_participants"
    ADD CONSTRAINT "satisfaction_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_questions"
    ADD CONSTRAINT "satisfaction_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."satisfaction_surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_responses"
    ADD CONSTRAINT "satisfaction_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."satisfaction_responses"
    ADD CONSTRAINT "satisfaction_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."satisfaction_surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."self_evaluations"
    ADD CONSTRAINT "self_evaluations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."self_evaluations"
    ADD CONSTRAINT "self_evaluations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."track_position_levels"
    ADD CONSTRAINT "track_position_levels_salary_level_id_fkey" FOREIGN KEY ("salary_level_id") REFERENCES "public"."salary_levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_position_levels"
    ADD CONSTRAINT "track_position_levels_track_position_id_fkey" FOREIGN KEY ("track_position_id") REFERENCES "public"."track_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_positions"
    ADD CONSTRAINT "track_positions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."salary_classes"("id");



ALTER TABLE ONLY "public"."track_positions"
    ADD CONSTRAINT "track_positions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."job_positions"("id");



ALTER TABLE ONLY "public"."track_positions"
    ADD CONSTRAINT "track_positions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."career_tracks"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_current_salary_level_id_fkey" FOREIGN KEY ("current_salary_level_id") REFERENCES "public"."salary_levels"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_current_track_position_id_fkey" FOREIGN KEY ("current_track_position_id") REFERENCES "public"."track_positions"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."track_positions"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_reports_to_fkey" FOREIGN KEY ("reports_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."career_tracks"("id");



CREATE POLICY "Allow authenticated delete" ON "public"."team_members" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated insert" ON "public"."team_members" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."career_tracks" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."competencies" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."departments" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."evaluation_cycles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."job_positions" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."organizational_competencies" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."progression_history" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."salary_classes" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."salary_levels" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."team_members" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."teams" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."track_position_levels" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read" ON "public"."track_positions" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can insert answers" ON "public"."satisfaction_answers" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can insert development plans" ON "public"."development_plans" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can insert responses" ON "public"."satisfaction_responses" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read answers" ON "public"."satisfaction_answers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read job_candidates" ON "public"."job_candidates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read job_openings" ON "public"."job_openings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read questions" ON "public"."satisfaction_questions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read recruitment_interviews" ON "public"."recruitment_interviews" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read responses" ON "public"."satisfaction_responses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can read surveys" ON "public"."satisfaction_surveys" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated can update development plans" ON "public"."development_plans" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can view audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can view development plans" ON "public"."development_plans" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can read exit" ON "public"."interview_exit_answers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read interviews" ON "public"."interviews" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read ninety_days" ON "public"."interview_ninety_days_answers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view all users" ON "public"."users" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Service can insert notifications" ON "public"."notifications" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service manages audit logs" ON "public"."audit_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages class enrollments" ON "public"."class_enrollments" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages content progress" ON "public"."content_progress" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages course classes" ON "public"."course_classes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages course contents" ON "public"."course_contents" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages courses" ON "public"."courses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages external courses" ON "public"."external_courses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages feedback requests" ON "public"."feedback_requests" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages feedback types" ON "public"."feedback_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages feedbacks" ON "public"."feedbacks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages learning tracks" ON "public"."learning_tracks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meeting notes" ON "public"."meeting_notes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meeting participants" ON "public"."meeting_participants" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meeting tasks" ON "public"."meeting_tasks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meeting topics" ON "public"."meeting_topics" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meeting types" ON "public"."meeting_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages meetings" ON "public"."meetings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages notification preferences" ON "public"."notification_preferences" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages pdi actions" ON "public"."pdi_actions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages track courses" ON "public"."learning_track_courses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service manages track enrollments" ON "public"."learning_track_enrollments" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can delete users" ON "public"."users" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Service role can insert users" ON "public"."users" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role full access on answers" ON "public"."satisfaction_answers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on exit" ON "public"."interview_exit_answers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on interviews" ON "public"."interviews" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on job_candidates" ON "public"."job_candidates" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on job_openings" ON "public"."job_openings" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on ninety_days" ON "public"."interview_ninety_days_answers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on questions" ON "public"."satisfaction_questions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on recruitment_interviews" ON "public"."recruitment_interviews" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on responses" ON "public"."satisfaction_responses" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access on surveys" ON "public"."satisfaction_surveys" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id")) WITH CHECK (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own development plans" ON "public"."development_plans" FOR SELECT USING (("auth"."uid"() = "employee_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consensus_evaluations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consensus_evaluations_insert" ON "public"."consensus_evaluations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "v"
  WHERE (("v"."id" = "auth"."uid"()) AND (COALESCE("v"."is_director", false) OR COALESCE((("to_jsonb"("v".*) ->> 'is_admin'::"text"))::boolean, false))))));



CREATE POLICY "consensus_evaluations_select" ON "public"."consensus_evaluations" FOR SELECT TO "authenticated" USING ("public"."can_view_employee"("employee_id"));



ALTER TABLE "public"."content_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cultural_code_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cultural_code_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "directors_can_manage" ON "public"."users" TO "authenticated" USING ("public"."is_director"()) WITH CHECK ("public"."is_director"());



ALTER TABLE "public"."evaluation_competencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "evaluation_competencies_select" ON "public"."evaluation_competencies" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."self_evaluations" "s"
  WHERE (("s"."id" = "evaluation_competencies"."self_evaluation_id") AND "public"."can_view_employee"("s"."employee_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."leader_evaluations" "l"
  WHERE (("l"."id" = "evaluation_competencies"."leader_evaluation_id") AND ("public"."can_view_employee"("l"."employee_id") OR ("l"."evaluator_id" = "auth"."uid"())))))));



ALTER TABLE "public"."external_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_exit_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_ninety_days_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_template_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_openings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_evaluations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leader_evaluations_select" ON "public"."leader_evaluations" FOR SELECT TO "authenticated" USING (("public"."can_view_employee"("employee_id") OR ("evaluator_id" = "auth"."uid"())));



ALTER TABLE "public"."learning_track_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_track_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdi_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recruitment_interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."self_evaluations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "self_evaluations_select" ON "public"."self_evaluations" FOR SELECT TO "authenticated" USING ("public"."can_view_employee"("employee_id"));



CREATE POLICY "service_role_all" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "users_can_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."calculate_salary"("p_track_position_id" "uuid", "p_salary_level_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_salary"("p_track_position_id" "uuid", "p_salary_level_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_salary"("p_track_position_id" "uuid", "p_salary_level_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_view_employee"("target_employee" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_employee"("target_employee" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_employee"("target_employee" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_employee"("target_employee" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_no_circular_reporting"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_no_circular_reporting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_no_circular_reporting"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_update_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_update_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_update_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_audit_row"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_audit_row"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_audit_row"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_active_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_active_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_director"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_director"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_director"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organizational_competencies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organizational_competencies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organizational_competencies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_salary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_salary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_salary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_pdi_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_pdi_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_pdi_items"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."career_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."career_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."class_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."competencies" TO "anon";
GRANT ALL ON TABLE "public"."competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."competencies" TO "service_role";



GRANT ALL ON TABLE "public"."consensus_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."consensus_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."content_progress" TO "service_role";



GRANT ALL ON TABLE "public"."course_classes" TO "service_role";



GRANT ALL ON TABLE "public"."course_contents" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."cultural_code_items" TO "service_role";



GRANT ALL ON TABLE "public"."cultural_code_sections" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."development_plans" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_competencies" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."external_courses" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_requests" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_types" TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."interview_answers" TO "service_role";



GRANT ALL ON TABLE "public"."interview_exit_answers" TO "anon";
GRANT ALL ON TABLE "public"."interview_exit_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_exit_answers" TO "service_role";



GRANT ALL ON TABLE "public"."interview_ninety_days_answers" TO "anon";
GRANT ALL ON TABLE "public"."interview_ninety_days_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_ninety_days_answers" TO "service_role";



GRANT ALL ON TABLE "public"."interview_questions" TO "service_role";



GRANT ALL ON TABLE "public"."interview_template_questions" TO "service_role";



GRANT ALL ON TABLE "public"."interview_templates" TO "service_role";



GRANT ALL ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT ALL ON TABLE "public"."job_candidates" TO "anon";
GRANT ALL ON TABLE "public"."job_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."job_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."job_openings" TO "anon";
GRANT ALL ON TABLE "public"."job_openings" TO "authenticated";
GRANT ALL ON TABLE "public"."job_openings" TO "service_role";



GRANT ALL ON TABLE "public"."job_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."job_positions" TO "service_role";



GRANT ALL ON TABLE "public"."leader_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."learning_track_courses" TO "service_role";



GRANT ALL ON TABLE "public"."learning_track_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."learning_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_notes" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_participants" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_topics" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_types" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organizational_competencies" TO "anon";
GRANT ALL ON TABLE "public"."organizational_competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."organizational_competencies" TO "service_role";



GRANT ALL ON TABLE "public"."pdi_actions" TO "service_role";



GRANT ALL ON TABLE "public"."progression_history" TO "service_role";



GRANT ALL ON TABLE "public"."recruitment_interviews" TO "anon";
GRANT ALL ON TABLE "public"."recruitment_interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."recruitment_interviews" TO "service_role";



GRANT ALL ON TABLE "public"."salary_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."salary_classes" TO "service_role";



GRANT ALL ON TABLE "public"."salary_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."salary_levels" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_answers" TO "anon";
GRANT ALL ON TABLE "public"."satisfaction_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."satisfaction_answers" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_participants" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_questions" TO "anon";
GRANT ALL ON TABLE "public"."satisfaction_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."satisfaction_questions" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_responses" TO "anon";
GRANT ALL ON TABLE "public"."satisfaction_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."satisfaction_responses" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "anon";
GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "service_role";



GRANT ALL ON TABLE "public"."self_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."self_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."track_position_levels" TO "anon";
GRANT ALL ON TABLE "public"."track_position_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."track_position_levels" TO "service_role";



GRANT ALL ON TABLE "public"."track_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."track_positions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."user_calculated_salaries" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."users_safe" TO "anon";
GRANT ALL ON TABLE "public"."users_safe" TO "authenticated";
GRANT ALL ON TABLE "public"."users_safe" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
