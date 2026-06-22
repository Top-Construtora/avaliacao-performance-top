import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  useSupabaseUsers,
  useSupabaseTeams,
  useSupabaseDepartments,
} from '../../hooks/useSupabaseData';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Building2,
  Crown,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Save,
  Loader2,
} from 'lucide-react';

const RegisterTeam = () => {
  const navigate = useNavigate();

  // Hooks do Supabase
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { loading: teamsLoading, createTeam, reload: reloadTeams } = useSupabaseTeams();
  const { departments, loading: depsLoading } = useSupabaseDepartments();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    teamName: '',
    teamDepartmentId: '',
    teamResponsibleId: '',
    teamMemberIds: [] as string[],
    teamDescription: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.teamName.trim()) errors.teamName = 'Nome do time é obrigatório';
    if (!formData.teamDepartmentId) errors.department = 'Selecione um departamento';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Se tem responsável, adicionar aos membros se não estiver
      if (
        formData.teamResponsibleId &&
        !formData.teamMemberIds.includes(formData.teamResponsibleId)
      ) {
        formData.teamMemberIds.push(formData.teamResponsibleId);
      }

      await createTeam({
        name: formData.teamName.trim(),
        department_id: formData.teamDepartmentId,
        responsible_id: formData.teamResponsibleId || null,
        description: formData.teamDescription.trim() || null,
      });

      await reloadTeams();
      toast.success('Time cadastrado com sucesso!');

      setFormData({
        teamName: '',
        teamDepartmentId: '',
        teamResponsibleId: '',
        teamMemberIds: [],
        teamDescription: '',
      });

      setTimeout(() => {
        navigate('/teams');
      }, 1500);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao processar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  if (usersLoading || teamsLoading || depsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Cadastrar Time
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Crie novos times para organizar colaboradores e projetos
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-2xl p-6 shadow-sm dark:shadow-lg border border-border"
        >
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
            Informações do Time
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-2">
                Nome do Time *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border transition-all bg-secondary text-foreground placeholder:text-muted-foreground ${
                  formErrors.teamName
                    ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                    : 'border-border hover:border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background'
                }`}
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="Ex: Time de Vendas Norte"
              />
              {formErrors.teamName && (
                <p className="text-sm text-destructive mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.teamName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-2">
                Departamento *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border transition-all appearance-none bg-secondary text-foreground ${
                    formErrors.department
                      ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                      : 'border-border hover:border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background'
                  }`}
                  value={formData.teamDepartmentId}
                  onChange={(e) => setFormData({ ...formData, teamDepartmentId: e.target.value })}
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.department && (
                <p className="text-sm text-destructive mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.department}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-2">
                Responsável pelo Time (Opcional)
              </label>
              <div className="relative">
                <Crown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <select
                  className="w-full pl-12 pr-10 py-3 rounded-lg border transition-all appearance-none bg-secondary text-foreground border-border hover:border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background"
                  value={formData.teamResponsibleId}
                  onChange={(e) => setFormData({ ...formData, teamResponsibleId: e.target.value })}
                >
                  <option value="">Sem responsável</option>
                  {users
                    .filter((u) => !u.is_admin && (u.is_leader || u.is_director))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.position}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-2">
                Descrição do Time
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border transition-all bg-secondary text-foreground placeholder:text-muted-foreground border-border hover:border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background"
                rows={4}
                value={formData.teamDescription}
                onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
                placeholder="Descreva os objetivos e responsabilidades do time..."
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-2xl p-6 shadow-sm dark:shadow-lg border border-border"
        >
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
            Membros do Time (Opcional)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você pode adicionar membros agora ou depois de criar o time
          </p>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
            {users
              .filter((u) => !u.is_admin)
              .map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all group ${
                    formData.teamMemberIds.includes(user.id)
                      ? 'bg-lime/10 border-2 border-lime'
                      : 'bg-secondary border-2 border-border hover:border-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-border text-foreground focus:ring-[#D2FF00]/20"
                    checked={formData.teamMemberIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          teamMemberIds: [...formData.teamMemberIds, user.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          teamMemberIds: formData.teamMemberIds.filter((id) => id !== user.id),
                        });
                      }
                    }}
                  />
                  <div className="ml-4 flex-1">
                    <span className="font-medium text-foreground block">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.position}</span>
                  </div>
                  {formData.teamMemberIds.includes(user.id) && (
                    <CheckCircle2 className="h-5 w-5 text-lime-deep dark:text-lime ml-2" />
                  )}
                </label>
              ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="bg-card rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/teams')}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
            icon={
              isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )
            }
          >
            {isLoading ? 'Salvando...' : 'Salvar Time'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterTeam;
