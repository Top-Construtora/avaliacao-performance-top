import { useState } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { FileDown, User, Users, Target, AlertTriangle } from 'lucide-react';

const Reports = () => {
  
  // Mock data to simulate the report shown in the image
  const mockReportData = [
    { id: '1', name: 'João Silva', selfEvaluation: 'Completo', leaderEvaluation: 'Completo', consensus: 'Completo', actionPlan: 'Definido', status: 100 },
    { id: '2', name: 'Maria Santos', selfEvaluation: 'Completo', leaderEvaluation: 'Completo', consensus: 'Em Andamento', actionPlan: 'Aguardando', status: 75 },
    { id: '3', name: 'Pedro Oliveira', selfEvaluation: 'Completo', leaderEvaluation: 'Pendente', consensus: 'Em Andamento', actionPlan: 'Aguardando', status: 25 },
    { id: '4', name: 'Ana Costa', selfEvaluation: 'Pendente', leaderEvaluation: 'Pendente', consensus: 'Em Andamento', actionPlan: 'Aguardando', status: 25 },
  ];

  const reportSummary = {
    totalCollaborators: 25,
    completedSelfEvaluations: 18,
    completedLeaderEvaluations: 15,
    completedConsensus: 12,
    pendingActions: 7
  };

  // Export functions
  const exportPDF = () => {
    alert('PDF exportado com sucesso! (Funcionalidade simulada)');
  };
  
  const exportExcel = () => {
    alert('Excel exportado com sucesso! (Funcionalidade simulada)');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completo':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completo</span>;
      case 'Em Andamento':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Em Andamento</span>;
      case 'Pendente':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pendente</span>;
      case 'Definido':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">Definido</span>;
      case 'Aguardando':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">Aguardando</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios Gerais</h1>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportPDF}
            icon={<FileDown size={16} />}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportExcel}
            icon={<FileDown size={16} />}
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-500 text-white">
              <User size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Colaboradores</p>
              <p className="text-3xl font-bold text-primary-600">{reportSummary.totalCollaborators}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white">
              <User size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Autoavaliações</p>
              <p className="text-3xl font-bold text-green-600">{reportSummary.completedSelfEvaluations}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reportSummary.completedSelfEvaluations / reportSummary.totalCollaborators) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avaliações Líder</p>
              <p className="text-3xl font-bold text-purple-600">{reportSummary.completedLeaderEvaluations}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reportSummary.completedLeaderEvaluations / reportSummary.totalCollaborators) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-500 text-white">
              <Target size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Consensos</p>
              <p className="text-3xl font-bold text-accent-600">{reportSummary.completedConsensus}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reportSummary.completedConsensus / reportSummary.totalCollaborators) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-500 text-white">
              <AlertTriangle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ações Pendentes</p>
              <p className="text-3xl font-bold text-red-600">{reportSummary.pendingActions}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Report Table */}
      <motion.div
        className="bg-white rounded-lg shadow overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Status Detalhado por Colaborador</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autoavaliação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avaliação Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consenso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano de Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockReportData.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.selfEvaluation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.leaderEvaluation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.consensus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.actionPlan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 flex-1 mr-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(employee.status)}`}
                          style={{ width: `${employee.status}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{employee.status}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;