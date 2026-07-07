import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import {
  Building,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Download,
  Upload,
  UserCog,
  FileText,
  Plus,
  Grid3x3,
  List,
  FileSpreadsheet,
  FileDown,
  Database,
  UsersIcon,
  UserRound,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { sanitizeSheetData } from '../../utils/exportSafety';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import type { DepartmentWithDetails } from '../../types/supabase';
import {
  usePermissions,
  useUIPermissions,
  useOperationValidator,
} from '../../hooks/usePermissions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PermissionGuard,
  ActionGuard,
  UIGuard,
  OperationWarning,
} from '../../components/PermissionGuard';
import LoadingSpinner from '../../components/LoadingSpinner';

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

    const targetData = departments.find((d) => d.id === id);

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
        },
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
    const data = filteredDepartments.map((dept) => ({
      Nome: dept.name,
      Descrição: dept.description || '-',
      Responsável: dept.responsible?.name || '-',
      'Qtd. Times': dept.teams?.length || 0,
      'Qtd. Pessoas': dept.member_count || 0,
      'Criado em': new Date(dept.created_at).toLocaleDateString('pt-BR'),
    }));

    const ws = XLSX.utils.json_to_sheet(sanitizeSheetData(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Departamentos');
    XLSX.writeFile(wb, 'departamentos.xlsx');
    toast.success('Dados exportados para Excel!');
  };

  const exportToNotion = () => {
    let markdownContent = `# Lista de Departamentos\n\n`;
    markdownContent += `| Nome | Descrição | Responsável | Times | Pessoas |\n`;
    markdownContent += `|------|-----------|-------------|-------|----------|\n`;

    filteredDepartments.forEach((dept) => {
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
    const data = filteredDepartments.map((dept) => [
      dept.name,
      dept.responsible?.name || '-',
      (dept.teams?.length || 0).toString(),
      (dept.member_count || 0).toString(),
    ]);

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [61, 67, 79] },
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
      .filter(
        (dept) =>
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())),
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

  const stats = useMemo(
    () => ({
      totalDepartments: departments.length,
      totalTeams: departments.reduce((acc, dept) => acc + (dept.teams?.length || 0), 0),
      totalMembers: departments.reduce((acc, dept) => acc + (dept.member_count || 0), 0),
      avgTeamsPerDept:
        departments.length > 0
          ? Math.round(
              departments.reduce((acc, dept) => acc + (dept.teams?.length || 0), 0) /
                departments.length,
            )
          : 0,
    }),
    [departments],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
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
        className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border overflow-hidden dark:hover:shadow-xl hover:border-lime transition-all duration-300 group"
      >
        <div className="h-1 bg-lime" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="p-3 rounded-2xl bg-secondary text-foreground group-hover:bg-lime group-hover:text-obsidian shadow-md dark:shadow-lg transition-colors">
                <Building className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-lg truncate">{department.name}</h3>
              {department.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {department.description}
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
              <ActionGuard can={permissions.canEditDepartment}>
                <button
                  onClick={() => handleEdit(department)}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-accent text-muted-foreground hover:text-foreground hover:shadow-sm"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>

              <ActionGuard can={permissions.canDeleteDepartment}>
                <button
                  onClick={() => handleDelete(department.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            {responsible && (
              <div className="flex items-center text-sm text-muted-foreground group/item hover:text-foreground transition-colors">
                <UserCog className="h-4 w-4 mr-3 text-muted-foreground group-hover/item:text-foreground" />
                <span>
                  Responsável: <span className="font-medium truncate">{responsible.name}</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">
                  {deptTeams.length} {deptTeams.length === 1 ? 'time' : 'times'}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">
                  {deptUsers} {deptUsers === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
              <span>Criado em {new Date(department.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PermissionGuard resource="departments" action="read">
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                  <Database className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
                  Gerenciamento de Departamentos
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg"
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-foreground">{stats.totalDepartments}</p>
                <p className="text-sm text-muted-foreground font-medium">Departamentos</p>
              </div>
              <Building className="absolute -bottom-2 -right-2 h-16 w-16 text-lime/10" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg"
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-foreground">{stats.totalTeams}</p>
                <p className="text-sm text-muted-foreground font-medium">Times Total</p>
              </div>
              <UsersIcon className="absolute -bottom-2 -right-2 h-16 w-16 text-lime/10" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg"
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
                <p className="text-sm text-muted-foreground font-medium">Pessoas Total</p>
              </div>
              <UserRound className="absolute -bottom-2 -right-2 h-16 w-16 text-lime/10" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-secondary backdrop-blur-sm rounded-xl p-1.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização em grade"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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
                    ? 'bg-accent text-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>

              <div className="relative group">
                <button className="p-2.5 rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <MoreVertical className="h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-xl shadow-xl dark:shadow-2xl border border-border py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleQuickAction('import')}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground font-medium hover:bg-accent flex items-center space-x-3 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span>Importar dados</span>
                  </button>
                  <UIGuard show="showExportButton">
                    <button
                      onClick={() => handleQuickAction('export')}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground font-medium hover:bg-accent flex items-center space-x-3 transition-colors"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>Exportar lista</span>
                    </button>
                  </UIGuard>
                  <div className="border-t border-border my-2" />
                  <UIGuard show="showBulkActionsButton">
                    <button
                      onClick={() => handleQuickAction('bulk')}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground font-medium hover:bg-accent flex items-center space-x-3 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span>Ações em massa</span>
                    </button>
                  </UIGuard>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-secondary rounded-xl border border-border">
                    <div>
                      <label className="block text-sm font-semibold text-foreground font-medium mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
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
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredDepartments.map((dept) => (
                  <div key={dept.id}>{renderDepartmentCard(dept)}</div>
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
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-secondary mb-6">
                <Building className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum departamento encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Crie o primeiro departamento da organização
              </p>
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
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowExportMenu(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-popover text-popover-foreground rounded-2xl p-6 max-w-sm w-full mx-4 shadow-md hover:shadow-lg border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
                  Exportar Dados
                </h2>

                <div className="space-y-3">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full p-4 bg-success/10 hover:bg-success/20 rounded-xl border border-success/30 text-success font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Excel</p>
                      <p className="text-xs text-muted-foreground">Arquivo .xlsx para análises</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('notion')}
                    className="w-full p-4 bg-secondary hover:bg-accent rounded-xl border border-border text-foreground font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Notion</p>
                      <p className="text-xs text-muted-foreground">Markdown para importar</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full p-4 bg-destructive/10 hover:bg-destructive/20 rounded-xl border border-destructive/30 text-destructive font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileDown className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">PDF</p>
                      <p className="text-xs text-muted-foreground">Documento para impressão</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportMenu(false)}
                  className="w-full mt-4 p-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-accent transition-colors"
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
