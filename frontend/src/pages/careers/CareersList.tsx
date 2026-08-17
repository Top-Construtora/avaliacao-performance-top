import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, MapPin, FileText, ArrowRight } from 'lucide-react';
import { careersService, PublicOpening } from '../../services/careers.service';

/**
 * Portal de vagas — página aberta, sem login.
 *
 * É por aqui que o candidato chega: vê as vagas abertas e entra na que
 * interessa para se cadastrar. Nenhum dado interno da vaga aparece (brief do
 * gestor, faixa salarial e solicitante ficam no sistema).
 */
const CONTRATO_LABEL: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  INTERN: 'Estágio',
};

const CareersList = () => {
  const [openings, setOpenings] = useState<PublicOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setOpenings(await careersService.listOpenings());
      } catch {
        setErro(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-lime-deep dark:text-lime" />
            Trabalhe com a gente
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Escolha uma vaga e cadastre seu currículo. Você preenche uma vez só — se quiser se
            candidatar a outra vaga depois, é só usar o mesmo e-mail.
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : erro ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">
              Não foi possível carregar as vagas agora. Tente novamente em alguns minutos.
            </p>
          </div>
        ) : openings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1">Nenhuma vaga aberta no momento</h2>
            <p className="text-muted-foreground text-sm">
              Volte em breve — novas oportunidades são publicadas por aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openings.map((vaga, index) => (
              <motion.div
                key={vaga.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/vagas/${vaga.id}`}
                  className="block bg-card border border-border rounded-2xl p-5 sm:p-6 hover:border-lime transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold break-words">{vaga.title}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {vaga.department?.name && <span>{vaga.department.name}</span>}
                        {vaga.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {vaga.location}
                          </span>
                        )}
                        {vaga.contract_type && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                            {CONTRATO_LABEL[vaga.contract_type] || vaga.contract_type}
                          </span>
                        )}
                        {vaga.positions_count > 1 && <span>{vaga.positions_count} posições</span>}
                      </div>
                      {vaga.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {vaga.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-lime-deep dark:group-hover:text-lime shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareersList;
