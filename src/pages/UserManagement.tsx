import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import { 
  Users, Edit, Trash2, Search, Filter, Building, UserPlus,
  Shield, Mail, Calendar, X, AlertCircle, Briefcase,
  UserCheck, UsersIcon, MoreVertical, Star, ChevronRight,
  ArrowUpDown, Sparkles, Hash, Info, ChevronLeft, Zap,
  Crown, Target, Layers, Eye, EyeOff, Copy, Download,
  FolderPlus, UserCog, MapPin, FileText, BarChart,
  User, Phone, CalendarDays, Camera, Upload, Link2,
  GitBranch, Network, UserX, ArrowRight, ArrowLeft, Plus,
  Grid3x3, List, CheckCircle, FileSpreadsheet, FileDown,
  Loader2, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useSupabaseData } from '../hooks/useSupabaseData';
import type { UserWithDetails, TeamWithDetails, DepartmentWithDetails } from '../types/supabase';
import { PermissionGuard, ActionGuard, UIGuard, OperationWarning } from '../components/PermissionGuard';
import { usePermissions, useUIPermissions, useOperationValidator } from '../hooks/usePermissions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';
type ExportFormat = 'excel' | 'notion' | 'pdf';

const UserManagement = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const uiPermissions = useUIPermissions();
  const operationValidator = useOperationValidator();
  
  const { users, teams, departments, loading, actions } = useSupabaseData();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'team' | 'department'>('user');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: string;
    data: any;
    callback: () => void;
  } | null>(null);

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getTeamById = (id: string) => teams.find(t => t.id === id);
  const getDepartmentById = (id: string) => departments.find(d => d.id === id);

  const getSubordinates = (userId: string) => {
    return users.filter(u => u.reports_to === userId);
  };

  const getLeader = (userId: string) => {
    const user = getUserById(userId);
    return user?.reports_to ? getUserById(user.reports_to) : null;
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

  const handleEdit = (type: 'user' | 'team' | 'department', item: any) => {
    if (type === 'user') {
      if (!permissions.canEditUser(item.id)) {
        toast.error('Você não tem permissão para editar este usuário');
        return;
      }
      navigate(`/users/edit/${item.id}`);
      return;
    }
    
    if (type === 'team' && !permissions.canEditTeam(item.id, item.responsible_id)) {
      toast.error('Você não tem permissão para editar este time');
      return;
    }
    if (type === 'department' && !permissions.canEditDepartment()) {
      toast.error('Você não tem permissão para editar departamentos');
      return;
    }
    
    setEditType(type);
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (type: 'user' | 'team' | 'department', id: string) => {
    if (!permissions.hasPermission(type + 's', 'delete')) {
      toast.error('Você não tem permissão para esta ação');
      return;
    }

    const operation = type === 'user' ? 'deactivate_user' : `delete_${type}`;
    const targetData = type === 'user' 
      ? users.find(u => u.id === id)
      : type === 'team' 
      ? teams.find(t => t.id === id)
      : departments.find(d => d.id === id);

    if (!operationValidator.canExecute(operation, targetData)) {
      const errors = operationValidator.getValidationErrors(operation, targetData);
      toast.error(errors[0] || 'Operação não permitida');
      return;
    }

    const warnings = operationValidator.getValidationWarnings(operation, targetData);
    if (warnings.length > 0) {
      setPendingOperation({
        type: operation,
        data: targetData,
        callback: async () => {
          if (type === 'user') {
            await actions.users.deactivate(id);
          } else if (type === 'team') {
            await actions.teams.delete(id);
          } else {
            await actions.departments.delete(id);
          }
        }
      });
      setShowWarning(true);
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir?')) {
      if (type === 'user') {
        await actions.users.deactivate(id);
      } else if (type === 'team') {
        await actions.teams.delete(id);
      } else {
        await actions.departments.delete(id);
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
        if (!permissions.hasPermission('users', 'delete')) {
          toast.error('Você não tem permissão para ações em massa');
          return;
        }
        toast.success('Ações em massa em desenvolvimento');
        break;
    }
  };

  const exportToExcel = () => {
    let data: any[] = [];
    let filename = '';

    if (activeTab === 'users') {
      data = filteredUsers.map(user => ({
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
      filename = 'usuarios.xlsx';
    } else if (activeTab === 'teams') {
      data = filteredTeams.map(team => ({
        Nome: team.name,
        Departamento: team.department?.name || '-',
        Responsável: team.responsible?.name || '-',
        'Qtd. Membros': team.members?.length || 0,
        Descrição: team.description || '-',
        'Criado em': new Date(team.created_at).toLocaleDateString('pt-BR')
      }));
      filename = 'times.xlsx';
    } else {
      data = filteredDepartments.map(dept => ({
        Nome: dept.name,
        Descrição: dept.description || '-',
        Responsável: dept.responsible?.name || '-',
        'Qtd. Times': dept.teams?.length || 0,
        'Qtd. Pessoas': dept.member_count || 0,
        'Criado em': new Date(dept.created_at).toLocaleDateString('pt-BR')
      }));
      filename = 'departamentos.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
    XLSX.writeFile(wb, filename);
    toast.success('Dados exportados para Excel!');
  };

  const exportToNotion = () => {
    let markdownContent = '';

    if (activeTab === 'users') {
      markdownContent = `# Lista de Usuários\n\n`;
      markdownContent += `| Nome | Email | Cargo | Tipo | Departamento | Time |\n`;
      markdownContent += `|------|-------|-------|------|--------------|------|\n`;
      
      filteredUsers.forEach(user => {
        const userDepts = user.departments?.map(d => d.name).join(', ') || '-';
        const userTeams = user.teams?.map(t => t.name).join(', ') || '-';
        const type = user.is_director ? 'Diretor' : user.is_leader ? 'Líder' : 'Colaborador';
        
        markdownContent += `| ${user.name} | ${user.email} | ${user.position} | ${type} | ${userDepts} | ${userTeams} |\n`;
      });
    } else if (activeTab === 'teams') {
      markdownContent = `# Lista de Times\n\n`;
      markdownContent += `| Nome | Departamento | Responsável | Membros | Descrição |\n`;
      markdownContent += `|------|--------------|-------------|---------|------------|\n`;
      
      filteredTeams.forEach(team => {
        const dept = team.department?.name || '-';
        const responsible = team.responsible?.name || '-';
        
        markdownContent += `| ${team.name} | ${dept} | ${responsible} | ${team.members?.length || 0} | ${team.description || '-'} |\n`;
      });
    } else {
      markdownContent = `# Lista de Departamentos\n\n`;
      markdownContent += `| Nome | Descrição | Responsável | Times | Pessoas |\n`;
      markdownContent += `|------|-----------|-------------|-------|----------|\n`;
      
      filteredDepartments.forEach(dept => {
        const responsible = dept.responsible?.name || '-';
        const teamCount = dept.teams?.length || 0;
        const userCount = dept.member_count || 0;
        
        markdownContent += `| ${dept.name} | ${dept.description || '-'} | ${responsible} | ${teamCount} | ${userCount} |\n`;
      });
    }

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_notion.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados em formato Notion!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let title = '';
    let headers: string[] = [];
    let data: any[][] = [];

    if (activeTab === 'users') {
      title = 'Lista de Usuários';
      headers = ['Nome', 'Email', 'Cargo', 'Tipo', 'Data de Entrada'];
      data = filteredUsers.map(user => [
        user.name,
        user.email,
        user.position,
        user.is_director ? 'Diretor' : user.is_leader ? 'Líder' : 'Colaborador',
        new Date(user.join_date).toLocaleDateString('pt-BR')
      ]);
    } else if (activeTab === 'teams') {
      title = 'Lista de Times';
      headers = ['Nome', 'Departamento', 'Responsável', 'Membros'];
      data = filteredTeams.map(team => [
        team.name,
        team.department?.name || '-',
        team.responsible?.name || '-',
        (team.members?.length || 0).toString()
      ]);
    } else {
      title = 'Lista de Departamentos';
      headers = ['Nome', 'Responsável', 'Times', 'Pessoas'];
      data = filteredDepartments.map(dept => [
        dept.name,
        dept.responsible?.name || '-',
        (dept.teams?.length || 0).toString(),
        (dept.member_count || 0).toString()
      ]);
    }

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

    doc.save(`${activeTab}.pdf`);
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
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.position.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = !selectedDepartment || 
          user.departments?.some(d => d.id === selectedDepartment);
        
        const matchesTeam = !selectedTeam || 
          user.teams?.some(t => t.id === selectedTeam);
        
        const matchesLeader = !showOnlyLeaders || user.is_leader;

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
  }, [users, searchTerm, selectedDepartment, selectedTeam, showOnlyLeaders, sortBy]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !selectedDepartment || team.department_id === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [teams, searchTerm, selectedDepartment]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalLeaders: users.filter(u => u.is_leader && !u.is_director).length,
    totalDirectors: users.filter(u => u.is_director).length,
    totalCollaborators: users.filter(u => !u.is_leader).length,
    totalTeams: teams.length,
    totalDepartments: departments.length,
  }), [users, teams, departments]);

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
    const userDepartments = user.departments || [];
    const subordinates = getSubordinates(user.id);
    const leader = user.manager;
    const age = user.birth_date ? calculateAge(user.birth_date) : null;
    
    return (
      <motion.div
        layout
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 group"
      >
        <div className={`h-2 bg-gradient-to-r ${
          user.is_director 
            ? 'from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700' 
            : user.is_leader 
              ? 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700' 
              : 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700'
        }`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
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
                      ? 'from-gray-700 to-gray-900' 
                      : user.is_leader 
                        ? 'from-primary-500 to-primary-700' 
                        : 'from-secondary-500 to-secondary-700'
                  }`}>
                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                {user.is_director && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg">
                    <Shield className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                  </div>
                )}
                {user.is_leader && !user.is_director && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg">
                    <Crown className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
                  </div>
                )}
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
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionGuard can={() => permissions.canEditUser(user.id)}>
                <button
                  onClick={() => handleEdit('user', user)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all hover:text-primary-600 dark:hover:text-primary-400"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>
              
              <ActionGuard can={permissions.canDeactivateUser}>
                <button
                  onClick={() => handleDelete('user', user.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:text-red-600 dark:hover:text-red-400"
                  title="Desativar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Mail className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
              <span className="text-sm truncate">{user.email}</span>
            </div>
            
            <UIGuard show="showFullContactInfo">
              {user.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <Phone className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
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
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <GitBranch className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                  <span>Reporta para: </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1 group-hover/item:text-primary-700 dark:group-hover/item:text-primary-300">{leader.name}</span>
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
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700"
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

  const renderTeamCard = (team: TeamWithDetails) => {
    const department = team.department;
    const responsible = team.responsible;
    const members = team.members || [];
    
    return (
      <motion.div
        layout
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 group"
      >
        <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-600 dark:from-primary-600 dark:to-secondary-700" />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 shadow-md dark:shadow-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{team.name}</h3>
                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{team.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionGuard can={() => permissions.canEditTeam(team.id, team.responsible_id ?? undefined)}>
                <button
                  onClick={() => handleEdit('team', team)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>
              
              <ActionGuard can={permissions.canDeleteTeam}>
                <button
                  onClick={() => handleDelete('team', team.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            {department && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Building className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                <span className="font-medium">{department.name}</span>
              </div>
            )}

            {responsible && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <UserCog className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                <span>Líder: <span className="font-medium">{responsible.name}</span></span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{members.length} {members.length === 1 ? 'membro' : 'membros'}</span>
            </div>
          </div>

          {members.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="relative group/avatar"
                    title={member.name}
                  >
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt={member.name}
                        className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 shadow-sm group-hover/avatar:z-10 transition-all"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-xs font-bold text-white shadow-sm group-hover/avatar:z-10 transition-all">
                        {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
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
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 shadow-md dark:shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{department.name}</h3>
                {department.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{department.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionGuard can={permissions.canEditDepartment}>
                <button
                  onClick={() => handleEdit('department', department)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>
              
              <ActionGuard can={permissions.canDeleteDepartment}>
                <button
                  onClick={() => handleDelete('department', department.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:text-red-600 dark:hover:text-red-400"
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
                <span>Responsável: <span className="font-medium">{responsible.name}</span></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{deptTeams.length} {deptTeams.length === 1 ? 'time' : 'times'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
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
    <PermissionGuard resource="users" action="read">
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
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3 flex-shrink-0" />
                  Gerenciar Usuários
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Visualize e gerencie usuários, times e departamentos
                </p>
              </div>
            </div>

            <UIGuard show="showCreateUserButton">
              <Button
                variant="primary"
                onClick={() => navigate('/users/new')}
                icon={<Plus size={18} />}
                size="lg"
              >
                Novo Cadastro
              </Button>
            </UIGuard>
          </div>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Usando dados do Supabase. As alterações serão salvas no banco de dados.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-300 font-medium">Usuários</p>
              </div>
              <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-700 dark:text-gray-800 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalDirectors}</p>
                <p className="text-sm text-gray-200 font-medium">Diretores</p>
              </div>
              <Shield className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-600 dark:text-gray-700 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalLeaders}</p>
                <p className="text-sm text-primary-100 font-medium">Líderes</p>
              </div>
              <Crown className="absolute -bottom-2 -right-2 h-16 w-16 text-primary-400 dark:text-primary-500 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 dark:from-secondary-600 dark:via-secondary-700 dark:to-secondary-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalCollaborators}</p>
                <p className="text-sm text-secondary-100 font-medium">Colaboradores</p>
              </div>
              <UserCheck className="absolute -bottom-2 -right-2 h-16 w-16 text-secondary-400 dark:text-secondary-500 opacity-50" />
            </motion.div>
            
            <motion.div 
              variants={itemVariants} 
              className="relative overflow-hidden rounded-xl p-4 text-center shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #247B7B, #1B5B5B)' }}
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                <p className="text-sm text-teal-100 font-medium">Times</p>
              </div>
              <UsersIcon className="absolute -bottom-2 -right-2 h-16 w-16 text-teal-300 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 dark:from-accent-600 dark:via-accent-700 dark:to-accent-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalDepartments}</p>
                <p className="text-sm text-accent-100 font-medium">Departamentos</p>
              </div>
              <Building className="absolute -bottom-2 -right-2 h-16 w-16 text-accent-400 dark:text-accent-500 opacity-50" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex p-1.5 bg-gray-100/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl">
              {[
                { id: 'users', label: 'Usuários', icon: Users },
                { id: 'teams', label: 'Times', icon: UsersIcon },
                { id: 'departments', label: 'Departamentos', icon: Building }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm dark:shadow-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

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
                placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : activeTab === 'teams' ? 'times' : 'departamentos'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-gray-50/50 dark:bg-gray-700/50 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <AnimatePresence>
              {showFilters && activeTab === 'users' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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

                    <div className="flex items-end">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyLeaders}
                          onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400 mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apenas líderes</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {activeTab === 'users' && (
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
              )}

              {activeTab === 'teams' && (
                <motion.div
                  key="teams"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
                >
                  {filteredTeams.map(team => (
                    <div key={team.id}>
                      {renderTeamCard(team)}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'departments' && (
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
              )}
            </AnimatePresence>
          </div>

          {activeTab === 'users' && filteredUsers.length === 0 && (
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

          {activeTab === 'teams' && filteredTeams.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
                <UsersIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum time encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Crie o primeiro time da organização</p>
              <UIGuard show="showCreateTeamButton">
                <Button
                  variant="primary"
                  onClick={() => navigate('/users/new')}
                  icon={<Plus size={18} />}
                >
                  Criar Time
                </Button>
              </UIGuard>
            </motion.div>
          )}

          {activeTab === 'departments' && filteredDepartments.length === 0 && (
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
                  onClick={() => navigate('/users/new')}
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

export default UserManagement;