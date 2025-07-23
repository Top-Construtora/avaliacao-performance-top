import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import { 
  Building, Edit, Trash2, Search, Filter,
  MoreVertical, Copy, Download, Upload,
  UserCog, FileText, Plus,
  Grid3x3, List, FileSpreadsheet, FileDown,
  Loader2, Database, UsersIcon, UserRound, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import type { DepartmentWithDetails } from '../../types/supabase';
import { usePermissions, useUIPermissions, useOperationValidator } from '../../hooks/usePermissions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PermissionGuard, ActionGuard, UIGuard, OperationWarning } from '../../components/PermissionGuard';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ViewMode = 'grid' | 'list';
type ExportFormat = 'excel' | 'notion' | 'pdf';

const DepartmentManagement = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const uiPermissions = useUIPermissions();
  const operationValidator = useOperationValidator();
  
  const { departments, loading, actions } = useSupabaseData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'teams' | 'date'>('name');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: string;
    data: any;
    callback: () => void;
  } | null>(null);

  const handleEdit = (department: DepartmentWithDetails) => {
    if (!permissions.canEditDepartment()) {
      toast.error('Você não tem permissão para editar departamentos');
      return;
    }
    navigate(`/departments/edit/${department.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!permissions.hasPermission('departments', 'delete')) {
      toast.error('Você não tem permissão para esta ação');
      return;
    }

    const targetData = departments.find(d => d.id === id);

    if (!operationValidator.canExecute('delete_department', targetData)) {
      const errors = operationValidator.getValidationErrors('delete_department', targetData);
      toast.error(errors[0] || 'Operação não permitida');
      return;
    }

    const warnings = operationValidator.getValidationWarnings('delete_department', targetData);
    if (warnings.length > 0) {
      setPendingOperation({
        type: 'delete_department',
        data: targetData,
        callback: async () => {
          try {
            await actions.departments.delete(id);
            toast.success('Departamento removido com sucesso!');
          } catch (error) {
            toast.error('Erro ao remover departamento');
          }
        }
      });
      setShowWarning(true);
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este departamento?')) {
      try {
        await actions.departments.delete(id);
        toast.success('Departamento removido com sucesso!');
      } catch (error) {
        toast.error('Erro ao remover departamento');
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'import':
        toast.success('Funcionalidade de importação em desenvolvimento');
        break;
      case 'export':
        setShowExportMenu(true);
        break;
      case 'bulk':
        if (!permissions.hasPermission('departments', 'delete')) {
          toast.error('Você não tem permissão para ações em massa');
          return;
        }
        toast.success('Ações em massa em desenvolvimento');
        break;
    }
  };

  const exportToExcel = () => {
    const data = filteredDepartments.map(dept => ({
      Nome: dept.name,
      Descrição: dept.description || '-',
      Responsável: dept.responsible?.name || '-',
      'Qtd. Times': dept.teams?.length || 0,
      'Qtd. Pessoas': dept.member_count || 0,
      'Criado em': new Date(dept.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Departamentos');
    XLSX.writeFile(wb, 'departamentos.xlsx');
    toast.success('Dados exportados para Excel!');
  };

  const exportToNotion = () => {
    let markdownContent = `# Lista de Departamentos\n\n`;
    markdownContent += `| Nome | Descrição | Responsável | Times | Pessoas |\n`;
    markdownContent += `|------|-----------|-------------|-------|----------|\n`;
    
    filteredDepartments.forEach(dept => {
      const responsible = dept.responsible?.name || '-';
      const teamCount = dept.teams?.length || 0;
      const userCount = dept.member_count || 0;
      
      markdownContent += `| ${dept.name} | ${dept.description || '-'} | ${responsible} | ${teamCount} | ${userCount} |\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'departamentos_notion.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados em formato Notion!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = 'Lista de Departamentos';
    const headers = ['Nome', 'Responsável', 'Times', 'Pessoas'];
    const data = filteredDepartments.map(dept => [
      dept.name,
      dept.responsible?.name || '-',
      (dept.teams?.length || 0).toString(),
      (dept.member_count || 0).toString()
    ]);

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [18, 176, 160] }
    });

    doc.save('departamentos.pdf');
    toast.success('PDF gerado com sucesso!');
  };

  const handleExport = (format: ExportFormat) => {
    if (!uiPermissions.showExportButton) {
      toast.error('Você não tem permissão para exportar dados');
      return;
    }
    
    switch (format) {
      case 'excel':
        exportToExcel();
        break;
      case 'notion':
        exportToNotion();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
    setShowExportMenu(false);
  };

  const filteredDepartments = useMemo(() => {
    return departments
      .filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'teams':
            return (b.teams?.length || 0) - (a.teams?.length || 0);
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
  }, [departments, searchTerm, sortBy]);

  const stats = useMemo(() => ({
    totalDepartments: departments.length,
    totalTeams: departments.reduce((acc, dept) => acc + (dept.teams?.length || 0), 0),
    totalMembers: departments.reduce((acc, dept) => acc + (dept.member_count || 0), 0),
    avgTeamsPerDept: departments.length > 0 ? Math.round(departments.reduce((acc, dept) => acc + (dept.teams?.length || 0), 0) / departments.length) : 0
  }), [departments]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  const renderDepartmentCard = (department: DepartmentWithDetails) => {
    const deptTeams = department.teams || [];
    const deptUsers = department.member_count || 0;
    const responsible = department.responsible;
    
    return (
      <motion.div
        layout
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 group"
      >
        <div className="h-2 bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700" />
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 shadow-md dark:shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{department.name}</h3>
              {department.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{department.description}</p>
              )}
            </div>
            
            <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
              <ActionGuard can={permissions.canEditDepartment}>
                <button
                  onClick={() => handleEdit(department)}
                  className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>
              
              <ActionGuard can={permissions.canDeleteDepartment}>
                <button
                  onClick={() => handleDelete(department.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            {responsible && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <UserCog className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                <span>Responsável: <span className="font-medium truncate">{responsible.name}</span></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{deptTeams.length} {deptTeams.length === 1 ? 'time' : 'times'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UserRound className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{deptUsers} {deptUsers === 1 ? 'pessoa' : 'pessoas'}</span>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
              <span>Criado em {new Date(department.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard resource="departments" action="read">
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <Database className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3 flex-shrink-0" />
                  Gerenciamento de Departamentos
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Visualize e gerencie departamentos da organização
                </p>
              </div>
            </div>

            <UIGuard show="showCreateDepartmentButton">
              <Button
                variant="primary"
                onClick={() => navigate('/register/department')}
                icon={<Plus size={18} />}
                size="lg"
              >
                Novo Departamento
              </Button>
            </UIGuard>
          </div>

          <motion.div 
            className="grid grid-cols-3 sm:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 dark:from-accent-600 dark:via-accent-700 dark:to-accent-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalDepartments}</p>
                <p className="text-sm text-accent-100 font-medium">Departamentos</p>
              </div>
              <Building className="absolute -bottom-2 -right-2 h-16 w-16 text-accent-400 dark:text-accent-500 opacity-50" />
            </motion.div>
            
            <motion.div 
              variants={itemVariants} 
              className="relative overflow-hidden rounded-xl p-4 text-center shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #247B7B, #1B5B5B)' }}
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                <p className="text-sm text-teal-100 font-medium">Times Total</p>
              </div>
              <UsersIcon className="absolute -bottom-2 -right-2 h-16 w-16 text-teal-300 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 dark:from-secondary-600 dark:via-secondary-700 dark:to-secondary-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
                <p className="text-sm text-secondary-100 font-medium">Pessoas Total</p>
              </div>
              <UserRound className="absolute -bottom-2 -right-2 h-16 w-16 text-secondary-400 dark:text-secondary-500 opacity-50" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-1.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm dark:shadow-lg'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Visualização em grade"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm dark:shadow-lg'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Visualização em lista"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters 
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>

              <div className="relative group">
                <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleQuickAction('import')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span>Importar dados</span>
                  </button>
                  <UIGuard show="showExportButton">
                    <button
                      onClick={() => handleQuickAction('export')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Exportar lista</span>
                    </button>
                  </UIGuard>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
                  <UIGuard show="showBulkActionsButton">
                    <button
                      onClick={() => handleQuickAction('bulk')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Ações em massa</span>
                    </button>
                  </UIGuard>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-gray-50/50 dark:bg-gray-700/50 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="name">Nome</option>
                        <option value="teams">Quantidade de times</option>
                        <option value="date">Data de criação</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="departments"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
              >
                {filteredDepartments.map(dept => (
                  <div key={dept.id}>
                    {renderDepartmentCard(dept)}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {filteredDepartments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
                <Building className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum departamento encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Crie o primeiro departamento da organização</p>
              <UIGuard show="showCreateDepartmentButton">
                <Button
                  variant="primary"
                  onClick={() => navigate('/register/departments')}
                  icon={<Plus size={18} />}
                >
                  Criar Departamento
                </Button>
              </UIGuard>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showExportMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
              onClick={() => setShowExportMenu(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl dark:shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Exportar Dados
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 rounded-xl border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Excel</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Arquivo .xlsx para análises</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('notion')}
                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600/30 dark:hover:to-gray-500/30 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Notion</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Markdown para importar</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 rounded-xl border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileDown className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">PDF</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Documento para impressão</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportMenu(false)}
                  className="w-full mt-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showWarning && pendingOperation && (
          <OperationWarning
            operation={pendingOperation.type}
            targetData={pendingOperation.data}
            onConfirm={() => {
              pendingOperation.callback();
              setShowWarning(false);
              setPendingOperation(null);
            }}
            onCancel={() => {
              setShowWarning(false);
              setPendingOperation(null);
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default DepartmentManagement;