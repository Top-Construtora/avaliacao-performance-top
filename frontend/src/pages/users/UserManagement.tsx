import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import UserSalaryAssignment from '../../components/UserSalaryAssignment';
import { 
  Users, Edit, Search, Filter,
  Shield, Mail, Calendar, UserCheck, MoreVertical, Crown, 
  Copy, Download, Phone, CalendarDays, Upload, FileText, GitBranch,
  Network, UserX, Plus, Grid3x3, List, FileSpreadsheet, 
  FileDown, DollarSign, Loader2, Database, UsersIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import type { UserWithDetails } from '../../types/supabase';
import { RoleGuard } from '../../components/RoleGuard';
import { usePermissions, useUIPermissions, useOperationValidator } from '../../hooks/usePermissions';
import type { User } from '../../types/supabase';
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

const UserManagement = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const uiPermissions = useUIPermissions();
  const operationValidator = useOperationValidator();
  
  const { users, teams, departments, loading, actions } = useSupabaseData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<User | null>(null);
  const [pendingOperation, setPendingOperation] = useState<{
    type: string;
    data: any;
    callback: () => void;
  } | null>(null);

  const getSubordinates = (userId: string) => {
    return users.filter(u => u.reports_to === userId);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleEdit = (user: UserWithDetails) => {
    if (!permissions.canEditUser(user.id)) {
      toast.error('Você não tem permissão para editar este usuário');
      return;
    }
    navigate(`/users/edit/${user.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!permissions.hasPermission('users', 'delete')) {
      toast.error('Você não tem permissão para esta ação');
      return;
    }

    const targetData = users.find(u => u.id === id);

    if (!operationValidator.canExecute('deactivate_user', targetData)) {
      const errors = operationValidator.getValidationErrors('deactivate_user', targetData);
      toast.error(errors[0] || 'Operação não permitida');
      return;
    }

    const warnings = operationValidator.getValidationWarnings('deactivate_user', targetData);
    if (warnings.length > 0) {
      const isActive = targetData?.active !== false;
      setPendingOperation({
        type: 'deactivate_user',
        data: targetData,
        callback: async () => {
          try {
            await actions.users.delete(id);
            if (isActive) {
              toast.success('Usuário desativado com sucesso!');
            } else {
              toast.success('Usuário excluído permanentemente!');
            }
          } catch (error) {
            toast.error(isActive ? 'Erro ao desativar usuário' : 'Erro ao excluir usuário');
          }
        }
      });
      setShowWarning(true);
      return;
    }

    // Verificar se o usuário está ativo ou inativo
    const isActive = targetData?.active !== false;
    const confirmMessage = isActive
      ? 'Tem certeza que deseja desativar este usuário? Ele será movido para usuários desativados.'
      : 'Este usuário já está desativado. Tem certeza que deseja EXCLUIR PERMANENTEMENTE todos os seus dados? Esta ação não pode ser desfeita!';

    if (window.confirm(confirmMessage)) {
      try {
        await actions.users.delete(id);
        if (isActive) {
          toast.success('Usuário desativado com sucesso!');
        } else {
          toast.success('Usuário excluído permanentemente!');
        }
      } catch (error) {
        toast.error(isActive ? 'Erro ao desativar usuário' : 'Erro ao excluir usuário');
      }
    }
  };

  const handleOpenSalaryModal = (user: User) => {
    setSelectedUserForSalary(user);
    setShowSalaryModal(true);
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
        if (!permissions.hasPermission('users', 'delete')) {
          toast.error('Você não tem permissão para ações em massa');
          return;
        }
        toast.success('Ações em massa em desenvolvimento');
        break;
    }
  };

  const exportToExcel = () => {
    const data = filteredUsers.map(user => ({
      Nome: user.name,
      Email: user.email,
      Cargo: user.position,
      Tipo: user.is_director ? 'Diretor' : user.is_leader ? 'Líder' : 'Colaborador',
      Departamentos: user.departments?.map(d => d.name).join(', ') || '-',
      Times: user.teams?.map(t => t.name).join(', ') || '-',
      'Data de Entrada': new Date(user.join_date).toLocaleDateString('pt-BR'),
      Telefone: uiPermissions.showFullContactInfo ? (user.phone || '-') : '***',
      Idade: user.birth_date ? calculateAge(user.birth_date) : '-',
      'Reporta para': user.manager?.name || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
    toast.success('Dados exportados para Excel!');
  };

  const exportToNotion = () => {
    let markdownContent = `# Lista de Usuários\n\n`;
    markdownContent += `| Nome | Email | Cargo | Tipo | Departamento | Time |\n`;
    markdownContent += `|------|-------|-------|------|--------------|------|\n`;
    
    filteredUsers.forEach(user => {
      const userDepts = user.departments?.map(d => d.name).join(', ') || '-';
      const userTeams = user.teams?.map(t => t.name).join(', ') || '-';
      const type = user.is_director ? 'Diretor' : user.is_leader ? 'Líder' : 'Colaborador';
      
      markdownContent += `| ${user.name} | ${user.email} | ${user.position} | ${type} | ${userDepts} | ${userTeams} |\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios_notion.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados em formato Notion!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = 'Lista de Usuários';
    const headers = ['Nome', 'Email', 'Cargo', 'Tipo', 'Data de Entrada'];
    const data = filteredUsers.map(user => [
      user.name,
      user.email,
      user.position,
      user.is_director ? 'Diretor' : user.is_leader ? 'Líder' : 'Colaborador',
      new Date(user.join_date).toLocaleDateString('pt-BR')
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

    doc.save('usuarios.pdf');
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

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        // Excluir usuários admin
        if (user.is_admin) return false;

        // Filtrar por status ativo/inativo
        if (showInactiveUsers) {
          // Mostrar apenas usuários inativos
          if (user.active !== false) return false;
        } else {
          // Mostrar apenas usuários ativos (comportamento padrão)
          if (user.active === false) return false;
        }

        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.position.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = !selectedDepartment ||
          user.department_id === selectedDepartment;

        const matchesTeam = !selectedTeam ||
          user.teams?.some(t => t.id === selectedTeam);

        const matchesLeader = !showOnlyLeaders || user.is_leader || user.is_director;

        return matchesSearch && matchesDepartment && matchesTeam && matchesLeader;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.join_date).getTime() - new Date(a.join_date).getTime();
          case 'department':
            const deptA = a.departments?.[0]?.name || '';
            const deptB = b.departments?.[0]?.name || '';
            return deptA.localeCompare(deptB);
          default:
            return 0;
        }
      });
  }, [users, searchTerm, selectedDepartment, selectedTeam, showOnlyLeaders, showInactiveUsers, sortBy]);

  const stats = useMemo(() => {
    const nonAdminUsers = users.filter(u => !u.is_admin);
    return {
      totalUsers: nonAdminUsers.length,
      totalLeaders: nonAdminUsers.filter(u => u.is_leader && !u.is_director).length,
      totalDirectors: nonAdminUsers.filter(u => u.is_director).length,
      totalCollaborators: nonAdminUsers.filter(u => !u.is_leader && !u.is_director).length,
    };
  }, [users]);

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

  const renderUserCard = (user: UserWithDetails) => {
    const userTeams = user.teams || [];
    const subordinates = getSubordinates(user.id);
    const leader = user.manager;
    const age = user.birth_date ? calculateAge(user.birth_date) : null;
    
    return (
      <motion.div
        layout
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 overflow-hidden dark:hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 group"
      >
        <div className={`h-2 bg-gradient-to-r ${
          user.is_director 
            ? 'from-stone-800 to-stone-900 dark:from-stone-800 dark:to-stone-900' 
            : user.is_leader 
              ? 'from-primary-900 to-primary-800 dark:from-primary-900 dark:to-primary-800' 
              : 'from-gray-600 to-gray-700 dark:from-gray-600 dark:to-gray-700'
        }`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="relative">
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.name}
                    className="h-14 w-14 rounded-2xl object-cover shadow-md dark:shadow-lg"
                  />
                ) : (
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-md dark:shadow-lg bg-gradient-to-br ${
                    user.is_director 
                      ? 'from-stone-800 to-stone-900' 
                      : user.is_leader 
                        ? 'from-primary-900 to-primary-800' 
                        : 'from-gray-600 to-gray-700'
                  }`}>
                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                {user.is_director && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg">
                    <Shield className="h-3.5 w-3.5 text-naue-black dark:text-gray-300 font-medium" />
                  </div>
                )}
                {user.is_leader && !user.is_director && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg">
                    <Crown className="h-3.5 w-3.5 text-stone-800 dark:text-stone-700" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{user.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.position}</p>
              {(user.is_director || user.is_leader) && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    user.is_director
                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
                      : 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                  }`}>
                    {user.is_director ? 'Diretor' : 'Líder'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
              <ActionGuard can={() => permissions.canEditUser(user.id)}>
                <button
                  onClick={() => handleEdit(user)}
                  className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-900 dark:hover:text-primary-700"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>

              <RoleGuard allowedRoles={['director', 'leader']}>
                <button
                  onClick={() => handleOpenSalaryModal(user)}
                  className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  title="Gestão Salarial"
                >
                  <DollarSign className="h-4 w-4" />
                </button>
              </RoleGuard>
              
              <ActionGuard can={permissions.canDeactivateUser}>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title={user.active === false ? "Excluir permanentemente" : "Desativar usuário"}
                >
                  <UserX className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-primary-900 dark:hover:text-primary-700 transition-colors">
              <Mail className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-900 dark:group-hover/item:text-primary-700" />
              <span className="text-sm truncate">{user.email}</span>
            </div>
            
            <UIGuard show="showFullContactInfo">
              {user.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-primary-900 dark:hover:text-primary-700 transition-colors">
                  <Phone className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-900 dark:group-hover/item:text-primary-700" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
            </UIGuard>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
              <span className="text-sm">
                Desde {new Date(user.join_date).toLocaleDateString('pt-BR', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            
            {age && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CalendarDays className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{age} anos</span>
              </div>
            )}
          </div>

          {(leader || subordinates.length > 0) && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              {leader && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2 group/item hover:text-primary-900 dark:hover:text-primary-700 transition-colors">
                  <GitBranch className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-900 dark:group-hover/item:text-primary-700" />
                  <span>Reporta para: </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1 group-hover/item:text-primary-900 dark:group-hover/item:text-primary-700">{leader.name}</span>
                </div>
              )}
              {subordinates.length > 0 && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Network className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">{subordinates.length} subordinado{subordinates.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}

          {userTeams.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {userTeams.map((team) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    <UsersIcon className="h-3 w-3 mr-1.5" />
                    {team.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-900 dark:text-primary-700 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard resource="users" action="read">
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <Database className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-900 dark:text-primary-900 mr-2 sm:mr-3 flex-shrink-0" />
                  Gerenciamento de Usuários
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Visualize e gerencie usuários do sistema
                </p>
              </div>
            </div>

            <UIGuard show="showCreateUserButton">
              <Button
                variant="primary"
                onClick={() => navigate('/register/user')}
                icon={<Plus size={18} />}
                size="lg"
              >
                Novo Usuário
              </Button>
            </UIGuard>
          </div>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-300 font-medium">Total</p>
              </div>
              <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 dark:text-gray-600 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 dark:from-stone-800 dark:via-stone-800 dark:to-stone-900 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalDirectors}</p>
                <p className="text-sm text-stone-100 font-medium">Diretores</p>
              </div>
              <Shield className="absolute -bottom-2 -right-2 h-16 w-16 text-stone-700 dark:text-stone-600 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 dark:from-primary-900 dark:via-primary-800 dark:to-primary-700 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalLeaders}</p>
                <p className="text-sm text-primary-100 font-medium">Líderes</p>
              </div>
              <Crown className="absolute -bottom-2 -right-2 h-16 w-16 text-stone-800 dark:text-stone-700 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalCollaborators}</p>
                <p className="text-sm text-gray-200 font-medium">Colaboradores</p>
              </div>
              <UserCheck className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 dark:text-gray-400 opacity-50" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-6">
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
                <button className="p-2.5 rounded-lg bg-naue-light-gray dark:bg-gray-700 text-naue-text-gray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <MoreVertical className="h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleQuickAction('import')}
                    className="w-full px-4 py-2.5 text-left text-sm text-naue-black dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span>Importar dados</span>
                  </button>
                  <UIGuard show="showExportButton">
                    <button
                      onClick={() => handleQuickAction('export')}
                      className="w-full px-4 py-2.5 text-left text-sm text-naue-black dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Exportar lista</span>
                    </button>
                  </UIGuard>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
                  <UIGuard show="showBulkActionsButton">
                    <button
                      onClick={() => handleQuickAction('bulk')}
                      className="w-full px-4 py-2.5 text-left text-sm text-naue-black dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
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
                placeholder="Buscar usuários..."
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-semibold text-naue-black dark:text-gray-300 font-medium mb-2">
                        Departamento
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-naue-black dark:text-gray-300 font-medium mb-2">
                        Time
                      </label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-naue-black dark:text-gray-300 font-medium mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="name">Nome</option>
                        <option value="date">Data de entrada</option>
                        <option value="department">Departamento</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyLeaders}
                          onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400 mr-3"
                        />
                        <span className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Apenas líderes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showInactiveUsers}
                          onChange={(e) => setShowInactiveUsers(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-400 mr-3"
                        />
                        <span className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Usuários desativados</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="users"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
              >
                {filteredUsers.map(user => (
                  <div key={user.id}>
                    {renderUserCard(user)}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {filteredUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
                <UserX className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Tente ajustar os filtros ou realizar uma nova busca</p>
              <UIGuard show="showCreateUserButton">
                <Button
                  variant="primary"
                  onClick={() => navigate('/users/new')}
                  icon={<Plus size={18} />}
                >
                  Cadastrar Usuário
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
                className="bg-naue-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-md hover:shadow-lg border border-naue-border-gray dark:border-gray-700"
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
                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600/30 dark:hover:to-gray-500/30 rounded-xl border border-gray-200 dark:border-gray-700 text-naue-black dark:text-gray-300 font-medium font-medium text-left flex items-center space-x-3 transition-all"
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

        {showSalaryModal && selectedUserForSalary && (
          <UserSalaryAssignment
            user={selectedUserForSalary}
            isOpen={showSalaryModal}
            onClose={() => {
              setShowSalaryModal(false);
              setSelectedUserForSalary(null);
            }}
            onUpdate={() => {
              actions.users.reload();
            }}
          />
        )}

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

export default UserManagement;