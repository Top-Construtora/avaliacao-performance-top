import { useState } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import { 
 FileDown, 
 Users, 
 Target, 
 AlertTriangle,
 CheckCircle,
 Clock,
 Calendar,
 Search,
 Download,
 Printer,
 Share2,
 Award,
 Filter,
 ChevronUp,
 BarChart3,
 FileText,
 Briefcase
} from 'lucide-react';

const Reports = () => {
 const [activeTab, setActiveTab] = useState('overview');
 const [searchTerm, setSearchTerm] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [selectedDepartment, setSelectedDepartment] = useState('');
 const [selectedStatus, setSelectedStatus] = useState('');
 
 // Mock data
 const mockReportData = [
   { 
     id: '1', 
     name: 'João Silva', 
     department: 'Engineering',
     position: 'Tech Lead',
     selfEvaluation: 'Completo', 
     leaderEvaluation: 'Completo', 
     consensus: 'Completo', 
     pdi: 'Definido', 
     finalScore: 3.8
   },
   { 
     id: '2', 
     name: 'Maria Santos', 
     department: 'Design',
     position: 'UX Designer',
     selfEvaluation: 'Completo', 
     leaderEvaluation: 'Completo', 
     consensus: 'Em Andamento', 
     pdi: 'Aguardando', 
     finalScore: 3.2
   },
   { 
     id: '3', 
     name: 'Pedro Oliveira', 
     department: 'Project Management',
     position: 'Project Manager',
     selfEvaluation: 'Completo', 
     leaderEvaluation: 'Pendente', 
     consensus: 'Aguardando', 
     pdi: 'Aguardando', 
     finalScore: 2.8
   },
   { 
     id: '4', 
     name: 'Ana Costa', 
     department: 'Engineering',
     position: 'Software Developer',
     selfEvaluation: 'Pendente', 
     leaderEvaluation: 'Pendente', 
     consensus: 'Aguardando', 
     pdi: 'Aguardando', 
     finalScore: 0
   },
   { 
     id: '5', 
     name: 'Carlos Mendes', 
     department: 'People & Management',
     position: 'HR Specialist',
     selfEvaluation: 'Completo', 
     leaderEvaluation: 'Completo', 
     consensus: 'Completo', 
     pdi: 'Em Andamento', 
     finalScore: 3.5
   },
 ];

 const reportSummary = {
   totalCollaborators: 25,
   completedEvaluations: 12,
   inProgress: 8,
   pending: 5
 };

 // Department data
 const departmentData = [
   { name: 'Engineering', completed: 8, pending: 2, inProgress: 3 },
   { name: 'Design', completed: 5, pending: 1, inProgress: 2 },
   { name: 'Project Management', completed: 3, pending: 2, inProgress: 1 },
   { name: 'People & Management', completed: 2, pending: 2, inProgress: 3 }
 ];

 // Cálculo de progresso
 const progressPercentage = (reportSummary.completedEvaluations / reportSummary.totalCollaborators) * 100;

 // Export functions
 const exportPDF = () => {
   toast.success('Relatório PDF gerado com sucesso!');
 };
 
 const exportExcel = () => {
   toast.success('Relatório Excel gerado com sucesso!');
 };

 const printReport = () => {
   window.print();
   toast.success('Preparando impressão...');
 };

 const shareReport = () => {
   navigator.clipboard.writeText(window.location.href);
   toast.success('Link do relatório copiado!');
 };

 const getStatusBadge = (status: string) => {
   const statusConfig = {
     'Completo': { 
       bgColor: 'bg-primary-100',
       textColor: 'text-primary-700',
       borderColor: 'border-primary-200',
       icon: CheckCircle 
     },
     'Em Andamento': { 
       bgColor: 'bg-secondary-100',
       textColor: 'text-secondary-700',
       borderColor: 'border-secondary-200',
       icon: Clock 
     },
     'Pendente': { 
       bgColor: 'bg-gray-100',
       textColor: 'text-gray-700',
       borderColor: 'border-gray-300',
       icon: AlertTriangle 
     },
     'Definido': { 
       bgColor: 'bg-accent-100',
       textColor: 'text-accent-700',
       borderColor: 'border-accent-200',
       icon: Target 
     },
     'Aguardando': { 
       bgColor: 'bg-gray-50',
       textColor: 'text-gray-600',
       borderColor: 'border-gray-200',
       icon: Clock 
     }
   };

   const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente'];
   const Icon = config.icon;

   return (
     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
       <Icon size={12} className="mr-1" />
       {status}
     </span>
   );
 };

 const getScoreBadge = (score: number) => {
   if (score === 0) {
     return (
       <span className="text-sm text-gray-400">-</span>
     );
   }

   const getScoreColor = () => {
     if (score >= 3.5) return 'text-primary-600';
     if (score >= 2.5) return 'text-secondary-600';
     return 'text-red-600';
   };

   const getScoreBackground = () => {
     if (score >= 3.5) return 'from-primary-500 to-primary-600';
     if (score >= 2.5) return 'from-secondary-500 to-secondary-600';
     return 'from-red-500 to-red-600';
   };

   return (
     <div className="flex items-center space-x-2">
       <span className={`text-2xl font-bold ${getScoreColor()}`}>
         {score.toFixed(1)}
       </span>
       <div className="w-16 bg-gray-200 rounded-full h-2">
         <div 
           className={`h-2 rounded-full bg-gradient-to-r ${getScoreBackground()} transition-all duration-500`}
           style={{ width: `${(score / 4) * 100}%` }}
         />
       </div>
     </div>
   );
 };

 // Filtros
 const filteredData = mockReportData.filter(employee => {
   const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.position.toLowerCase().includes(searchTerm.toLowerCase());
   
   const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
   const matchesStatus = !selectedStatus || 
                        employee.selfEvaluation === selectedStatus || 
                        employee.leaderEvaluation === selectedStatus ||
                        employee.consensus === selectedStatus;

   return matchesSearch && matchesDepartment && matchesStatus;
 });

 const tabs = [
   { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
   { id: 'detailed', label: 'Detalhado', icon: FileText }
 ];

 return (
   <div className="space-y-6">
     {/* Header */}
     <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
     >
       <div className="flex justify-between items-start mb-6">
         <div>
           <h1 className="text-3xl font-bold text-gray-800 flex items-center">
             <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
               <Award className="h-6 w-6 text-white" />
             </div>
             Central de Relatórios
           </h1>
           <p className="text-gray-600 mt-1">Acompanhe o progresso das avaliações de desempenho</p>
         </div>
         
         <div className="flex items-center space-x-3">
           <button
             onClick={printReport}
             className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
             title="Imprimir"
           >
             <Printer size={18} />
           </button>
           <button
             onClick={shareReport}
             className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
             title="Compartilhar"
           >
             <Share2 size={18} />
           </button>
           <Button
             variant="outline"
             onClick={exportPDF}
             icon={<FileDown size={16} />}
             size="sm"
           >
             PDF
           </Button>
           <Button
             variant="primary"
             onClick={exportExcel}
             icon={<Download size={16} />}
             size="sm"
           >
             Excel
           </Button>
         </div>
       </div>

       {/* Progress Overview */}
       <div className="bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 rounded-xl p-4 border border-primary-100">
         <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <Calendar className="h-5 w-5 text-primary-600" />
             <span className="font-medium text-gray-700">Ciclo de Avaliação 2024</span>
           </div>
           <div className="flex items-center space-x-6">
             <div className="text-right">
               <p className="text-sm text-gray-600">Progresso Geral</p>
               <p className="text-2xl font-bold text-primary-600">{Math.round(progressPercentage)}%</p>
             </div>
             <div className="w-32 bg-gray-200 rounded-full h-3">
               <div 
                 className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                 style={{ width: `${progressPercentage}%` }}
               />
             </div>
           </div>
         </div>
       </div>

       {/* Tabs */}
       <div className="flex space-x-1 border-b border-gray-200 mt-6 -mb-8">
         {tabs.map((tab) => {
           const Icon = tab.icon;
           return (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                 activeTab === tab.id
                   ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
               }`}
             >
               <Icon size={18} />
               <span className="font-medium">{tab.label}</span>
             </button>
           );
         })}
       </div>
     </motion.div>

     {/* Overview Tab */}
     {activeTab === 'overview' && (
       <>
         {/* KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <motion.div
             className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
           >
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                 <Users size={24} />
               </div>
               <ChevronUp className="h-5 w-5" />
             </div>
             <p className="text-3xl font-bold mb-1">{reportSummary.totalCollaborators}</p>
             <p className="text-primary-100 text-sm">Total de Colaboradores</p>
           </motion.div>

           <motion.div
             className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl shadow-lg p-6 text-white"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
           >
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                 <CheckCircle size={24} />
               </div>
               <span className="text-xs bg-white/20 px-2 py-1 rounded-full">48%</span>
             </div>
             <p className="text-3xl font-bold mb-1">{reportSummary.completedEvaluations}</p>
             <p className="text-secondary-100 text-sm">Avaliações Completas</p>
           </motion.div>

           <motion.div
             className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl shadow-lg p-6 text-white"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
           >
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                 <Clock size={24} />
               </div>
               <span className="text-xs bg-white/20 px-2 py-1 rounded-full">32%</span>
             </div>
             <p className="text-3xl font-bold mb-1">{reportSummary.inProgress}</p>
             <p className="text-accent-100 text-sm">Em Andamento</p>
           </motion.div>

           <motion.div
             className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
           >
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-red-50 rounded-xl">
                 <AlertTriangle size={24} className="text-red-600" />
               </div>
               <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">20%</span>
             </div>
             <p className="text-3xl font-bold text-gray-800 mb-1">{reportSummary.pending}</p>
             <p className="text-gray-600 text-sm">Pendentes</p>
           </motion.div>
         </div>

         {/* Department Overview */}
         <motion.div
           className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
         >
           <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
             <Briefcase className="h-6 w-6 mr-2 text-primary-600" />
             Progresso por Departamento
           </h2>
           <div className="space-y-4">
             {departmentData.map((dept, index) => (
               <div key={index} className="bg-gray-50 rounded-xl p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                   <div className="flex items-center space-x-4 text-sm">
                     <span className="flex items-center text-primary-600">
                       <CheckCircle className="h-4 w-4 mr-1" />
                       {dept.completed} completos
                     </span>
                     <span className="flex items-center text-secondary-600">
                       <Clock className="h-4 w-4 mr-1" />
                       {dept.inProgress} em andamento
                     </span>
                     <span className="flex items-center text-gray-600">
                       <AlertTriangle className="h-4 w-4 mr-1" />
                       {dept.pending} pendentes
                     </span>
                   </div>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                   <div className="h-full flex">
                     <div 
                       className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-500"
                       style={{ width: `${(dept.completed / (dept.completed + dept.inProgress + dept.pending)) * 100}%` }}
                     />
                     <div 
                       className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-full transition-all duration-500"
                       style={{ width: `${(dept.inProgress / (dept.completed + dept.inProgress + dept.pending)) * 100}%` }}
                     />
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </motion.div>
       </>
     )}

     {/* Detailed Tab */}
     {activeTab === 'detailed' && (
       <motion.div
         className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
       >
         {/* Search and Filters */}
         <div className="p-6 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4 flex-1">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Buscar por nome, cargo ou departamento..."
                   className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <button
                 onClick={() => setShowFilters(!showFilters)}
                 className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                   showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 <Filter size={18} />
                 <span>Filtros</span>
               </button>
             </div>
             <div className="text-sm text-gray-600">
               {filteredData.length} de {mockReportData.length} colaboradores
             </div>
           </div>

           <AnimatePresence>
             {showFilters && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="mt-4 pt-4 border-t border-gray-200"
               >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <select 
                     className="rounded-lg border-gray-200 text-sm"
                     value={selectedDepartment}
                     onChange={(e) => setSelectedDepartment(e.target.value)}
                   >
                     <option value="">Todos os departamentos</option>
                     <option value="Engineering">Engineering</option>
                     <option value="Design">Design</option>
                     <option value="Project Management">Project Management</option>
                     <option value="People & Management">People & Management</option>
                   </select>
                   <select 
                     className="rounded-lg border-gray-200 text-sm"
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                   >
                     <option value="">Todos os status</option>
                     <option value="Completo">Completo</option>
                     <option value="Em Andamento">Em Andamento</option>
                     <option value="Pendente">Pendente</option>
                     <option value="Aguardando">Aguardando</option>
                   </select>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
         </div>

         {/* Table */}
         <div className="overflow-x-auto">
           <table className="min-w-full">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Colaborador
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Autoavaliação
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Avaliação Líder
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Consenso
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   PDI
                 </th>
                 <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Nota Geral
                 </th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {filteredData.map((employee, index) => (
                 <motion.tr 
                   key={employee.id} 
                   className="hover:bg-gray-50 transition-colors duration-150"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: index * 0.05 }}
                 >
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                       <div className="h-10 w-10 flex-shrink-0">
                         <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center text-white font-semibold">
                           {employee.name.split(' ').map(n => n[0]).join('')}
                         </div>
                       </div>
                       <div className="ml-4">
                         <div className="text-sm font-medium text-gray-900">
                           {employee.name}
                         </div>
                         <div className="text-xs text-gray-500">
                           {employee.position} • {employee.department}
                         </div>
                       </div>
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
                     {getStatusBadge(employee.pdi)}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-center">
                     {getScoreBadge(employee.finalScore)}
                   </td>
                 </motion.tr>
               ))}
             </tbody>
           </table>
         </div>
       </motion.div>
     )}
   </div>
 );
};

export default Reports;