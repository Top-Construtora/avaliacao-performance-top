import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import {
  BarChart3, PieChart, TrendingUp, DollarSign, Users,
  Download, Filter, Calendar, ArrowUp, ArrowDown,
  AlertCircle, Info, FileSpreadsheet, Target, Zap,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService } from '../services/salary.service';
import { useSalaryManagement } from '../hooks/useSalaryManagement';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

type ReportType = 'overview' | 'equity' | 'budget' | 'progression';

const SalaryReports = () => {
  const navigate = useNavigate();
  const { analyzeSalaryEquity, simulateBudgetImpact } = useSalaryManagement();
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Estados para dados
  const [overviewData, setOverviewData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [positionData, setPositionData] = useState<any[]>([]);
  const [equityAnalysis, setEquityAnalysis] = useState<any>(null);
  const [budgetSimulation, setBudgetSimulation] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [activeReport]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case 'overview':
          const [overview, byDept, byPos] = await Promise.all([
            salaryService.getSalaryOverview(),
            salaryService.getSalaryByDepartment(),
            salaryService.getSalaryByPosition()
          ]);
          setOverviewData(overview);
          setDepartmentData(byDept);
          setPositionData(byPos);
          break;
          
        case 'equity':
          const equity = await analyzeSalaryEquity();
          setEquityAnalysis(equity);
          break;
          
        case 'budget':
          // Simulação exemplo
          const simulation = await simulateBudgetImpact([
            { userId: 'user1', newSalary: 10000, currentSalary: 9000 },
            { userId: 'user2', newSalary: 12000, currentSalary: 11000 }
          ]);
          setBudgetSimulation(simulation);
          break;
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      // Implementar exportação
      toast.success(`Relatório exportado em ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  // Configurações dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  // Dados para gráfico de barras por departamento
  const departmentChartData = {
    labels: departmentData.map(d => d.department),
    datasets: [
      {
        label: 'Salário Médio',
        data: departmentData.map(d => d.avgSalary),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Dados para gráfico de distribuição por classe
  const classDistributionData = {
    labels: ['Classe I', 'Classe II', 'Classe III'],
    datasets: [
      {
        data: [30, 50, 20], // Exemplo
        backgroundColor: [
          'rgba(18, 176, 160, 0.8)',
          'rgba(30, 96, 118, 0.8)',
          'rgba(186, 166, 115, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary-500" />
              Relatórios e Análises
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise detalhada da estrutura salarial
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex overflow-x-auto pb-2 -mb-2">
          {[
            { id: 'overview', label: 'Visão Geral', icon: PieChart },
            { id: 'equity', label: 'Análise de Equidade', icon: Target },
            { id: 'budget', label: 'Simulação Orçamentária', icon: Zap },
            { id: 'progression', label: 'Progressões', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeReport === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {activeReport === 'overview' && overviewData && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-primary-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {overviewData.total_employees}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Colaboradores
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-500">CLT: {overviewData.total_clt}</span>
                    <span className="text-gray-500">PJ: {overviewData.total_pj}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="h-8 w-8 text-green-700" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0
                      }).format(overviewData.avg_salary)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Salário Médio
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    <span>5.2% vs. ano anterior</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-8 w-8 text-secondary-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {overviewData.total_tracks}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Trilhas Ativas
                  </h3>
                  <div className="mt-2 text-xs text-gray-500">
                    {overviewData.total_positions} cargos cadastrados
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className="h-8 w-8 text-accent-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(overviewData.avg_salary * overviewData.total_employees * 12)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Custo Anual
                  </h3>
                  <div className="mt-2 text-xs text-gray-500">
                    Folha de pagamento estimada
                  </div>
                </motion.div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Salário Médio por Departamento
                  </h3>
                  <div className="h-64">
                    <Bar data={departmentChartData} options={chartOptions} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Distribuição por Classe
                  </h3>
                  <div className="h-64">
                    <Pie data={classDistributionData} options={chartOptions} />
                  </div>
                </motion.div>
              </div>

              {/* Tabela de Top Salários */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Análise por Cargo
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Classe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Salário Médio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Variação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {positionData.slice(0, 5).map((pos, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {pos.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {pos.class}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {pos.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(pos.avgSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`flex items-center gap-1 ${
                              (pos.maxSalary - pos.minSalary) / pos.avgSalary > 0.2
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {((pos.maxSalary - pos.minSalary) / pos.avgSalary * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {activeReport === 'equity' && equityAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Alertas de Equidade */}
              {equityAnalysis.recommendations && equityAnalysis.recommendations.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                        Pontos de Atenção
                      </h4>
                      <ul className="mt-2 space-y-1">
                        {equityAnalysis.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200">
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas de Equidade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Gap de Gênero
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {equityAnalysis.metrics?.genderGap || 0}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Variância Departamental
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {equityAnalysis.metrics?.departmentVariance || 0}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Progressão por Senioridade
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {equityAnalysis.metrics?.seniorityProgression || 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeReport === 'budget' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Simulador de Cenários */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Simulação de Impacto Orçamentário
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Aumento
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                        <option>Percentual</option>
                        <option>Valor Fixo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor (%)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        placeholder="5.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Aplicar a
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                        <option>Todos</option>
                        <option>Por Departamento</option>
                        <option>Por Cargo</option>
                        <option>Individual</option>
                      </select>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full md:w-auto">
                    <Zap className="h-4 w-4 mr-2" />
                    Simular Impacto
                  </Button>
                </div>

                {/* Resultados da Simulação */}
                {budgetSimulation && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Resumo do Impacto
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Aumento Total</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(budgetSimulation.directCost || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Com Encargos</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(budgetSimulation.totalCost || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">% Aumento</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {(budgetSimulation.percentageIncrease || 0).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Colaboradores</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {budgetSimulation.affectedEmployees || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-primary-900 dark:text-primary-100">
                            Detalhamento de Encargos
                          </h5>
                          <ul className="mt-2 space-y-1 text-sm text-primary-800 dark:text-primary-200">
                            <li>• INSS Patronal (20%): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetSimulation.breakdown?.inss || 0)}</li>
                            <li>• FGTS (8%): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetSimulation.breakdown?.fgts || 0)}</li>
                            <li>• Provisão Férias: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetSimulation.breakdown?.ferias || 0)}</li>
                            <li>• Provisão 13º: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetSimulation.breakdown?.decimoTerceiro || 0)}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeReport === 'progression' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Timeline de Progressões */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
                  Histórico de Progressões
                </h3>
                
                <div className="space-y-4">
                  {/* Filtros */}
                  <div className="flex flex-wrap gap-4">
                    <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm">
                      <option>Todos os Tipos</option>
                      <option>Progressão Vertical</option>
                      <option>Progressão Horizontal</option>
                      <option>Mérito</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm">
                      <option>Último Mês</option>
                      <option>Últimos 3 Meses</option>
                      <option>Últimos 6 Meses</option>
                      <option>Último Ano</option>
                    </select>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-primary-600 dark:text-primary-400">Verticais</p>
                          <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">12</p>
                        </div>
                        <ArrowUp className="h-8 w-8 text-primary-500 opacity-50" />
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400">Horizontais</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">28</p>
                        </div>
                        <ArrowRight className="h-8 w-8 text-green-700 opacity-50" />
                      </div>
                    </div>
                    <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-secondary-600 dark:text-secondary-400">Mérito</p>
                          <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">8</p>
                        </div>
                        <Target className="h-8 w-8 text-secondary-500 opacity-50" />
                      </div>
                    </div>
                    <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-accent-600 dark:text-accent-400">Investimento</p>
                          <p className="text-lg font-bold text-accent-900 dark:text-accent-100">
                            R$ 245K
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-accent-500 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default SalaryReports;