import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronRight,
  Building2,
  Users,
  GitBranch,
  Crown,
  User,
  ClipboardCheck,
  ArrowRight,
  CheckCircle,
  Target,
  MessageSquare,
  BarChart3,
  BookOpen,
  Settings,
  UserPlus,
  FileText,
  TrendingUp,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUserRole } from '../../context/AuthContext';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  allowedRoles?: Array<'admin' | 'director' | 'leader' | 'collaborator'>;
}

// Componente para mostrar funcionalidades baseado no role
const FuncionalidadesContent = ({ role }: { role: 'admin' | 'director' | 'leader' | 'collaborator' }) => {
  const getRoleTitle = () => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'director': return 'Diretor';
      case 'leader': return 'Líder';
      default: return 'Colaborador';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return Settings;
      case 'director': return Award;
      case 'leader': return Crown;
      default: return User;
    }
  };

  const getFuncionalidades = () => {
    const base = [
      { title: 'Autoavaliação', desc: 'Realizar sua própria avaliação de desempenho' },
      { title: 'Visualizar Resultados', desc: 'Ver feedback e notas finais após consenso' },
      { title: 'Meu PDI', desc: 'Acompanhar seu Plano de Desenvolvimento Individual' },
      { title: 'Perfil', desc: 'Atualizar dados pessoais e foto de perfil' },
    ];

    const leader = [
      { title: 'Avaliar Time', desc: 'Avaliar desempenho dos colaboradores diretos' },
      { title: 'Gerenciar PDIs', desc: 'Criar e acompanhar PDIs da equipe' },
    ];

    const director = [
      { title: 'Consenso', desc: 'Definir notas finais e potencial dos avaliados' },
      { title: 'Nine Box', desc: 'Visualizar matriz de desempenho e potencial' },
      { title: 'Relatórios', desc: 'Acessar dashboards e análises gerenciais' },
    ];

    const admin = [
      { title: 'Gerenciar Usuários', desc: 'Cadastrar e editar colaboradores, líderes e times' },
      { title: 'Gerenciar Ciclos', desc: 'Criar e configurar ciclos de avaliação' },
      { title: 'Trilhas de Carreira', desc: 'Configurar trilhas, cargos e estrutura salarial' },
      { title: 'Código Cultural', desc: 'Gerenciar critérios de avaliação' },
      { title: 'Configurações', desc: 'Configurar preferências do sistema' },
    ];

    switch (role) {
      case 'admin':
        return [...base, ...leader, ...director, ...admin];
      case 'director':
        return [...base, ...leader, ...director];
      case 'leader':
        return [...base, ...leader];
      default:
        return base;
    }
  };

  const Icon = getRoleIcon();
  const funcionalidades = getFuncionalidades();

  return (
    <div className="space-y-6">
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Como <strong>{getRoleTitle()}</strong>, você tem acesso às seguintes funcionalidades:
      </p>

      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-7 w-7 text-primary dark:text-primary-400" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getRoleTitle()}</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {funcionalidades.map((func, index) => (
            <div key={index} className="bg-white dark:bg-yt-surface rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400" />
                {func.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{func.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HelpPage = () => {
  const { role } = useUserRole();
  const [expandedSection, setExpandedSection] = useState<string>(
    role === 'admin' || role === 'director' ? 'cadastro' : 'avaliacao'
  );

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? '' : id);
  };

  const sections: Section[] = [
    {
      id: 'cadastro',
      title: 'Ordem de Cadastro',
      icon: UserPlus,
      allowedRoles: ['admin', 'director'],
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Para utilizar o sistema de avaliação de desempenho, é necessário seguir uma ordem específica de cadastros.
            Cada etapa depende da anterior para funcionar corretamente.
          </p>

          <div className="space-y-4">
            {/* Departamento */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Departamento</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Crie os departamentos da organização. Cada departamento pode ter um responsável e representa
                    uma área funcional da empresa (ex: Tecnologia, Comercial, Financeiro).
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Gerenciar → Departamentos</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Time */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Time</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Crie os times dentro dos departamentos. Cada time pertence a um departamento e tem um líder responsável
                    (que será atribuído posteriormente).
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Gerenciar → Times</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Trilhas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trilhas de Carreiras</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Configure as trilhas de carreira para cada departamento. Defina os cargos, classes salariais e
                    níveis de progressão (A, B, C, D, E). Cada trilha representa um caminho de evolução profissional.
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Cargos e Salários → Trilhas</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Diretor */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Diretor</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Cadastre os diretores da empresa. Diretores não precisam de líder direto e têm acesso a funcionalidades
                    estratégicas como Nine Box, Comitê de Gente e Consenso.
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm mb-3">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Cadastrar → Cadastrar Usuário</span>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 text-sm">
                    <strong>⚙️ Configuração:</strong> Selecione o perfil "Diretor" e vincule ao departamento e trilha correspondente.
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Líder */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Líder</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Cadastre os líderes de time. Líderes reportam para diretores, gerenciam equipes e realizam
                    avaliações de seus colaboradores diretos.
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm mb-3">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Cadastrar → Cadastrar Usuário</span>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 text-sm">
                    <strong>⚙️ Configuração:</strong> Selecione o perfil "Líder", escolha o diretor responsável e vincule aos times que gerencia.
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Colaborador */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  6
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Colaborador</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Cadastre os colaboradores. Cada colaborador deve ser vinculado a um líder direto, time(s),
                    departamento, trilha de carreira e cargo.
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm mb-3">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Cadastrar → Cadastrar Usuário</span>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 text-sm">
                    <strong>⚙️ Configuração:</strong> Selecione o perfil "Colaborador", escolha o líder direto, times, departamento, trilha e cargo.
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Ciclo de Avaliação */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  7
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardCheck className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ciclo de Avaliação</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Crie um ciclo de avaliação de desempenho. Defina o período, selecione os critérios de avaliação
                    e escolha quais colaboradores e líderes participarão.
                  </p>
                  <div className="bg-white dark:bg-yt-surface rounded-lg p-3 text-sm mb-3">
                    <strong className="text-primary dark:text-primary-400">📍 Onde cadastrar:</strong>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Barra lateral → Gerenciar Ciclos  → Novo Ciclo</span>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 text-sm">
                    <strong>⚙️ Configuração:</strong> Defina nome, período, critérios e selecione os participantes (colaboradores e líderes).
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 'avaliacao',
      title: 'Processo de Avaliação',
      icon: Target,
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            O processo de avaliação segue uma sequência estruturada para garantir avaliações justas e completas.
            Cada etapa é essencial para o resultado final.
          </p>

          <div className="space-y-4">
            {/* Autoavaliação */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Autoavaliação</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Colaboradores e líderes realizam sua autoavaliação, pontuando-se nos critérios definidos no ciclo.
                    É o momento de reflexão sobre o próprio desempenho.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Quem participa:</strong> Todos os colaboradores e líderes incluídos no ciclo
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>O que fazer:</strong> Avaliar-se honestamente em cada critério (escala de 1 a 5)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Onde acessar:</strong> Menu → Minhas Avaliações → Autoavaliação
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Avaliação do Líder */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Avaliação do Líder</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Líderes e diretores avaliam seus subordinados diretos. Podem visualizar a autoavaliação como referência,
                    mas devem dar suas próprias notas baseadas na observação do desempenho.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Quem participa:</strong> Líderes avaliam colaboradores | Diretores avaliam líderes
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>O que fazer:</strong> Avaliar cada subordinado em todos os critérios com comentários
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Onde acessar:</strong> Menu → Avaliar Time
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Reunião de Consenso */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reunião de Consenso</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Diretores revisam as avaliações dos colaboradores e líderes. Comparam autoavaliação com avaliação
                    do líder e definem notas finais de consenso, além de definir o potencial de crescimento.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Quem participa:</strong> Apenas diretores
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>O que fazer:</strong> Analisar discrepâncias, definir notas finais e avaliar potencial
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Onde acessar:</strong> Menu → Consenso
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Comitê de Gente */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-6 w-6 text-primary dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comitê de Gente (Nine Box)</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Visualização estratégica dos resultados. O Nine Box mostra o posicionamento de cada pessoa
                    na matriz de Desempenho x Potencial, facilitando decisões de desenvolvimento e sucessão.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Quem participa:</strong> Apenas diretores
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>O que fazer:</strong> Analisar distribuição dos talentos, identificar sucessores e riscos
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Onde acessar:</strong> Menu → Nine Box
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>💡 Dica:</strong> Use o Nine Box para planejar promoções, desenvolvimento e retenção de talentos.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Importante</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Cada etapa só pode ser iniciada após a conclusão da anterior. O sistema controla automaticamente
                  o fluxo e libera as próximas etapas conforme o progresso do ciclo de avaliação.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'funcionalidades',
      title: 'Suas Funcionalidades',
      icon: Settings,
      content: (
        <FuncionalidadesContent role={role} />
      ),
    },
    {
      id: 'faq',
      title: 'Perguntas Frequentes',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ Posso editar minha avaliação depois de enviada?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Não. Após enviar a autoavaliação ou avaliação do líder, não é possível editar.
              Certifique-se de revisar todas as notas e comentários antes de finalizar.
            </p>
          </div>

          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ Quando posso ver meu resultado final?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Os resultados ficam disponíveis após a etapa de Consenso ser concluída e o ciclo de avaliação ser encerrado.
              Você será notificado quando os resultados estiverem liberados.
            </p>
          </div>

          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ O que é o Nine Box?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              É uma matriz 3x3 que posiciona cada pessoa de acordo com seu Desempenho (eixo X) e Potencial (eixo Y).
              É uma ferramenta estratégica para gestão de talentos e sucessão.
            </p>
          </div>

          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ Como funciona o PDI?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              O Plano de Desenvolvimento Individual (PDI) é criado ao fim da availiação do líder e define ações de desenvolvimento
              em curto, médio e longo prazo. Você e seu líder acompanham o progresso periodicamente.
            </p>
          </div>

          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ Posso ver a avaliação que meu líder fez de mim?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Sim, após o consenso você terá acesso às notas finais e comentários. A transparência é importante
              para seu desenvolvimento.
            </p>
          </div>

          <div className="bg-white dark:bg-yt-surface rounded-xl p-6 border border-gray-200 dark:border-yt-border">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ❓ Quanto tempo tenho para fazer minha autoavaliação?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              O prazo é definido no ciclo de avaliação. Fique atento às notificações e ao período estabelecido
              pela empresa. Recomenda-se não deixar para a última hora.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-yt-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary-700 dark:from-primary-800 dark:to-primary-900 rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white dark:bg-yt-surface rounded-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 font-lemon-milk tracking-wide">
                Central de Ajuda
              </h1>
              <p className="text-primary-100 dark:text-primary-200">
                Guia completo do sistema de avaliação de desempenho
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections
            .filter(section => !section.allowedRoles || section.allowedRoles.includes(role))
            .map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-yt-surface rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary dark:text-primary-400" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-yt-border"
                    >
                      <div className="p-6">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
