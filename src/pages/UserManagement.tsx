import { useState, useMemo, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
  Users, Plus, Edit, Trash2, Search, Filter, Building, UserPlus,
  Shield, Mail, Calendar, X, Check, AlertCircle, Briefcase,
  UserCheck, UsersIcon, MoreVertical, Star, ChevronRight,
  ArrowUpDown, Sparkles, Hash, Info, ChevronLeft, Zap,
  Crown, Target, Layers, Eye, EyeOff, Copy, Download,
  FolderPlus, UserCog, MapPin, FileText, BarChart,
  User, Phone, CalendarDays, Camera, Upload, Link2,
  GitBranch, Network, UserX, ArrowRight
} from 'lucide-react';

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';
type WizardStep = 'type' | 'basic' | 'personal' | 'role' | 'teams' | 'hierarchy' | 'review';

const UserManagement = () => {
  const { 
    users, teams, departments, addUser, updateUser, deleteUser,
    addTeam, updateTeam, deleteTeam, addDepartment, updateDepartment,
    deleteDepartment, getUserById, getTeamById, getDepartmentById,
    addHierarchicalRelation, removeHierarchicalRelation, getSubordinates,
    getLeader, calculateAge
  } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'user' | 'team' | 'department'>('user');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');
  const [wizardStep, setWizardStep] = useState<WizardStep>('type');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    password: '',
    position: '',
    isLeader: false,
    isDirector: false,
    teamIds: [] as string[],
    profileType: 'regular' as 'regular' | 'leader' | 'director',
    phone: '',
    birthDate: '',
    profileImage: null as string | null,
    reportsTo: '',
    directReports: [] as string[],
    
    // Team fields
    teamName: '',
    teamDepartmentId: '',
    teamResponsibleId: '',
    teamMemberIds: [] as string[],
    teamDescription: '',
    
    // Department fields
    departmentName: '',
    departmentDescription: '',
    departmentGoals: '',
    departmentResponsibleId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const positionTemplates = [
    { value: 'developer', label: 'Desenvolvedor(a)', icon: '💻' },
    { value: 'designer', label: 'Designer', icon: '🎨' },
    { value: 'manager', label: 'Gerente', icon: '📊' },
    { value: 'analyst', label: 'Analista', icon: '📈' },
    { value: 'coordinator', label: 'Coordenador(a)', icon: '🎯' },
  ];

  const teamTemplates = [
    { value: 'development', label: 'Desenvolvimento', icon: '💻', description: 'Time de engenharia e desenvolvimento' },
    { value: 'design', label: 'Design', icon: '🎨', description: 'Time de design e experiência do usuário' },
    { value: 'marketing', label: 'Marketing', icon: '📢', description: 'Time de marketing e comunicação' },
    { value: 'sales', label: 'Vendas', icon: '💼', description: 'Time comercial e vendas' },
    { value: 'support', label: 'Suporte', icon: '🛟', description: 'Time de suporte ao cliente' },
  ];

  const departmentTemplates = [
    { value: 'tech', label: 'Tecnologia', icon: '💻', description: 'Desenvolvimento e Infraestrutura' },
    { value: 'people', label: 'Pessoas', icon: '👥', description: 'Recursos Humanos e Cultura' },
    { value: 'finance', label: 'Financeiro', icon: '💰', description: 'Finanças e Contabilidade' },
    { value: 'operations', label: 'Operações', icon: '⚙️', description: 'Operações e Processos' },
    { value: 'commercial', label: 'Comercial', icon: '📈', description: 'Vendas e Relacionamento' },
  ];

  const wizardSteps = modalType === 'user' ? [
    { id: 'type', label: 'Tipo', icon: UserCheck },
    { id: 'basic', label: 'Dados Básicos', icon: User },
    { id: 'personal', label: 'Dados Pessoais', icon: CalendarDays },
    { id: 'role', label: 'Função', icon: Briefcase },
    { id: 'teams', label: 'Times', icon: Users },
    { id: 'hierarchy', label: 'Hierarquia', icon: GitBranch },
    { id: 'review', label: 'Revisar', icon: Check },
  ] : [];

  const getCurrentStepIndex = () => wizardSteps.findIndex(s => s.id === wizardStep);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (modalType === 'user') {
      if (wizardStep === 'basic') {
        if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
        if (!formData.email.trim()) errors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Email inválido';
        }
        if (!editingItem && !formData.password.trim()) errors.password = 'Senha é obrigatória';
      } else if (wizardStep === 'personal') {
        if (formData.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.phone)) {
          errors.phone = 'Telefone inválido';
        }
        if (formData.birthDate) {
          const age = calculateAge(formData.birthDate);
          if (age < 16) errors.birthDate = 'Idade mínima: 16 anos';
          if (age > 100) errors.birthDate = 'Data de nascimento inválida';
        }
      } else if (wizardStep === 'role') {
        if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
      } else if (wizardStep === 'teams') {
        if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
          errors.teams = 'Selecione pelo menos um time';
        }
      } else if (wizardStep === 'hierarchy') {
        if (formData.profileType === 'regular' && !formData.reportsTo) {
          errors.reportsTo = 'Selecione um líder';
        }
      }
    } else if (modalType === 'team') {
      if (!formData.teamName.trim()) errors.teamName = 'Nome do time é obrigatório';
      if (!formData.teamDepartmentId) errors.department = 'Selecione um departamento';
      if (!formData.teamResponsibleId) errors.responsible = 'Selecione um responsável';
      if (formData.teamMemberIds.length === 0) errors.members = 'Selecione pelo menos um membro';
    } else if (modalType === 'department') {
      if (!formData.departmentName.trim()) errors.departmentName = 'Nome do departamento é obrigatório';
      if (!formData.departmentResponsibleId) errors.responsible = 'Selecione um responsável';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < wizardSteps.length - 1) {
        setWizardStep(wizardSteps[currentIndex + 1].id as WizardStep);
      }
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setWizardStep(wizardSteps[currentIndex - 1].id as WizardStep);
    }
  };

  const openModal = (type: 'user' | 'team' | 'department', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setFormErrors({});
    setWizardStep('type');
    
    if (item) {
      if (type === 'user') {
        setFormData({
          ...formData,
          name: item.name,
          email: item.email,
          password: '',
          position: item.position,
          isLeader: item.isLeader,
          isDirector: item.isDirector || false,
          teamIds: item.teamIds,
          profileType: item.isDirector ? 'director' : item.isLeader ? 'leader' : 'regular',
          phone: item.phone || '',
          birthDate: item.birthDate || '',
          profileImage: item.profileImage || null,
          reportsTo: item.reportsTo || '',
          directReports: item.directReports || [],
        });
      } else if (type === 'team') {
        setFormData({
          ...formData,
          teamName: item.name,
          teamDepartmentId: item.departmentId,
          teamResponsibleId: item.responsibleId || item.leaderId,
          teamMemberIds: item.memberIds,
          teamDescription: item.description || '',
        });
      } else if (type === 'department') {
        const responsible = users.find(u => departments.find(d => d.id === item.id));
        setFormData({
          ...formData,
          departmentName: item.name,
          departmentDescription: item.description || '',
          departmentGoals: item.goals || '',
          departmentResponsibleId: responsible?.id || '',
        });
      }
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        position: '',
        isLeader: false,
        isDirector: false,
        teamIds: [],
        profileType: 'regular',
        phone: '',
        birthDate: '',
        profileImage: null,
        reportsTo: '',
        directReports: [],
        teamName: '',
        teamDepartmentId: '',
        teamResponsibleId: '',
        teamMemberIds: [],
        teamDescription: '',
        departmentName: '',
        departmentDescription: '',
        departmentGoals: '',
        departmentResponsibleId: '',
      });
    }
    
    setShowModal(true);
  };

 const handleSubmit = () => {
   if (!validateForm()) return;

   if (modalType === 'user') {
     const userData = {
       name: formData.name.trim(),
       email: formData.email.trim().toLowerCase(),
       position: formData.position.trim(),
       isLeader: formData.profileType !== 'regular',
       isDirector: formData.profileType === 'director',
       teamIds: formData.profileType === 'director' ? ['team_dir'] : formData.teamIds,
       leaderOfTeamIds: [],
       departmentIds: formData.profileType === 'director' 
         ? departments.map(d => d.id)
         : [...new Set(formData.teamIds.map(teamId => {
             const team = getTeamById(teamId);
             return team?.departmentId;
           }).filter(Boolean) as string[])],
       joinDate: editingItem?.joinDate || new Date().toISOString().split('T')[0],
       active: true,
       phone: formData.phone,
       birthDate: formData.birthDate,
       profileImage: formData.profileImage,
       reportsTo: formData.reportsTo || undefined,
       directReports: formData.directReports,
     };

     if (editingItem) {
       updateUser(editingItem.id, { ...userData, profileImage: userData.profileImage ?? undefined });
       
       if (formData.reportsTo && formData.reportsTo !== editingItem.reportsTo) {
         if (editingItem.reportsTo) {
           removeHierarchicalRelation(editingItem.reportsTo, editingItem.id);
         }
         const teamId = formData.teamIds[0] || teams[0].id;
         addHierarchicalRelation({
           leaderId: formData.reportsTo,
           subordinateId: editingItem.id,
           teamId: teamId
         });
       }
     } else {
       const newUserId = `user${Date.now()}`;
       addUser({ ...userData, profileImage: userData.profileImage ?? undefined });
       
       if (formData.reportsTo) {
         const teamId = formData.teamIds[0] || teams[0].id;
         setTimeout(() => {
           addHierarchicalRelation({
             leaderId: formData.reportsTo,
             subordinateId: newUserId,
             teamId: teamId
           });
         }, 100);
       }
     }
   } else if (modalType === 'team') {
     if (!formData.teamMemberIds.includes(formData.teamResponsibleId)) {
       formData.teamMemberIds.push(formData.teamResponsibleId);
     }

     const teamData = {
       name: formData.teamName.trim(),
       departmentId: formData.teamDepartmentId,
       leaderId: formData.teamResponsibleId,
       memberIds: formData.teamMemberIds,
       description: formData.teamDescription.trim(),
       createdAt: editingItem?.createdAt || new Date().toISOString(),
     };

     if (editingItem) {
       updateTeam(editingItem.id, teamData);
     } else {
       addTeam(teamData);
     }
   } else if (modalType === 'department') {
     const departmentData = {
       name: formData.departmentName.trim(),
       description: formData.departmentDescription.trim(),
       goals: formData.departmentGoals.trim(),
     };

     if (editingItem) {
       updateDepartment(editingItem.id, departmentData);
     } else {
       addDepartment(departmentData);
     }
   }

   setShowModal(false);
 };

 const handleDelete = (type: 'user' | 'team' | 'department', id: string) => {
   if (window.confirm('Tem certeza que deseja excluir?')) {
     if (type === 'user') {
       deleteUser(id);
     } else if (type === 'team') {
       deleteTeam(id);
     } else if (type === 'department') {
       deleteDepartment(id);
     }
   }
 };

 const handleQuickAction = (action: string) => {
   switch (action) {
     case 'import':
       toast.success('Funcionalidade de importação em desenvolvimento');
       break;
     case 'export':
       toast.success('Exportando dados...');
       break;
     case 'bulk':
       toast.success('Ações em massa em desenvolvimento');
       break;
   }
 };

 const filteredUsers = useMemo(() => {
   return users
     .filter(user => {
       const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.position.toLowerCase().includes(searchTerm.toLowerCase());
       
       const matchesDepartment = !selectedDepartment || user.departmentIds.includes(selectedDepartment);
       const matchesTeam = !selectedTeam || user.teamIds.includes(selectedTeam);
       const matchesLeader = !showOnlyLeaders || user.isLeader;

       return matchesSearch && matchesDepartment && matchesTeam && matchesLeader;
     })
     .sort((a, b) => {
       switch (sortBy) {
         case 'name':
           return a.name.localeCompare(b.name);
         case 'date':
           return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
         case 'department':
           const deptA = departments.find(d => a.departmentIds[0] === d.id)?.name || '';
           const deptB = departments.find(d => b.departmentIds[0] === d.id)?.name || '';
           return deptA.localeCompare(deptB);
         default:
           return 0;
       }
     });
 }, [users, searchTerm, selectedDepartment, selectedTeam, showOnlyLeaders, sortBy, departments]);

 const filteredTeams = useMemo(() => {
   return teams.filter(team => {
     const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesDepartment = !selectedDepartment || team.departmentId === selectedDepartment;
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
   totalLeaders: users.filter(u => u.isLeader && !u.isDirector).length,
   totalDirectors: users.filter(u => u.isDirector).length,
   totalCollaborators: users.filter(u => !u.isLeader).length,
   totalTeams: teams.length,
   totalDepartments: departments.length,
 }), [users, teams, departments]);

 const renderWizardStep = () => {
   switch (wizardStep) {
     case 'type':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Que tipo de usuário você deseja cadastrar?
           </h3>
           <div className="grid grid-cols-1 gap-3">
             <label 
               className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                 formData.profileType === 'regular' 
                   ? 'border-primary-500 bg-primary-50' 
                   : 'border-gray-200 hover:border-gray-300'
               }`}
             >
               <input
                 type="radio"
                 name="profileType"
                 value="regular"
                 checked={formData.profileType === 'regular'}
                 onChange={(e) => setFormData({ 
                   ...formData, 
                   profileType: 'regular',
                   isLeader: false,
                   isDirector: false
                 })}
                 className="sr-only"
               />
               <div className="flex items-center flex-1">
                 <div className="p-3 rounded-lg bg-gray-100 mr-4">
                   <UserCheck className="h-6 w-6 text-gray-600" />
                 </div>
                 <div>
                   <p className="font-medium text-gray-900">Colaborador</p>
                   <p className="text-sm text-gray-600">Membro regular da equipe</p>
                 </div>
               </div>
               {formData.profileType === 'regular' && (
                 <Check className="h-5 w-5 text-primary-600" />
               )}
             </label>

             <label 
               className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                 formData.profileType === 'leader' 
                   ? 'border-primary-500 bg-primary-50' 
                   : 'border-gray-200 hover:border-gray-300'
               }`}
             >
               <input
                 type="radio"
                 name="profileType"
                 value="leader"
                 checked={formData.profileType === 'leader'}
                 onChange={(e) => setFormData({ 
                   ...formData, 
                   profileType: 'leader',
                   isLeader: true,
                   isDirector: false
                 })}
                 className="sr-only"
               />
               <div className="flex items-center flex-1">
                 <div className="p-3 rounded-lg bg-primary-100 mr-4">
                   <Crown className="h-6 w-6 text-primary-600" />
                 </div>
                 <div>
                   <p className="font-medium text-gray-900">Líder</p>
                   <p className="text-sm text-gray-600">Lidera pessoas e avalia equipes</p>
                 </div>
               </div>
               {formData.profileType === 'leader' && (
                 <Check className="h-5 w-5 text-primary-600" />
               )}
             </label>

             <label 
               className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                 formData.profileType === 'director' 
                   ? 'border-purple-500 bg-purple-50' 
                   : 'border-gray-200 hover:border-gray-300'
               }`}
             >
               <input
                 type="radio"
                 name="profileType"
                 value="director"
                 checked={formData.profileType === 'director'}
                 onChange={(e) => setFormData({ 
                   ...formData, 
                   profileType: 'director',
                   isLeader: true,
                   isDirector: true
                 })}
                 className="sr-only"
               />
               <div className="flex items-center flex-1">
                 <div className="p-3 rounded-lg bg-purple-100 mr-4">
                   <Sparkles className="h-6 w-6 text-purple-600" />
                 </div>
                 <div>
                   <p className="font-medium text-gray-900">Diretor</p>
                   <p className="text-sm text-gray-600">Lidera outros líderes e departamentos</p>
                 </div>
               </div>
               {formData.profileType === 'director' && (
                 <Check className="h-5 w-5 text-purple-600" />
               )}
             </label>
           </div>
         </div>
       );

     case 'basic':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Informações básicas
           </h3>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Nome completo *
             </label>
             <input
               type="text"
               className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                 formErrors.name ? 'border-red-300' : ''
               }`}
               value={formData.name}
               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               placeholder="Ex: João Silva"
             />
             {formErrors.name && (
               <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
             )}
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Email corporativo *
             </label>
             <input
               type="email"
               className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                 formErrors.email ? 'border-red-300' : ''
               }`}
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
               placeholder="joao.silva@empresa.com"
             />
             {formErrors.email && (
               <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
             )}
           </div>

           {!editingItem && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Senha temporária *
               </label>
               <div className="relative">
                 <input
                   type={showPassword ? 'text' : 'password'}
                   className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 pr-10 ${
                     formErrors.password ? 'border-red-300' : ''
                   }`}
                   value={formData.password}
                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   placeholder="••••••••"
                 />
                 <button
                   type="button"
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                   onClick={() => setShowPassword(!showPassword)}
                 >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
               </div>
               {formErrors.password && (
                 <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
               )}
               <p className="text-xs text-gray-500 mt-1">
                 O usuário deverá alterar na primeira entrada
               </p>
             </div>
           )}
         </div>
       );

       // src/pages/UserManagement.tsx - Parte 3

     case 'personal':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Informações pessoais
           </h3>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Foto de perfil
             </label>
             <div className="flex items-center space-x-4">
               <div className="relative">
                 <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                   {formData.profileImage ? (
                     <img 
                       src={formData.profileImage} 
                       alt="Profile" 
                       className="h-full w-full object-cover"
                     />
                   ) : (
                     <Camera className="h-8 w-8 text-gray-400" />
                   )}
                 </div>
                 {formData.profileImage && (
                   <button
                     type="button"
                     onClick={() => setFormData({ ...formData, profileImage: null })}
                     className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                   >
                     <X size={14} />
                   </button>
                 )}
               </div>
               <div>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="hidden"
                 />
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                 >
                   <Upload className="h-4 w-4 mr-2" />
                   Enviar foto
                 </button>
                 <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF até 5MB</p>
               </div>
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Telefone
             </label>
             <div className="relative">
               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input
                 type="tel"
                 className={`w-full pl-10 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                   formErrors.phone ? 'border-red-300' : ''
                 }`}
                 value={formData.phone}
                 onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                 placeholder="(11) 98765-4321"
                 maxLength={15}
               />
             </div>
             {formErrors.phone && (
               <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
             )}
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Data de nascimento
             </label>
             <div className="relative">
               <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input
                 type="date"
                 className={`w-full pl-10 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                   formErrors.birthDate ? 'border-red-300' : ''
                 }`}
                 value={formData.birthDate}
                 onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                 max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                 min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
               />
             </div>
             {formErrors.birthDate && (
               <p className="text-xs text-red-600 mt-1">{formErrors.birthDate}</p>
             )}
             {formData.birthDate && (
               <p className="text-xs text-gray-500 mt-1">
                 Idade: {calculateAge(formData.birthDate)} anos
               </p>
             )}
           </div>
         </div>
       );

     case 'role':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Cargo e função
           </h3>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Cargo *
             </label>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
               {positionTemplates.map(template => (
                 <button
                   key={template.value}
                   type="button"
                   onClick={() => setFormData({ ...formData, position: template.label })}
                   className={`p-2 text-sm rounded-lg border transition-all ${
                     formData.position === template.label
                       ? 'border-primary-500 bg-primary-50 text-primary-700'
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <span className="mr-1">{template.icon}</span>
                   {template.label}
                 </button>
               ))}
             </div>
             
             <input
               type="text"
               className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                 formErrors.position ? 'border-red-300' : ''
               }`}
               value={formData.position}
               onChange={(e) => setFormData({ ...formData, position: e.target.value })}
               placeholder="Digite ou selecione acima"
             />
             {formErrors.position && (
               <p className="text-xs text-red-600 mt-1">{formErrors.position}</p>
             )}
           </div>

           <div className={`p-4 rounded-lg ${
             formData.profileType === 'director' 
               ? 'bg-purple-50 border border-purple-200' 
               : formData.profileType === 'leader'
                 ? 'bg-primary-50 border border-primary-200'
                 : 'bg-gray-50 border border-gray-200'
           }`}>
             <div className="flex items-start">
               <div className="mr-3">
                 {formData.profileType === 'director' ? (
                   <Sparkles className="h-5 w-5 text-purple-600" />
                 ) : formData.profileType === 'leader' ? (
                   <Crown className="h-5 w-5 text-primary-600" />
                 ) : (
                   <UserCheck className="h-5 w-5 text-gray-600" />
                 )}
               </div>
               <div className="text-sm">
                 <p className="font-medium text-gray-900 mb-1">
                   {formData.profileType === 'director' 
                     ? 'Permissões de Diretor'
                     : formData.profileType === 'leader'
                       ? 'Permissões de Líder'
                       : 'Permissões de Colaborador'
                   }
                 </p>
                 <ul className="space-y-1 text-gray-600">
                   {formData.profileType === 'director' ? (
                     <>
                       <li>• Acesso a todos os departamentos</li>
                       <li>• Gerencia outros líderes</li>
                       <li>• Visualiza relatórios executivos</li>
                       <li>• Define metas organizacionais</li>
                     </>
                   ) : formData.profileType === 'leader' ? (
                     <>
                       <li>• Lidera equipes diretamente</li>
                       <li>• Avalia membros da equipe</li>
                       <li>• Acessa relatórios do time</li>
                       <li>• Define metas da equipe</li>
                     </>
                   ) : (
                     <>
                       <li>• Acessa suas avaliações</li>
                       <li>• Participa de times</li>
                       <li>• Visualiza metas pessoais</li>
                       <li>• Colabora em projetos</li>
                     </>
                   )}
                 </ul>
               </div>
             </div>
           </div>
         </div>
       );

     case 'teams':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Alocação em times
           </h3>
           
           {formData.profileType === 'director' ? (
             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
               <div className="flex items-center">
                 <Sparkles className="h-5 w-5 text-purple-600 mr-3" />
                 <div>
                   <p className="font-medium text-purple-900">
                     Alocação automática
                   </p>
                   <p className="text-sm text-purple-700 mt-1">
                     Diretores são automaticamente alocados ao time "Diretoria" e têm acesso a todos os departamentos.
                   </p>
                 </div>
               </div>
             </div>
           ) : (
             <>
               <div className="mb-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Buscar times..."
                     className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 text-sm"
                   />
                 </div>
               </div>

               <div className={`border rounded-lg overflow-hidden ${
                 formErrors.teams ? 'border-red-300' : 'border-gray-200'
               }`}>
                 <div className="max-h-64 overflow-y-auto">
                   {departments.map(dept => {
                     const deptTeams = teams.filter(t => t.departmentId === dept.id && t.name !== 'Diretoria');
                     if (deptTeams.length === 0) return null;
                     
                     return (
                       <div key={dept.id} className="border-b border-gray-100 last:border-0">
                         <div className="px-4 py-2 bg-gray-50">
                           <p className="text-sm font-medium text-gray-700 flex items-center">
                             <Building className="h-4 w-4 mr-2 text-gray-500" />
                             {dept.name}
                           </p>
                         </div>
                         <div className="p-2">
                           {deptTeams.map(team => {
                             const isSelected = formData.teamIds.includes(team.id);
                             const responsible = getUserById(team.leaderId);
                             
                             return (
                               <label
                                 key={team.id}
                                 className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                                   isSelected 
                                     ? 'bg-primary-50 border border-primary-200' 
                                     : 'hover:bg-gray-50'
                                 }`}
                               >
                                 <input
                                   type="checkbox"
                                   className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                   checked={isSelected}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       setFormData({ 
                                         ...formData, 
                                         teamIds: [...formData.teamIds, team.id]
                                       });
                                     } else {
                                       setFormData({ 
                                         ...formData, 
                                         teamIds: formData.teamIds.filter(id => id !== team.id)
                                       });
                                     }
                                   }}
                                 />
                                 <div className="ml-3 flex-1">
                                   <p className="font-medium text-gray-900 text-sm">
                                     {team.name}
                                   </p>
                                   <div className="flex items-center mt-1 text-xs text-gray-600">
                                     <Users className="h-3 w-3 mr-1" />
                                     {team.memberIds.length} membros
                                     {responsible && (
                                       <>
                                         <span className="mx-2">•</span>
                                         <UserCog className="h-3 w-3 mr-1" />
                                         {responsible.name}
                                       </>
                                     )}
                                   </div>
                                 </div>
                               </label>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
               
               {formErrors.teams && (
                 <p className="text-xs text-red-600">{formErrors.teams}</p>
               )}
             </>
           )}
         </div>
       );

     case 'hierarchy':
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Estrutura hierárquica
           </h3>
           
           {formData.profileType === 'director' ? (
             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
               <div className="flex items-center">
                 <Network className="h-5 w-5 text-purple-600 mr-3" />
                 <div>
                   <p className="font-medium text-purple-900">
                     Posição no topo da hierarquia
                   </p>
                   <p className="text-sm text-purple-700 mt-1">
                     Diretores não reportam a ninguém e podem ter outros líderes como subordinados diretos.
                   </p>
                 </div>
               </div>
             </div>
           ) : formData.profileType === 'leader' ? (
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Liderado por
                 </label>
                 <select
                   className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                   value={formData.reportsTo}
                   onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                 >
                   <option value="">Selecione um superior (opcional)</option>
                   {users
                     .filter(u => u.isDirector || (u.isLeader && u.id !== editingItem?.id))
                     .map(user => (
                       <option key={user.id} value={user.id}>
                         {user.name} - {user.position}
                         {user.isDirector && ' (Diretor)'}
                       </option>
                     ))}
                 </select>
                 <p className="text-xs text-gray-500 mt-1">
                   Líderes podem reportar para diretores ou outros líderes
                 </p>
               </div>

               <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                 <div className="flex items-start">
                   <Info className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium text-primary-900 mb-1">
                       Liderança direta
                     </p>
                     <p className="text-primary-700">
                       Você poderá definir quem são seus liderados diretos após o cadastro.
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Reporta para *
                 </label>
                 <select
                   className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                     formErrors.reportsTo ? 'border-red-300' : ''
                   }`}
                   value={formData.reportsTo}
                   onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                 >
                   <option value="">Selecione seu líder direto</option>
                   {users
                     .filter(u => (u.isLeader || u.isDirector) && u.id !== editingItem?.id)
                     .map(user => (
                       <option key={user.id} value={user.id}>
                         {user.name} - {user.position}
                         {user.isDirector && ' (Diretor)'}
                       </option>
                     ))}
                 </select>
                 {formErrors.reportsTo && (
                   <p className="text-xs text-red-600 mt-1">{formErrors.reportsTo}</p>
                 )}
               </div>

               {formData.reportsTo && (
                 <div className="bg-gray-50 rounded-lg p-4">
                   <p className="text-sm font-medium text-gray-700 mb-2">Estrutura hierárquica</p>
                   <div className="flex items-center space-x-2 text-sm">
                     <div className="flex items-center">
                       <User className="h-4 w-4 text-gray-500 mr-1" />
                       <span className="text-gray-600">{formData.name || 'Novo usuário'}</span>
                     </div>
                     <ArrowRight className="h-4 w-4 text-gray-400" />
                     <div className="flex items-center">
                       <Shield className="h-4 w-4 text-primary-500 mr-1" />
                       <span className="text-gray-800 font-medium">
                         {getUserById(formData.reportsTo)?.name}
                       </span>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>
       );

     case 'review':
       const selectedTeams = teams.filter(t => formData.teamIds.includes(t.id));
       const selectedDepartments = [...new Set(selectedTeams.map(t => t.departmentId))].map(id => 
         departments.find(d => d.id === id)
       ).filter(Boolean);
       const reportingTo = formData.reportsTo ? getUserById(formData.reportsTo) : null;
       const age = formData.birthDate ? calculateAge(formData.birthDate) : null;
       
       return (
         <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-800 mb-4">
             Confirme os dados
           </h3>
           
           <div className="space-y-4">
             <div className="flex items-center justify-center mb-6">
               <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                 formData.profileType === 'director'
                   ? 'bg-purple-100 text-purple-800'
                   : formData.profileType === 'leader'
                     ? 'bg-primary-100 text-primary-800'
                     : 'bg-gray-100 text-gray-800'
               }`}>
                 {formData.profileType === 'director' ? (
                   <Sparkles className="h-5 w-5 mr-2" />
                 ) : formData.profileType === 'leader' ? (
                   <Crown className="h-5 w-5 mr-2" />
                 ) : (
                   <UserCheck className="h-5 w-5 mr-2" />
                 )}
                 <span className="font-medium">
                   {formData.profileType === 'director' 
                     ? 'Diretor' 
                     : formData.profileType === 'leader'
                       ? 'Líder'
                       : 'Colaborador'
                   }
                 </span>
               </div>
             </div>

             <div className="bg-gray-50 rounded-lg p-4">
               <div className="flex items-start space-x-4">
                 {formData.profileImage && (
                   <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                     <img 
                       src={formData.profileImage} 
                       alt="Profile" 
                       className="h-full w-full object-cover"
                     />
                   </div>
                 )}
                 <div className="flex-1">
                   <h4 className="text-sm font-medium text-gray-700 mb-3">Informações básicas</h4>
                   <dl className="space-y-2">
                     <div className="flex justify-between">
                       <dt className="text-sm text-gray-600">Nome:</dt>
                       <dd className="text-sm font-medium text-gray-900">{formData.name}</dd>
                     </div>
                     <div className="flex justify-between">
                       <dt className="text-sm text-gray-600">Email:</dt>
                       <dd className="text-sm font-medium text-gray-900">{formData.email}</dd>
                     </div>
                     <div className="flex justify-between">
                       <dt className="text-sm text-gray-600">Cargo:</dt>
                       <dd className="text-sm font-medium text-gray-900">{formData.position}</dd>
                     </div>
                   </dl>
                 </div>
               </div>
             </div>

             {(formData.phone || formData.birthDate) && (
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-gray-700 mb-3">Informações pessoais</h4>
                 <dl className="space-y-2">
                   {formData.phone && (
                     <div className="flex justify-between">
                       <dt className="text-sm text-gray-600">Telefone:</dt>
                       <dd className="text-sm font-medium text-gray-900">{formData.phone}</dd>
                     </div>
                   )}
                   {formData.birthDate && (
                     <>
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Data de nascimento:</dt>
                         <dd className="text-sm font-medium text-gray-900">
                           {new Date(formData.birthDate).toLocaleDateString('pt-BR')}
                         </dd>
                       </div>
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Idade:</dt>
                         <dd className="text-sm font-medium text-gray-900">{age} anos</dd>
                       </div>
                     </>
                   )}
                 </dl>
               </div>
             )}

             <div className="bg-gray-50 rounded-lg p-4">
               <h4 className="text-sm font-medium text-gray-700 mb-3">Alocação</h4>
               {formData.profileType === 'director' ? (
                 <p className="text-sm text-gray-600">
                   Alocado automaticamente ao time Diretoria com acesso a todos os departamentos
                 </p>
               ) : (
                 <>
                   <div className="space-y-2">
                     <div>
                       <p className="text-xs text-gray-500 mb-1">Times ({selectedTeams.length})</p>
                       <div className="flex flex-wrap gap-1">
                         {selectedTeams.map(team => (
                           <span
                             key={team.id}
                             className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-gray-200"
                           >
                             {team.name}
                           </span>
                         ))}
                       </div>
                     </div>
                     
                     <div>
                       <p className="text-xs text-gray-500 mb-1">Departamentos</p>
                       <div className="flex flex-wrap gap-1">
                         {selectedDepartments.map(dept => dept && (
                           <span
                             key={dept.id}
                             className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-gray-200"
                           >
                             {dept.name}
                           </span>
                         ))}
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </div>

             {reportingTo && (
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-gray-700 mb-3">Hierarquia</h4>
                 <div className="flex items-center space-x-2 text-sm">
                   <div className="flex items-center">
                     <User className="h-4 w-4 text-gray-500 mr-1" />
                     <span className="text-gray-600">{formData.name}</span>
                   </div>
                   <ArrowRight className="h-4 w-4 text-gray-400" />
                   <div className="flex items-center">
                     {reportingTo.isDirector ? (
                       <Sparkles className="h-4 w-4 text-purple-500 mr-1" />
                     ) : (
                       <Shield className="h-4 w-4 text-primary-500 mr-1" />
                     )}
                     <span className="text-gray-800 font-medium">
                       {reportingTo.name}
                     </span>
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>
       );

     default:
       return null;
   }
 };

 const renderUserCard = (user: typeof users[0]) => {
   const userTeams = teams.filter(team => user.teamIds.includes(team.id));
   const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
   const subordinates = getSubordinates(user.id);
   const leader = getLeader(user.id);
   
   return (
     <motion.div
       layout
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       whileHover={{ y: -2 }}
       className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
     >
       <div className="p-5 border-b border-gray-50">
         <div className="flex items-start justify-between">
           <div className="flex items-center space-x-3">
             <div className="relative">
               {user.profileImage ? (
                 <img 
                   src={user.profileImage} 
                   alt={user.name}
                   className="h-12 w-12 rounded-xl object-cover"
                 />
               ) : (
                 <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                   user.isDirector 
                     ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                     : user.isLeader 
                       ? 'bg-gradient-to-br from-primary-500 to-primary-700' 
                       : 'bg-gradient-to-br from-gray-400 to-gray-600'
                 }`}>
                   {user.name.charAt(0).toUpperCase()}
                 </div>
               )}
               {user.isDirector && (
                 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                   <Sparkles className="h-3 w-3 text-purple-500" />
                 </div>
               )}
             </div>
             
             <div>
               <h3 className="font-semibold text-gray-900">{user.name}</h3>
               <p className="text-sm text-gray-600">{user.position}</p>
             </div>
           </div>
           
           <div className="flex items-center space-x-1">
             <button
               onClick={() => openModal('user', user)}
               className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
               title="Editar"
             >
               <Edit className="h-4 w-4 text-gray-500" />
             </button>
             <button
               onClick={() => handleDelete('user', user.id)}
               className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
               title="Excluir"
             >
               <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
             </button>
           </div>
         </div>
         
         {(user.isDirector || user.isLeader) && (
           <div className="mt-3">
             <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
               user.isDirector
                 ? 'bg-purple-100 text-purple-800'
                 : 'bg-primary-100 text-primary-800'
             }`}>
               {user.isDirector ? (
                 <>
                   <Sparkles className="h-3 w-3 mr-1" />
                   Diretor
                 </>
               ) : (
                 <>
                   <Crown className="h-3 w-3 mr-1" />
                   Líder
                 </>
               )}
             </span>
           </div>
         )}
       </div>

       <div className="p-5 space-y-3">
         <div className="space-y-2">
           <div className="flex items-center text-gray-600">
             <Mail className="h-4 w-4 mr-2 text-gray-400" />
             <span className="text-sm truncate">{user.email}</span>
           </div>
           
           {user.phone && (
             <div className="flex items-center text-gray-600">
               <Phone className="h-4 w-4 mr-2 text-gray-400" />
               <span className="text-sm">{user.phone}</span>
             </div>
           )}
           
           <div className="flex items-center text-gray-600">
             <Calendar className="h-4 w-4 mr-2 text-gray-400" />
             <span className="text-sm">
               Desde {new Date(user.joinDate).toLocaleDateString('pt-BR', { 
                 month: 'short', 
                 year: 'numeric' 
               })}
             </span>
           </div>
           
           {user.age && (
             <div className="flex items-center text-gray-600">
               <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
               <span className="text-sm">{user.age} anos</span>
             </div>
           )}
         </div>

         {(leader || subordinates.length > 0) && (
           <div className="pt-3 border-t border-gray-100">
             {leader && (
               <div className="flex items-center text-sm text-gray-600 mb-2">
                 <GitBranch className="h-4 w-4 mr-2 text-gray-400" />
                 <span>Reporta para: </span>
                 <span className="font-medium text-gray-800 ml-1">{leader.name}</span>
               </div>
             )}
             {subordinates.length > 0 && (
               <div className="flex items-center text-sm text-gray-600">
                 <Network className="h-4 w-4 mr-2 text-gray-400" />
                 <span>{subordinates.length} subordinado{subordinates.length > 1 ? 's' : ''}</span>
               </div>
             )}
           </div>
         )}

         {userTeams.length > 0 && (
           <div className="pt-3 border-t border-gray-100">
             <p className="text-xs text-gray-500 mb-2">Times</p>
             <div className="flex flex-wrap gap-1">
               {userTeams.map(team => (
                 <span
                   key={team.id}
                   className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                 >
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

 // src/pages/UserManagement.tsx - Parte 5 (Final)

 return (
   <div className="space-y-6">
     {/* Header */}
     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
         <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center">
             <UserPlus className="h-8 w-8 text-primary-500 mr-3" />
             Gestão de Usuários
           </h1>
           <p className="text-gray-600 mt-1">Gerencie usuários, times e departamentos</p>
         </div>

         <div className="flex flex-col sm:flex-row gap-3">
           <Button
             variant="outline"
             onClick={() => handleQuickAction('import')}
             icon={<Upload size={18} />}
             size="md"
           >
             Importar
           </Button>
           <Button
             variant="outline"
             onClick={() => handleQuickAction('export')}
             icon={<Download size={18} />}
             size="md"
           >
             Exportar
           </Button>
           <Button
             variant="primary"
             onClick={() => openModal(activeTab === 'departments' ? 'department' : activeTab === 'teams' ? 'team' : 'user')}
             icon={<Plus size={18} />}
             size="md"
           >
             Novo {activeTab === 'departments' ? 'Departamento' : activeTab === 'teams' ? 'Time' : 'Usuário'}
           </Button>
         </div>
       </div>

       {/* Stats */}
       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
         <div className="bg-gray-50 rounded-lg p-4">
           <p className="text-sm text-gray-600">Total Usuários</p>
           <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
         </div>
         <div className="bg-primary-50 rounded-lg p-4">
           <p className="text-sm text-primary-600">Líderes</p>
           <p className="text-2xl font-bold text-primary-900">{stats.totalLeaders}</p>
         </div>
         <div className="bg-purple-50 rounded-lg p-4">
           <p className="text-sm text-purple-600">Diretores</p>
           <p className="text-2xl font-bold text-purple-900">{stats.totalDirectors}</p>
         </div>
         <div className="bg-gray-50 rounded-lg p-4">
           <p className="text-sm text-gray-600">Colaboradores</p>
           <p className="text-2xl font-bold text-gray-900">{stats.totalCollaborators}</p>
         </div>
         <div className="bg-secondary-50 rounded-lg p-4">
           <p className="text-sm text-secondary-600">Times</p>
           <p className="text-2xl font-bold text-secondary-900">{stats.totalTeams}</p>
         </div>
         <div className="bg-accent-50 rounded-lg p-4">
           <p className="text-sm text-accent-600">Departamentos</p>
           <p className="text-2xl font-bold text-accent-900">{stats.totalDepartments}</p>
         </div>
       </div>
     </div>

     {/* Tabs */}
     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
       <div className="border-b border-gray-200">
         <nav className="flex -mb-px">
           {[
             { id: 'users', label: 'Usuários', icon: Users },
             { id: 'teams', label: 'Times', icon: UsersIcon },
             { id: 'departments', label: 'Departamentos', icon: Building },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                 activeTab === tab.id
                   ? 'border-primary-500 text-primary-600'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <tab.icon className="h-4 w-4 mr-2" />
               {tab.label}
             </button>
           ))}
         </nav>
       </div>

       {/* Filters and Search */}
       <div className="p-4 border-b border-gray-100">
         <div className="flex flex-col lg:flex-row gap-4">
           <div className="flex-1">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input
                 type="text"
                 placeholder={`Buscar ${activeTab === 'departments' ? 'departamentos' : activeTab === 'teams' ? 'times' : 'usuários'}...`}
                 className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>

           <div className="flex gap-2">
             {activeTab === 'users' && (
               <>
                 <select
                   className="rounded-lg border-gray-200 text-sm"
                   value={selectedDepartment}
                   onChange={(e) => setSelectedDepartment(e.target.value)}
                 >
                   <option value="">Todos os departamentos</option>
                   {departments.map(dept => (
                     <option key={dept.id} value={dept.id}>{dept.name}</option>
                   ))}
                 </select>

                 <select
                   className="rounded-lg border-gray-200 text-sm"
                   value={selectedTeam}
                   onChange={(e) => setSelectedTeam(e.target.value)}
                 >
                   <option value="">Todos os times</option>
                   {teams.map(team => (
                     <option key={team.id} value={team.id}>{team.name}</option>
                   ))}
                 </select>

                 <button
                   onClick={() => setShowOnlyLeaders(!showOnlyLeaders)}
                   className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                     showOnlyLeaders
                       ? 'bg-primary-50 border-primary-200 text-primary-700'
                       : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                   }`}
                 >
                   <Shield className="h-4 w-4 inline mr-1" />
                   Líderes
                 </button>

                 <select
                   className="rounded-lg border-gray-200 text-sm"
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                 >
                   <option value="name">Nome</option>
                   <option value="date">Data de entrada</option>
                   <option value="department">Departamento</option>
                 </select>
               </>
             )}

             {activeTab === 'teams' && (
               <select
                 className="rounded-lg border-gray-200 text-sm"
                 value={selectedDepartment}
                 onChange={(e) => setSelectedDepartment(e.target.value)}
               >
                 <option value="">Todos os departamentos</option>
                 {departments.map(dept => (
                   <option key={dept.id} value={dept.id}>{dept.name}</option>
                 ))}
               </select>
             )}

             <button
               onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
               className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
               title={viewMode === 'grid' ? 'Ver em lista' : 'Ver em grade'}
             >
               {viewMode === 'grid' ? <Layers className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
             </button>
           </div>
         </div>
       </div>

       {/* Content */}
       <div className="p-6">
         {activeTab === 'users' && (
           <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
             <AnimatePresence>
               {filteredUsers.map(user => (
                 <div key={user.id}>
                   {renderUserCard(user)}
                 </div>
               ))}
             </AnimatePresence>
           </div>
         )}

         {activeTab === 'teams' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <AnimatePresence>
               {filteredTeams.map(team => {
                 const department = getDepartmentById(team.departmentId);
                 const responsible = getUserById(team.leaderId);
                 
                 return (
                   <motion.div
                     key={team.id}
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200"
                   >
                     <div className="flex items-start justify-between mb-4">
                       <div>
                         <h3 className="font-semibold text-gray-900">{team.name}</h3>
                         <p className="text-sm text-gray-600">{department?.name}</p>
                       </div>
                       <div className="flex items-center space-x-1">
                         <button
                           onClick={() => openModal('team', team)}
                           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                         >
                           <Edit className="h-4 w-4 text-gray-500" />
                         </button>
                         <button
                           onClick={() => handleDelete('team', team.id)}
                           className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 className="h-4 w-4 text-gray-500" />
                         </button>
                       </div>
                     </div>

                     {team.description && (
                       <p className="text-sm text-gray-600 mb-3">{team.description}</p>
                     )}

                     {responsible && (
                       <div className="flex items-center text-sm text-gray-600 mb-3">
                         <UserCog className="h-4 w-4 mr-2 text-gray-400" />
                         <span>Responsável: {responsible.name}</span>
                       </div>
                     )}

                     <div className="flex items-center justify-between">
                       <span className="inline-flex items-center text-sm text-gray-600">
                         <Users className="h-4 w-4 mr-1" />
                         {team.memberIds.length} membros
                       </span>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
         )}

         {activeTab === 'departments' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <AnimatePresence>
               {filteredDepartments.map(dept => {
                 const deptTeams = getTeamsByDepartment(dept.id);
                 const deptUsers = getUsersByDepartment(dept.id);
                 
                 return (
                   <motion.div
                     key={dept.id}
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200"
                   >
                     <div className="flex items-start justify-between mb-4">
                       <div>
                         <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                         {dept.description && (
                           <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                         )}
                       </div>
                       <div className="flex items-center space-x-1">
                         <button
                           onClick={() => openModal('department', dept)}
                           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                         >
                           <Edit className="h-4 w-4 text-gray-500" />
                         </button>
                         <button
                           onClick={() => handleDelete('department', dept.id)}
                           className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 className="h-4 w-4 text-gray-500" />
                         </button>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <div className="flex items-center text-sm text-gray-600">
                         <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                         <span>{deptTeams.length} times</span>
                       </div>
                       <div className="flex items-center text-sm text-gray-600">
                         <Users className="h-4 w-4 mr-2 text-gray-400" />
                         <span>{deptUsers.length} usuários</span>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
         )}
       </div>
     </div>

     {/* Modal */}
     <AnimatePresence>
       {showModal && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onClick={() => setShowModal(false)}
         >
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-gray-800">
                 {editingItem ? 'Editar' : 'Novo'} {modalType === 'department' ? 'Departamento' : modalType === 'team' ? 'Time' : 'Usuário'}
               </h2>
               <button
                 onClick={() => setShowModal(false)}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="h-5 w-5 text-gray-500" />
               </button>
             </div>

             {modalType === 'user' && wizardSteps.length > 0 && (
               <div className="mb-6">
                 <div className="flex items-center justify-between">
                   {wizardSteps.map((step, index) => {
                     const Icon = step.icon;
                     const isActive = step.id === wizardStep;
                     const isPast = getCurrentStepIndex() > index;
                     
                     return (
                       <div key={step.id} className="flex items-center flex-1">
                         <div className="relative flex items-center">
                           <div className={`
                             w-10 h-10 rounded-full flex items-center justify-center transition-all
                             ${isActive ? 'bg-primary-600 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                           `}>
                             {isPast ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                           </div>
                           <span className={`
                             absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap
                             ${isActive ? 'text-primary-600 font-medium' : 'text-gray-500'}
                           `}>
                             {step.label}
                           </span>
                         </div>
                         {index < wizardSteps.length - 1 && (
                           <div className={`
                             flex-1 h-0.5 mx-2 transition-all
                             ${isPast ? 'bg-green-500' : 'bg-gray-200'}
                           `} />
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             <div className="mt-10">
               {modalType === 'user' ? (
                 renderWizardStep()
               ) : modalType === 'team' ? (
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Nome do Time *
                     </label>
                     <input
                       type="text"
                       className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                         formErrors.teamName ? 'border-red-300' : ''
                       }`}
                       value={formData.teamName}
                       onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                     />
                     {formErrors.teamName && (
                       <p className="text-xs text-red-600 mt-1">{formErrors.teamName}</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Departamento *
                     </label>
                     <select
                       className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                         formErrors.department ? 'border-red-300' : ''
                       }`}
                       value={formData.teamDepartmentId}
                       onChange={(e) => setFormData({ ...formData, teamDepartmentId: e.target.value })}
                     >
                       <option value="">Selecione um departamento</option>
                       {departments.map(dept => (
                         <option key={dept.id} value={dept.id}>{dept.name}</option>
                       ))}
                     </select>
                     {formErrors.department && (
                       <p className="text-xs text-red-600 mt-1">{formErrors.department}</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Responsável pelo Time *
                     </label>
                     <select
                       className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                         formErrors.responsible ? 'border-red-300' : ''
                       }`}
                       value={formData.teamResponsibleId}
                       onChange={(e) => setFormData({ ...formData, teamResponsibleId: e.target.value })}
                     >
                       <option value="">Selecione um responsável</option>
                       {users.map(user => (
                         <option key={user.id} value={user.id}>
                           {user.name} - {user.position}
                         </option>
                       ))}
                     </select>
                     {formErrors.responsible && (
                       <p className="text-xs text-red-600 mt-1">{formErrors.responsible}</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Descrição
                     </label>
                     <textarea
                       className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                       rows={3}
                       value={formData.teamDescription}
                       onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Membros do Time *
                     </label>
                     <div className={`border rounded-lg overflow-hidden ${
                       formErrors.members ? 'border-red-300' : 'border-gray-200'
                     }`}>
                       <div className="max-h-48 overflow-y-auto p-2">
                         {users.map(user => (
                           <label
                             key={user.id}
                             className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                           >
                             <input
                               type="checkbox"
                               className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                               checked={formData.teamMemberIds.includes(user.id)}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setFormData({ 
                                     ...formData, 
                                     teamMemberIds: [...formData.teamMemberIds, user.id]
                                   });
                                 } else {
                                   setFormData({ 
                                     ...formData, 
                                     teamMemberIds: formData.teamMemberIds.filter(id => id !== user.id)
                                   });
                                 }
                               }}
                             />
                             <span className="ml-2 text-sm">
                               {user.name} - {user.position}
                             </span>
                           </label>
                         ))}
                       </div>
                     </div>
                     {formErrors.members && (
                       <p className="text-xs text-red-600 mt-1">{formErrors.members}</p>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Nome do Departamento *
                     </label>
                     <input
                       type="text"
                       className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                         formErrors.departmentName ? 'border-red-300' : ''
                       }`}
                       value={formData.departmentName}
                       onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                     />
                     {formErrors.departmentName && (
                       <p className="text-xs text-red-600 mt-1">{formErrors.departmentName}</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Descrição
                     </label>
                     <textarea
                       className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                       rows={3}
                       value={formData.departmentDescription}
                       onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Metas e Objetivos
                     </label>
                     <textarea
                       className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                       rows={3}
                       value={formData.departmentGoals}
                       onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
                     />
                   </div>
                 </div>
               )}
             </div>

             <div className="flex justify-between mt-6">
               {modalType === 'user' && wizardStep !== 'type' ? (
                 <Button
                   variant="outline"
                   onClick={handlePreviousStep}
                   icon={<ChevronLeft size={18} />}
                 >
                   Voltar
                 </Button>
               ) : (
                 <div />
               )}

               <div className="flex space-x-3">
                 <Button
                   variant="outline"
                   onClick={() => setShowModal(false)}
                 >
                   Cancelar
                 </Button>
                 {modalType === 'user' && wizardStep !== 'review' ? (
                   <Button
                     variant="primary"
                     onClick={handleNextStep}
                     icon={<ChevronRight size={18} />}
                   >
                     Próximo
                   </Button>
                 ) : (
                   <Button
                     variant="primary"
                     onClick={handleSubmit}
                     icon={<Check size={18} />}
                   >
                     {editingItem ? 'Salvar' : 'Cadastrar'}
                   </Button>
                 )}
               </div>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
};

export default UserManagement;