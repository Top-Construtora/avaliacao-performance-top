import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

/**
 * Portal de vagas — aberto, sem login.
 *
 * É a contraparte pública do módulo de recrutamento: o candidato vê as vagas
 * abertas, preenche o próprio mini currículo e se candidata. Antes disso, o RH
 * digitava candidato por candidato.
 *
 * Tudo aqui devolve só o que pode ser lido por qualquer pessoa da internet: o
 * brief do gestor, a faixa salarial e quem solicitou a vaga ficam de fora.
 */

/** Status em que a vaga aceita candidatura. Rascunho e fechada não aparecem. */
const STATUS_PUBLICOS = ['open', 'in_progress'];

/** Campos que o candidato pode ver da vaga. */
const CAMPOS_PUBLICOS =
  'id, title, description, requirements, benefits, location, contract_type, positions_count, status, created_at, department:departments!job_openings_department_id_fkey(id, name)';

const BUCKET_CURRICULOS = 'curriculos';
const MAX_CURRICULO_BYTES = 5 * 1024 * 1024;

const candidaturaSchema = z.object({
  name: z.string().trim().min(3).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(30),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(60).optional().nullable(),
  linkedin_url: z.string().trim().max(300).optional().nullable(),
  summary: z.string().trim().max(2000).optional().nullable(),
  education: z.string().trim().max(3000).optional().nullable(),
  experience: z.string().trim().max(5000).optional().nullable(),
  skills: z.string().trim().max(2000).optional().nullable(),
  salary_expectation: z.number().nonnegative().optional().nullable(),
  availability: z.string().trim().max(200).optional().nullable(),
  // Currículo em arquivo é opcional: o mini currículo do formulário já basta.
  resume_filename: z.string().max(200).optional().nullable(),
  resume_base64: z.string().optional().nullable(),
});

export const careersController = {
  async listOpenings(_req: Request, res: Response, next: NextFunction) {
    try {
      const { data, error } = await supabaseAdmin
        .from('job_openings')
        .select(CAMPOS_PUBLICOS)
        .in('status', STATUS_PUBLICOS)
        .order('created_at', { ascending: false });
      if (error) throw error;

      res.json({ success: true, data: data || [] });
    } catch (error) {
      next(error);
    }
  },

  async getOpening(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, error } = await supabaseAdmin
        .from('job_openings')
        .select(CAMPOS_PUBLICOS)
        .eq('id', req.params.id)
        .in('status', STATUS_PUBLICOS)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: 'Vaga não encontrada ou não está mais aberta' });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Candidatura. O e-mail identifica a pessoa: se ela já se cadastrou antes, o
   * currículo é atualizado em vez de duplicado — é o que faz o "mini currículo"
   * sobreviver de uma vaga para a outra.
   */
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = candidaturaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, error: 'Dados inválidos', details: parsed.error.issues });
      }
      const dados = parsed.data;

      const { data: vaga } = await supabaseAdmin
        .from('job_openings')
        .select('id, title, requested_by, status')
        .eq('id', req.params.id)
        .in('status', STATUS_PUBLICOS)
        .maybeSingle();
      if (!vaga) {
        return res
          .status(404)
          .json({ success: false, error: 'Vaga não encontrada ou não está mais aberta' });
      }

      const email = dados.email.toLowerCase();

      const { data: existente } = await supabaseAdmin
        .from('candidates')
        .select('id, resume_path, resume_name')
        .ilike('email', email)
        .maybeSingle();

      // Barra a segunda candidatura antes de gravar qualquer coisa — inclusive
      // antes de subir o arquivo, que ficaria órfão.
      if (existente) {
        const { data: jaCandidatou } = await supabaseAdmin
          .from('job_candidates')
          .select('id')
          .eq('job_opening_id', vaga.id)
          .eq('candidate_id', existente.id)
          .maybeSingle();
        if (jaCandidatou) {
          return res.status(409).json({
            success: false,
            error: 'Você já se candidatou a esta vaga. Cada pessoa pode se candidatar uma vez.',
          });
        }
      }

      let resumePath = existente?.resume_path || null;
      let resumeName = existente?.resume_name || null;

      if (dados.resume_base64 && dados.resume_filename) {
        const buffer = Buffer.from(dados.resume_base64, 'base64');
        if (buffer.length === 0) {
          return res.status(400).json({ success: false, error: 'Arquivo de currículo vazio' });
        }
        if (buffer.length > MAX_CURRICULO_BYTES) {
          return res.status(400).json({ success: false, error: 'Currículo acima de 5MB' });
        }

        const nomeSeguro = dados.resume_filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
        const path = `${email}/${Date.now()}_${nomeSeguro}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_CURRICULOS)
          .upload(path, buffer, { upsert: false });
        if (uploadError) {
          return res
            .status(500)
            .json({ success: false, error: `Erro ao enviar o currículo: ${uploadError.message}` });
        }
        resumePath = path;
        resumeName = dados.resume_filename;
      }

      const curriculo = {
        name: dados.name,
        email,
        phone: dados.phone,
        city: dados.city || null,
        state: dados.state || null,
        linkedin_url: dados.linkedin_url || null,
        summary: dados.summary || null,
        education: dados.education || null,
        experience: dados.experience || null,
        skills: dados.skills || null,
        salary_expectation: dados.salary_expectation ?? null,
        availability: dados.availability || null,
        resume_path: resumePath,
        resume_name: resumeName,
        updated_at: new Date().toISOString(),
      };

      const { data: candidato, error: erroCandidato } = existente
        ? await supabaseAdmin
            .from('candidates')
            .update(curriculo)
            .eq('id', existente.id)
            .select('id, name, email')
            .single()
        : await supabaseAdmin
            .from('candidates')
            .insert({ ...curriculo, source: 'portal' })
            .select('id, name, email')
            .single();

      if (erroCandidato || !candidato) throw erroCandidato;

      const { error: erroCandidatura } = await supabaseAdmin.from('job_candidates').insert({
        job_opening_id: vaga.id,
        candidate_id: candidato.id,
        name: candidato.name,
        email: candidato.email,
        phone: dados.phone,
        linkedin_url: dados.linkedin_url || null,
        source: 'portal',
        status: 'received',
      });

      // Corrida entre dois envios simultâneos: o índice único é quem decide.
      if (erroCandidatura) {
        if ((erroCandidatura as any).code === '23505') {
          return res.status(409).json({
            success: false,
            error: 'Você já se candidatou a esta vaga. Cada pessoa pode se candidatar uma vez.',
          });
        }
        throw erroCandidatura;
      }

      res.status(201).json({ success: true, data: { candidate_id: candidato.id } });
    } catch (error) {
      next(error);
    }
  },
};
