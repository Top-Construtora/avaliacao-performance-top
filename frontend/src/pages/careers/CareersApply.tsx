import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle, MapPin, Paperclip, Send, Briefcase } from 'lucide-react';
import {
  careersService,
  fileToBase64,
  PublicOpening,
  CandidateApplication,
} from '../../services/careers.service';

/**
 * Cadastro do candidato na vaga — o formulário que substitui o RH digitando
 * candidato por candidato.
 *
 * O que a pessoa preenche aqui é o mini currículo dela: fica guardado e é
 * reaproveitado se ela se candidatar a outra vaga com o mesmo e-mail.
 */
const doneKey = (id: string) => `gio_vaga_candidatura_${id}`;

// Fora do componente: componente declarado dentro do render vira um tipo novo
// a cada tecla, e os campos perdem o foco.
const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8 sm:py-12">
    <div className="w-full max-w-2xl">{children}</div>
  </div>
);

const Campo = ({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
      {label}
      {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3';

const CareersApply = () => {
  const { id } = useParams();
  const [vaga, setVaga] = useState<PublicOpening | null>(null);
  const [loading, setLoading] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const [form, setForm] = useState<CandidateApplication>({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    linkedin_url: '',
    summary: '',
    education: '',
    experience: '',
    skills: '',
    salary_expectation: null,
    availability: '',
  });
  const [arquivo, setArquivo] = useState<File | null>(null);

  const set = (campo: keyof CandidateApplication, valor: any) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  useEffect(() => {
    if (!id) return;
    if (localStorage.getItem(doneKey(id))) setPronto(true);
    (async () => {
      try {
        setVaga(await careersService.getOpening(id));
      } catch {
        setIndisponivel(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const enviar = async () => {
    if (!id) return;

    const obrigatorios: Array<[keyof CandidateApplication, string]> = [
      ['name', 'Nome completo'],
      ['email', 'E-mail'],
      ['phone', 'Telefone'],
      ['city', 'Cidade'],
      ['summary', 'Resumo profissional'],
      ['education', 'Formação'],
      ['experience', 'Experiência profissional'],
      ['skills', 'Principais competências'],
    ];
    const faltando = obrigatorios.find(([campo]) => !String(form[campo] || '').trim());
    if (faltando) {
      toast.error(`Preencha o campo "${faltando[1]}"`);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      toast.error('Informe um e-mail válido');
      return;
    }

    try {
      setEnviando(true);
      const payload: CandidateApplication = { ...form };
      if (arquivo) {
        payload.resume_filename = arquivo.name;
        payload.resume_base64 = await fileToBase64(arquivo);
      }
      if (!payload.salary_expectation) payload.salary_expectation = null;

      await careersService.apply(id, payload);
      localStorage.setItem(doneKey(id), '1');
      setPronto(true);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível enviar sua candidatura');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="h-64 rounded-2xl bg-secondary animate-pulse" />
      </Shell>
    );
  }

  if (indisponivel || !vaga) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <h1 className="text-lg font-semibold mb-2">Vaga indisponível</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Esta vaga não está mais aberta para candidaturas.
          </p>
          <Link to="/vagas" className="text-lime-deep dark:text-lime font-medium hover:underline">
            Ver as vagas abertas
          </Link>
        </div>
      </Shell>
    );
  }

  if (pronto) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-10 text-center"
        >
          <CheckCircle className="h-12 w-12 text-lime-deep dark:text-lime mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Candidatura enviada!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Recebemos seu currículo para a vaga de <strong>{vaga.title}</strong>. Se o perfil
            combinar, a gente entra em contato pelo e-mail ou telefone informado.
          </p>
          <Link to="/vagas" className="text-lime-deep dark:text-lime font-medium hover:underline">
            Ver outras vagas
          </Link>
        </motion.div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        to="/vagas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as vagas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-6"
      >
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-lime-deep dark:text-lime shrink-0" />
          {vaga.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          {vaga.department?.name && <span>{vaga.department.name}</span>}
          {vaga.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {vaga.location}
            </span>
          )}
        </div>

        {vaga.description && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold mb-1">Sobre a vaga</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {vaga.description}
            </p>
          </div>
        )}
        {vaga.requirements && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-1">Requisitos</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {vaga.requirements}
            </p>
          </div>
        )}
        {vaga.benefits && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-1">Benefícios</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {vaga.benefits}
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4"
      >
        <div>
          <h2 className="text-lg font-bold">Seu cadastro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estes dados formam seu currículo na nossa base. Você só precisa preencher uma vez.
          </p>
        </div>

        <Campo label="Nome completo" obrigatorio>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Como você assina seu currículo"
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="E-mail" obrigatorio>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="seu@email.com"
            />
          </Campo>
          <Campo label="Telefone / WhatsApp" obrigatorio>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Campo label="Cidade" obrigatorio>
              <input
                className={inputClass}
                value={form.city || ''}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Onde você mora"
              />
            </Campo>
          </div>
          <Campo label="Estado">
            <input
              className={inputClass}
              value={form.state || ''}
              onChange={(e) => set('state', e.target.value)}
              placeholder="GO"
              maxLength={2}
            />
          </Campo>
        </div>

        <Campo label="LinkedIn">
          <input
            className={inputClass}
            value={form.linkedin_url || ''}
            onChange={(e) => set('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/seu-perfil"
          />
        </Campo>

        <Campo label="Resumo profissional" obrigatorio>
          <textarea
            className={`${inputClass} resize-y min-h-[6rem]`}
            rows={4}
            value={form.summary || ''}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Em poucas linhas: quem você é profissionalmente e o que procura"
          />
        </Campo>

        <Campo label="Formação" obrigatorio>
          <textarea
            className={`${inputClass} resize-y min-h-[6rem]`}
            rows={4}
            value={form.education || ''}
            onChange={(e) => set('education', e.target.value)}
            placeholder="Cursos, instituições e ano de conclusão"
          />
        </Campo>

        <Campo label="Experiência profissional" obrigatorio>
          <textarea
            className={`${inputClass} resize-y min-h-[8rem]`}
            rows={6}
            value={form.experience || ''}
            onChange={(e) => set('experience', e.target.value)}
            placeholder="Empresas, cargos, período e principais responsabilidades"
          />
        </Campo>

        <Campo label="Principais competências" obrigatorio>
          <textarea
            className={`${inputClass} resize-y min-h-[5rem]`}
            rows={3}
            value={form.skills || ''}
            onChange={(e) => set('skills', e.target.value)}
            placeholder="Ferramentas, técnicas e habilidades que você domina"
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Pretensão salarial (R$)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.salary_expectation ?? ''}
              onChange={(e) =>
                set('salary_expectation', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="0"
            />
          </Campo>
          <Campo label="Disponibilidade para início">
            <input
              className={inputClass}
              value={form.availability || ''}
              onChange={(e) => set('availability', e.target.value)}
              placeholder="Imediata, 30 dias..."
            />
          </Campo>
        </div>

        <Campo label="Currículo em arquivo (opcional)">
          <label className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl border border-dashed border-border cursor-pointer hover:border-solid transition">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">
              {arquivo ? arquivo.name : 'Anexar PDF ou DOC (até 5MB)'}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.error('Arquivo acima de 5MB');
                  return;
                }
                setArquivo(file);
              }}
            />
          </label>
        </Campo>

        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D2FF00] text-obsidian font-bold hover:brightness-95 transition disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {enviando ? 'Enviando...' : 'Enviar candidatura'}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Ao enviar, seus dados ficam guardados no nosso banco de currículos para esta e futuras
          oportunidades.
        </p>
      </motion.div>
    </Shell>
  );
};

export default CareersApply;
