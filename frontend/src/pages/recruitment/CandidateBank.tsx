import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Users, Search, Mail, Phone, MapPin, Linkedin, FileDown, X, Briefcase } from 'lucide-react';
import { careersService, CandidateProfile } from '../../services/careers.service';

/**
 * Banco de currículos: as pessoas que se cadastraram pelo portal de vagas.
 *
 * A lista de candidatos de uma vaga responde "quem concorre a isto"; esta tela
 * responde "quem já passou por aqui" — inclusive de vagas fechadas, que é o
 * ponto de manter o currículo separado da candidatura.
 */
const CandidateBank = () => {
  const [candidatos, setCandidatos] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<CandidateProfile | null>(null);

  const carregar = async (termo?: string) => {
    try {
      setLoading(true);
      setCandidatos(await careersService.listCandidates(termo));
    } catch {
      toast.error('Erro ao carregar o banco de currículos');
    } finally {
      setLoading(false);
    }
  };

  // A busca vai ao servidor: o banco cresce além do que cabe numa página. Este
  // efeito também é quem faz a primeira carga (com a busca vazia).
  useEffect(() => {
    const timer = setTimeout(() => carregar(busca.trim() || undefined), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const abrirCurriculo = async (id: string) => {
    try {
      const perfil = await careersService.getCandidate(id);
      setAberto(perfil);
    } catch {
      toast.error('Erro ao abrir o currículo');
    }
  };

  const baixarArquivo = async (id: string) => {
    try {
      const { url } = await careersService.resumeUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Este candidato não anexou arquivo de currículo');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
              <Users className="h-7 w-7 text-lime-deep dark:text-lime mr-3" />
              Banco de Currículos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Quem se cadastrou pelo portal de vagas
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, e-mail, competência ou cidade"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : candidatos.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">Nenhum currículo por aqui ainda</h2>
          <p className="text-muted-foreground text-sm">
            {busca
              ? 'Nenhum candidato corresponde à busca.'
              : 'Assim que alguém se candidatar pelo portal, o currículo aparece nesta lista.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {candidatos.map((c, index) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 10) * 0.03 }}
              onClick={() => abrirCurriculo(c.id)}
              className="text-left bg-card border border-border rounded-2xl p-5 hover:border-lime transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground break-words">{c.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 shrink-0" />
                      {c.email}
                    </p>
                    {c.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        {c.phone}
                      </p>
                    )}
                    {(c.city || c.state) && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {[c.city, c.state].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                  {c.applications_count || 0}{' '}
                  {c.applications_count === 1 ? 'candidatura' : 'candidaturas'}
                </span>
              </div>
              {c.skills && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{c.skills}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Mini currículo */}
      {aberto && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={() => setAberto(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8"
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-xl font-bold break-words">{aberto.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{aberto.email}</p>
              </div>
              <button
                onClick={() => setAberto(null)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {aberto.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {aberto.phone}
                  </span>
                )}
                {(aberto.city || aberto.state) && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {[aberto.city, aberto.state].filter(Boolean).join(' - ')}
                  </span>
                )}
                {aberto.linkedin_url && (
                  <a
                    href={aberto.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-lime-deep dark:text-lime hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>

              {[
                ['Resumo profissional', aberto.summary],
                ['Formação', aberto.education],
                ['Experiência profissional', aberto.experience],
                ['Competências', aberto.skills],
              ].map(([titulo, conteudo]) =>
                conteudo ? (
                  <div key={String(titulo)}>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{titulo}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {conteudo}
                    </p>
                  </div>
                ) : null,
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {aberto.salary_expectation != null && (
                  <span className="text-muted-foreground">
                    Pretensão:{' '}
                    <strong className="text-foreground">
                      R$ {Number(aberto.salary_expectation).toLocaleString('pt-BR')}
                    </strong>
                  </span>
                )}
                {aberto.availability && (
                  <span className="text-muted-foreground">
                    Disponibilidade:{' '}
                    <strong className="text-foreground">{aberto.availability}</strong>
                  </span>
                )}
              </div>

              {aberto.applications && aberto.applications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Candidaturas</h3>
                  <div className="space-y-2">
                    {aberto.applications.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 text-sm bg-secondary rounded-lg px-3 py-2"
                      >
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">
                          {a.opening?.title || 'Vaga removida'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aberto.resume_name && (
                <button
                  onClick={() => baixarArquivo(aberto.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D2FF00] text-obsidian font-semibold text-sm hover:brightness-95 transition"
                >
                  <FileDown className="h-4 w-4" />
                  Baixar currículo ({aberto.resume_name})
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CandidateBank;
