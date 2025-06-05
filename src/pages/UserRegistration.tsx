import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
  Users, Plus, Building, FilePlus, Shield, Mail, Calendar, 
  X, Check, AlertCircle, Briefcase, UserCheck, UsersIcon, 
  Sparkles, Crown, User, Phone, CalendarDays, Camera, Upload,
  GitBranch, Network, ArrowLeft, Eye, EyeOff, UserCog, Save
} from 'lucide-react';

type TabType = 'user' | 'team' | 'department';

const UserRegistration = () => {
  const navigate = useNavigate();
  const { 
    users, teams, departments, addUser, addTeam, addDepartment,
    getUserById, getTeamById, getDepartmentById,
    addHierarchicalRelation, calculateAge
  } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('user');
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (activeTab === 'user') {
      if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
      if (!formData.email.trim()) errors.email = 'Email é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido';
      }
      if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
      if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
      if (formData.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.phone)) {
        errors.phone = 'Telefone inválido';
      }
      if (formData.birthDate) {
        const age = calculateAge(formData.birthDate);
        if (age < 16) errors.birthDate = 'Idade mínima: 16 anos';
        if (age > 100) errors.birthDate = 'Data de nascimento inválida';
      }
      if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
        errors.teams = 'Selecione pelo menos um time';
      }
      if (formData.profileType === 'regular' && !formData.reportsTo) {
        errors.reportsTo = 'Selecione um líder';
      }
    } else if (activeTab === 'team') {
      if (!formData.teamName.trim()) errors.teamName = 'Nome do time é obrigatório';
      if (!formData.teamDepartmentId) errors.department = 'Selecione um departamento';
      if (!formData.teamResponsibleId) errors.responsible = 'Selecione um responsável';
      if (formData.teamMemberIds.length === 0) errors.members = 'Selecione pelo menos um membro';
    } else if (activeTab === 'department') {
      if (!formData.departmentName.trim()) errors.departmentName = 'Nome do departamento é obrigatório';
      if (!formData.departmentResponsibleId) errors.responsible = 'Selecione um responsável';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (activeTab === 'user') {
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
        joinDate: new Date().toISOString().split('T')[0],
        active: true,
        phone: formData.phone,
        birthDate: formData.birthDate,
        profileImage: formData.profileImage,
        reportsTo: formData.reportsTo || undefined,
        directReports: [],
      };

      addUser({ ...userData, profileImage: userData.profileImage ?? undefined });
      
      if (formData.reportsTo) {
        const teamId = formData.teamIds[0] || teams[0].id;
        const newUserId = `user${Date.now()}`;
        setTimeout(() => {
          addHierarchicalRelation({
            leaderId: formData.reportsTo,
            subordinateId: newUserId
          });
        }, 100);
      }

      toast.success('Usuário cadastrado com sucesso!');
    } else if (activeTab === 'team') {
      if (!formData.teamMemberIds.includes(formData.teamResponsibleId)) {
        formData.teamMemberIds.push(formData.teamResponsibleId);
      }

      const teamData = {
        name: formData.teamName.trim(),
        departmentId: formData.teamDepartmentId,
        leaderId: formData.teamResponsibleId,
        memberIds: formData.teamMemberIds,
        description: formData.teamDescription.trim(),
        createdAt: new Date().toISOString(),
      };

      addTeam(teamData);
      toast.success('Time cadastrado com sucesso!');
    } else if (activeTab === 'department') {
      const departmentData = {
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim(),
        goals: formData.departmentGoals.trim(),
      };

      addDepartment(departmentData);
      toast.success('Departamento cadastrado com sucesso!');
    }

    // Reset form
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
    setFormErrors({});
  };

  const renderUserForm = () => (
    <div className="space-y-6">
      {/* Profile Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Usuário
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="p-2 rounded-lg bg-gray-100 mr-3">
                <UserCheck className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Colaborador</p>
                <p className="text-xs text-gray-600">Membro da equipe</p>
              </div>
            </div>
            {formData.profileType === 'regular' && (
              <Check className="h-4 w-4 text-primary-600" />
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
              <div className="p-2 rounded-lg bg-primary-100 mr-3">
                <Crown className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Líder</p>
                <p className="text-xs text-gray-600">Lidera equipes</p>
              </div>
            </div>
            {formData.profileType === 'leader' && (
              <Check className="h-4 w-4 text-primary-600" />
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
              <div className="p-2 rounded-lg bg-purple-100 mr-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Diretor</p>
                <p className="text-xs text-gray-600">Lidera líderes</p>
              </div>
            </div>
            {formData.profileType === 'director' && (
              <Check className="h-4 w-4 text-purple-600" />
            )}
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo *
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {positionTemplates.slice(0, 3).map(template => (
              <button
                key={template.value}
                type="button"
                onClick={() => setFormData({ ...formData, position: template.label })}
                className={`p-2 text-xs rounded-lg border transition-all ${
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
      </div>

      {/* Personal Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de perfil
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
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
                    <X size={12} />
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
      </div>

      {/* Team Assignment */}
      {formData.profileType !== 'director' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alocação em Times</h3>
          
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
                        const responsible = team.responsibleId ? getUserById(team.responsibleId) : undefined;
                        
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
            <p className="text-xs text-red-600 mt-1">{formErrors.teams}</p>
          )}
        </div>
      )}

      {/* Hierarchy */}
      {formData.profileType === 'regular' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hierarquia</h3>
          
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
                .filter(u => (u.isLeader || u.isDirector) && u.id !== formData.email)
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
        </div>
      )}
    </div>
  );

  const renderTeamForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            placeholder="Ex: Backend, Frontend, UX Research"
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
          placeholder="Descreva as responsabilidades e objetivos do time..."
        />
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
          <option value="">Selecione o responsável</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.position}
              {user.isDirector && ' (Diretor)'}
              {user.isLeader && !user.isDirector && ' (Líder)'}
            </option>
          ))}
        </select>
        {formErrors.responsible && (
          <p className="text-xs text-red-600 mt-1">{formErrors.responsible}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Membros do Time *
        </label>
        <div className={`border rounded-lg overflow-hidden ${
          formErrors.members ? 'border-red-300' : 'border-gray-200'
        }`}>
          <div className="max-h-64 overflow-y-auto p-2">
            {users.map(user => {
              const isSelected = formData.teamMemberIds.includes(user.id);
              
              return (
                <label
                  key={user.id}
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
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {user.position}
                      {user.id === formData.teamResponsibleId && (
                        <span className="ml-2 text-primary-600 font-medium">(Responsável)</span>
                      )}
                    </p>
                  </div>
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>
        {formErrors.members && (
          <p className="text-xs text-red-600 mt-1">{formErrors.members}</p>
        )}
      </div>
    </div>
  );

  const renderDepartmentForm = () => (
    <div className="space-y-6">
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
          placeholder="Ex: Engenharia, Design, Comercial"
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
          placeholder="Descreva as responsabilidades do departamento..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objetivos e Metas
        </label>
        <textarea
          className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
          rows={3}
          value={formData.departmentGoals}
          onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
          placeholder="Defina os principais objetivos do departamento..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Responsável pelo Departamento *
        </label>
        <select
          className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
            formErrors.responsible ? 'border-red-300' : ''
          }`}
          value={formData.departmentResponsibleId}
          onChange={(e) => setFormData({ ...formData, departmentResponsibleId: e.target.value })}
        >
          <option value="">Selecione o responsável</option>
          {users.filter(u => u.isLeader || u.isDirector).map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.position}
              {user.isDirector && ' (Diretor)'}
            </option>
          ))}
        </select>
        {formErrors.responsible && (
          <p className="text-xs text-red-600 mt-1">{formErrors.responsible}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FilePlus className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 mr-3" />
              Novo Cadastro
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Cadastre novos usuários, times ou departamentos
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
        {/* Tabs */}
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'user'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4 inline-block mr-2" />
            Usuário
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'team'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UsersIcon className="h-4 w-4 inline-block mr-2" />
            Time
          </button>
          <button
            onClick={() => setActiveTab('department')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'department'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="h-4 w-4 inline-block mr-2" />
            Departamento
          </button>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'user' && (
            <motion.div
              key="user"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderUserForm()}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderTeamForm()}
            </motion.div>
          )}

          {activeTab === 'department' && (
            <motion.div
              key="department"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderDepartmentForm()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/users')}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            icon={<Save size={18} />}
          >
            Salvar {activeTab === 'user' ? 'Usuário' : activeTab === 'team' ? 'Time' : 'Departamento'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;