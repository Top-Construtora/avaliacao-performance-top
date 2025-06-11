import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  UserCheck, 
  Star, 
  Award,
  Target,
  Briefcase,
  GraduationCap,
  Gift,
  ChevronRight,
  Info,
  Sparkles,
  Zap,
  Trophy,
  Heart,
  Rocket,
  Shield,
  Brain,
  Gem,
  X
} from 'lucide-react';

const NineBoxGuide = () => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);

  const boxes = [
    {
      id: 1,
      title: "Insuficiente",
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      borderColor: "border-red-300",
      bgLight: "bg-red-50",
      textColor: "text-red-700",
      hoverBg: "hover:bg-red-200",
      performance: "baixo",
      potential: "baixo",
      summary: "Risco com assuntos de desempenho",
      description: "Não consegue se adaptar eficazmente a novas situações, não está disposto ou é incapaz de tomar iniciativas suficientes para alavancar seu próprio desempenho.",
      details: {
        recompensa: "Congele o salário base e evite pagar incentivos",
        engajamento: "Crie um plano formal de melhoria de desempenho e acompanhe regularmente. Avalie o valor para organização para determinar se permanece na função ou se será devolvido ao mercado.",
        atribuicoes: "Determine primeiro qual é o problema de desempenho. Se for o caso, passe o indivíduo para uma atribuição mais apropriada.",
        mentoria: "Designe um mentor com cargo superior que esteja com uma performance satisfatória para aumentar o desempenho imediato.",
        desenvolvimento: "O gestor direto deve acompanhar de perto, criando um plano específico para melhoria do desempenho."
      }
    },
    {
      id: 2,
      title: "Questionável",
      icon: UserCheck,
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
      bgLight: "bg-orange-50",
      textColor: "text-orange-700",
      hoverBg: "hover:bg-orange-200",
      performance: "baixo",
      potential: "médio",
      summary: "Potencial para melhorar o desempenho",
      description: "Tem algum potencial para fazer mais, porém, ainda não demonstrou plenamente. Pode ser novo no trabalho ou na empresa.",
      details: {
        recompensa: "Baixo ou nenhum aumento no salário e pagamento de incentivos. Ainda não há o que recompensar.",
        engajamento: "Trabalhe com o avaliando para estabelecer metas no desempenho passado bem-sucedido e futuras exigências. Foque em poucas metas importantes.",
        atribuicoes: "Encontre primeiro a causa do problema de desempenho. Discuta as habilidades e competências necessárias para desempenhar bem o papel.",
        mentoria: "Encoraje a pessoa procurar um mentor do mesmo nível (se possível indique alguém do Box 5) na área de especialização.",
        desenvolvimento: "O gestor direto deve fornecer mentoria para o desenvolvimento de habilidades técnicas, metas de carreira e adequação do trabalho."
      }
    },
    {
      id: 3,
      title: "Enigma",
      icon: Brain,
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-300",
      bgLight: "bg-yellow-50",
      textColor: "text-yellow-700",
      hoverBg: "hover:bg-yellow-200",
      performance: "baixo",
      potential: "alto",
      summary: "Iniciante ou com problema de gestão",
      description: "Mostra agilidade de aprendizagem muito alta e alto potencial. Não tem tido tempo ou oportunidade suficiente para demonstrar o que pode fazer.",
      details: {
        recompensa: "Baixo ou nenhum aumento no salário base e incentivos. É esperado passar para tratamento agressivo.",
        engajamento: "Promova tarefas funcionais ou interfuncionais importantes. Incentive a participação em projetos especiais.",
        atribuicoes: "Mantenha na atribuição atual, enquanto trabalha para melhorar o desempenho, a menos que esteja mal adequado ao trabalho.",
        mentoria: "Designe um mentor do Box 8 com a meta de aumentar o desempenho rapidamente.",
        desenvolvimento: "Avalie habilidades funcionais/técnicas para aumentar o desempenho. Designe um mentor interno."
      }
    },
    {
      id: 4,
      title: "Eficaz",
      icon: Shield,
      bgColor: "bg-blue-100",
      borderColor: "border-blue-300",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      hoverBg: "hover:bg-blue-200",
      performance: "médio",
      potential: "baixo",
      summary: "Especialista de alto valor",
      description: "Atua consistentemente e pode ocasionalmente exceder as expectativas. Conhece bem o trabalho atual. É sólido em território familiar.",
      details: {
        recompensa: "Pague o salário-base. Pagamento de incentivo somente por desempenho.",
        engajamento: "Designe atividades que os conhecimentos sejam valorizados. Exponha para pessoas de alto desempenho.",
        atribuicoes: "Proporcione oportunidades para participar de atividades de resolução de problemas. Desenvolva a especialização.",
        mentoria: "Encoraje a pessoa procurar um mentor de mesmo nível (se puder recomende alguém do Box 7).",
        desenvolvimento: "O gestor direto deve fornecer mentoria para desenvolvimento de habilidades técnicas."
      }
    },
    {
      id: 5,
      title: "Mantenedor",
      icon: Target,
      bgColor: "bg-teal-100",
      borderColor: "border-teal-300",
      bgLight: "bg-teal-50",
      textColor: "text-teal-700",
      hoverBg: "hover:bg-teal-200",
      performance: "médio",
      potential: "médio",
      summary: "Boa performance com espaço para crescimento",
      description: "Atende consistentemente e ocasionalmente excede as expectativas. Pode se adaptar a novas situações conforme necessário.",
      details: {
        recompensa: "Aumento moderado no salário. Objetivo pagar dentro da faixa de mercado.",
        engajamento: "Promova atividades relevantes, grupos de estudos e rede de contatos.",
        atribuicoes: "Proporcione oportunidades para atuarem como membros de um projeto com metas importantes.",
        mentoria: "Encoraje a pessoa a procurar um mentor (Box 8 para desenvolvimento vertical ou Box 6 para horizontal).",
        desenvolvimento: "O gestor direto deve fornecer mentoria para ajudar no desenvolvimento de habilidades técnicas."
      }
    },
    {
      id: 6,
      title: "Crescimento",
      icon: Rocket,
      bgColor: "bg-cyan-100",
      borderColor: "border-cyan-300",
      bgLight: "bg-cyan-50",
      textColor: "text-cyan-700",
      hoverBg: "hover:bg-cyan-200",
      performance: "médio",
      potential: "alto",
      summary: "Progressão para alto desempenho",
      description: "Atua consistentemente e algumas vezes excede as expectativas. Tem capacidade de assumir novos desafios em base consistente.",
      details: {
        recompensa: "Crescimento agressivo no salário-base e incentivos. Pagar acima do mercado, considere bonificações de retenção.",
        engajamento: "Designe-o para liderar em forças-tarefas interfuncionais. Arranje convites especiais para reuniões e eventos externos.",
        atribuicoes: "Mude-o entre uma série de trabalhos desafiadores a cada 12 a 24 meses.",
        mentoria: "Designe um mentor de nível sênior da alta gerência ou diretoria (Boxes 8 ou 9).",
        desenvolvimento: "Proporcione Coaching preferencialmente externo, para identificar e desenvolver habilidades."
      }
    },
    {
      id: 7,
      title: "Comprometimento",
      icon: Heart,
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-300",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      hoverBg: "hover:bg-emerald-200",
      performance: "alto",
      potential: "baixo",
      summary: "Especialista na função, difícil de ser substituído",
      description: "Produz consistentemente trabalhos excepcionais. Conhece o trabalho atual extremamente bem. Altamente valioso para a organização.",
      details: {
        recompensa: "Pode pagar o salário base na parte alta da faixa. Considere bonificações de retenção.",
        engajamento: "Designe para liderar força-tarefa funcional. Alavanque seus conhecimentos para atuarem como mentores.",
        atribuicoes: "Atribua projetos com mudanças mensuráveis no volume de trabalho.",
        mentoria: "Encoraje a procurar mentor de outra companhia (não concorrente). Designe-o como mentor para outras áreas.",
        desenvolvimento: "Proporcione um líder sênior interno dentro da função como coach."
      }
    },
    {
      id: 8,
      title: "Alto Impacto",
      icon: Zap,
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      bgLight: "bg-purple-50",
      textColor: "text-purple-700",
      hoverBg: "hover:bg-purple-200",
      performance: "alto",
      potential: "médio",
      summary: "Potencial para outro trabalho de mesmo nível",
      description: "Produz consistentemente resultados excepcionais. Pode se adaptar a novas situações e aprender novas áreas.",
      details: {
        recompensa: "Objetive pagar na parte alta da faixa de referência. Pagamentos agressivos em incentivos.",
        engajamento: "Designe-o para liderar em forças-tarefas funcionais ou interfuncionais importantes.",
        atribuicoes: "Gerenciamento de uma equipe de projetos interfuncionais. Atuação como consultor interno.",
        mentoria: "Designe mentor dos boxes 8 ou 9 em outra área funcional. Podem atuar como mentores dos boxes 5 ou 7.",
        desenvolvimento: "Forneça coaching interno ou externo para identificar ou desenvolver competências."
      }
    },
    {
      id: 9,
      title: "Futuro Líder",
      icon: Star,
      bgColor: "bg-gradient-to-br from-teal-100 to-cyan-100",
      borderColor: "border-teal-300",
      bgLight: "bg-gradient-to-br from-teal-50 to-cyan-50",
      textColor: "text-teal-700",
      hoverBg: "hover:from-teal-200 hover:to-cyan-200",
      performance: "alto",
      potential: "alto",
      summary: "Potencial além da função atual",
      description: "O melhor que existe. Atua bem em quase tudo que faz. Aprende rápido. Tem habilidade de assumir importantes atribuições.",
      details: {
        recompensa: "Agressivo na base e incentivos. Pagar acima do mercado. Use bonificação de ações voltadas à retenção.",
        engajamento: "Designe-o para liderar em forças-tarefas globais-chave. Arranje convites para reuniões externas.",
        atribuicoes: "Coloque-o em trabalhos desafiadores a cada 12/24 meses. Proporcione atribuições com alto risco.",
        mentoria: "Designe mentor de nível superior (boxes 6, 8 ou 9). Considere mentores de outras divisões.",
        desenvolvimento: "Proporcione Coaching de alto grau para avaliação contínua e desenvolvimento de habilidades críticas."
      }
    }
  ];

  const getBoxByPosition = (row: number, col: number) => {
    // Matriz correta: Alto potencial em cima, baixo embaixo
    const matrix = [
      [3, 6, 9], // Alto potencial
      [2, 5, 8], // Médio potencial
      [1, 4, 7]  // Baixo potencial
    ];
    return boxes.find(box => box.id === matrix[row][col]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-teal-500 mr-2 sm:mr-3" />
                  <span className="break-words">Guia Nine Box (9-Box)</span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                  Matriz de talentos para avaliação e desenvolvimento de colaboradores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Matrix Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Gem className="w-5 h-5 text-teal-500" />
            Matriz 9-Box
          </h2>
          
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-600">
              POTENCIAL →
            </div>
            
            {/* Matrix Grid */}
            <div className="inline-block">
              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-2 rounded-lg">
                {[0, 1, 2].map(row => (
                  <React.Fragment key={row}>
                    {[0, 1, 2].map(col => {
                      const box = getBoxByPosition(row, col);
                      if (!box) return null;
                      const Icon = box.icon;
                      
                      return (
                        <div
                          key={`${row}-${col}`}
                          onClick={() => setSelectedBox(box.id)}
                          onMouseEnter={() => setHoveredBox(box.id)}
                          onMouseLeave={() => setHoveredBox(null)}
                          className={`
                            relative cursor-pointer transition-all duration-200
                            ${box.bgColor} ${box.hoverBg} ${box.borderColor}
                            ${selectedBox === box.id ? 'ring-2 ring-teal-500 ring-offset-2' : ''}
                            border-2 rounded-lg p-4 w-28 h-28
                            flex flex-col items-center justify-center
                          `}
                        >
                          <Icon className={`w-5 h-5 ${box.textColor} mb-1`} />
                          <span className={`text-xs font-semibold ${box.textColor}`}>Box {box.id}</span>
                          <span className={`text-xs ${box.textColor} text-center mt-1`}>{box.title}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              
              {/* X-axis label */}
              <div className="text-center mt-2">
                <span className="text-xs font-medium text-gray-600">DESEMPENHO →</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Níveis de Desempenho:</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Baixo</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Médio</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Alto</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Níveis de Potencial:</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Baixo</span>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">Médio</span>
                <span className="px-2 py-1 bg-gray-300 text-gray-700 rounded">Alto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Box Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedBox ? (
            <>
              {(() => {
                const box = boxes.find(b => b.id === selectedBox);
                if (!box) return null;
                const Icon = box.icon;
                
                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${box.bgColor} ${box.borderColor} border-2 rounded-lg`}>
                          <Icon className={`w-6 h-6 ${box.textColor}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Box {box.id} - {box.title}</h3>
                          <p className="text-sm text-gray-600">{box.summary}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBox(null)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className={`${box.bgLight} ${box.borderColor} border rounded-lg p-4 mb-4`}>
                      <p className="text-sm text-gray-700">{box.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Recompensa:</h4>
                        <p className="text-sm text-gray-600">{box.details.recompensa}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Engajamento:</h4>
                        <p className="text-sm text-gray-600">{box.details.engajamento}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Info className="w-12 h-12 mb-3" />
              <p className="text-center">Selecione um box na matriz para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Information for Selected Box */}
      {selectedBox && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {(() => {
            const box = boxes.find(b => b.id === selectedBox);
            if (!box) return null;
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-800">Atribuições</h3>
                  </div>
                  <p className="text-sm text-gray-700">{box.details.atribuicoes}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-gray-800">Mentoria</h3>
                  </div>
                  <p className="text-sm text-gray-700">{box.details.mentoria}</p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    <h3 className="font-medium text-gray-800">Desenvolvimento</h3>
                  </div>
                  <p className="text-sm text-gray-700">{box.details.desenvolvimento}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-500" />
          Visão Geral dos Boxes
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desempenho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Potencial</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Característica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {boxes.map((box) => {
                const Icon = box.icon;
                return (
                  <tr 
                    key={box.id} 
                    onClick={() => setSelectedBox(box.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 ${box.bgColor} ${box.borderColor} border rounded`}>
                          <Icon className={`w-4 h-4 ${box.textColor}`} />
                        </div>
                        <span className="font-medium text-gray-800">{box.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-medium ${box.textColor}`}>{box.title}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${box.performance === 'alto' ? 'bg-green-100 text-green-700' : 
                          box.performance === 'médio' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}
                      `}>
                        {box.performance.charAt(0).toUpperCase() + box.performance.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${box.potential === 'alto' ? 'bg-green-100 text-green-700' : 
                          box.potential === 'médio' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}
                      `}>
                        {box.potential.charAt(0).toUpperCase() + box.potential.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{box.summary}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-500" />
          Análise Estratégica
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Alto Potencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-red-600">Baixo Desempenho:</span> Verificar causa e investir no desenvolvimento</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-yellow-600">Médio Desempenho:</span> Focar no curto prazo e avaliar oportunidades</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-green-600">Alto Desempenho:</span> Preparar para função maior - futuro líder!</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Médio Potencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-red-600">Baixo Desempenho:</span> Avaliar adequação à área</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-yellow-600">Médio Desempenho:</span> Investir para manter na função</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-green-600">Alto Desempenho:</span> Considerar promoção na área</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              Baixo Potencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-red-600">Baixo Desempenho:</span> Avaliar movimentação ou desligamento</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-yellow-600">Médio Desempenho:</span> Considerar movimentação horizontal</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm"><span className="font-medium text-green-600">Alto Desempenho:</span> Manter e revisar remuneração</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
)};

export default NineBoxGuide;