import { useState } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { Evaluation } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { FileDown, Filter } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const { evaluations, employees, getEmployeeById } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  
  // Filter completed evaluations
  const completedEvaluations = evaluations.filter(evaluation => evaluation.status === 'completed');
  
  // Filter by employee if selected
  const filteredEvaluations = selectedEmployeeId === 'all'
    ? completedEvaluations
    : completedEvaluations.filter(evaluation => evaluation.employeeId === selectedEmployeeId);
  
  // Calculate average scores for each criterion category
  const calculateAverages = (evals: Evaluation[]) => {
    if (evals.length === 0) return { technical: 0, behavioral: 0, deliveries: 0, overall: 0 };
    
    const sumTechnical = evals.reduce((sum, evaluation) => sum + evaluation.technicalScore, 0);
    const sumBehavioral = evals.reduce((sum, evaluation) => sum + evaluation.behavioralScore, 0);
    const sumDeliveries = evals.reduce((sum, evaluation) => sum + evaluation.deliveriesScore, 0);
    const sumOverall = evals.reduce((sum, evaluation) => sum + evaluation.finalScore, 0);
    
    return {
      technical: sumTechnical / evals.length,
      behavioral: sumBehavioral / evals.length,
      deliveries: sumDeliveries / evals.length,
      overall: sumOverall / evals.length,
    };
  };
  
  const averages = calculateAverages(filteredEvaluations);
  
  // Prepare data for bar chart
  const barChartData = {
    labels: ['Técnicas', 'Comportamentais', 'Entregas', 'Geral'],
    datasets: [
      {
        label: 'Média de Notas',
        data: [averages.technical, averages.behavioral, averages.deliveries, averages.overall],
        backgroundColor: ['rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(251, 146, 60, 0.6)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(139, 92, 246)', 'rgb(251, 146, 60)'],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for pie chart
  const pieChartData = {
    labels: ['Técnicas (40%)', 'Comportamentais (30%)', 'Entregas (30%)'],
    datasets: [
      {
        data: [40, 30, 30],
        backgroundColor: ['rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(139, 92, 246, 0.6)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(139, 92, 246)'],
        borderWidth: 1,
      },
    ],
  };
  
  // Export PDF (mock function)
  const exportPDF = () => {
    alert('PDF exportado com sucesso! (Funcionalidade simulada)');
  };
  
  // Export Excel (mock function)
  const exportExcel = () => {
    alert('Excel exportado com sucesso! (Funcionalidade simulada)');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        
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
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Visão Geral das Avaliações</h2>
          
          <div className="flex items-center">
            <Filter size={16} className="text-gray-500 mr-2" />
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="all">Todos os Colaboradores</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="p-4 bg-blue-50 rounded-lg border border-blue-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-medium text-blue-800">Técnicas</h3>
            <p className="text-2xl font-bold text-blue-600">{averages.technical.toFixed(1)}</p>
            <p className="text-xs text-blue-600">Média (Peso 40%)</p>
          </motion.div>
          
          <motion.div
            className="p-4 bg-green-50 rounded-lg border border-green-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-medium text-green-800">Comportamentais</h3>
            <p className="text-2xl font-bold text-green-600">{averages.behavioral.toFixed(1)}</p>
            <p className="text-xs text-green-600">Média (Peso 30%)</p>
          </motion.div>
          
          <motion.div
            className="p-4 bg-purple-50 rounded-lg border border-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-medium text-purple-800">Entregas</h3>
            <p className="text-2xl font-bold text-purple-600">{averages.deliveries.toFixed(1)}</p>
            <p className="text-xs text-purple-600">Média (Peso 30%)</p>
          </motion.div>
          
          <motion.div
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-medium text-gray-800">Nota Geral</h3>
            <p className="text-2xl font-bold text-gray-700">{averages.overall.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Média Ponderada</p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Média por Categoria</h3>
            <div className="h-64">
              <Bar 
                data={barChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 5,
                    },
                  },
                }}
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Distribuição de Pesos</h3>
            <div className="h-64">
              <Pie 
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-4">Detalhes das Avaliações</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnicas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comportamentais
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nota Final
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvaluations.map((evaluation) => {
                  const employee = getEmployeeById(evaluation.employeeId);
                  
                  return (
                    <tr key={evaluation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {employee?.position || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {evaluation.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {evaluation.technicalScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {evaluation.behavioralScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600">
                          {evaluation.deliveriesScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {evaluation.finalScore.toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredEvaluations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma avaliação concluída encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;