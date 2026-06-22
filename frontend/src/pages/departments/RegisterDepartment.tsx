import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseUsers, useSupabaseDepartments } from '../../hooks/useSupabaseData';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Building, Sparkles, AlertCircle, ChevronDown, Save, Loader2 } from 'lucide-react';

const RegisterDepartment = () => {
  const navigate = useNavigate();

  // Hooks do Supabase
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { loading: depsLoading, createDepartment, reload: reloadDeps } = useSupabaseDepartments();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentDescription: '',
    departmentResponsibleId: '',
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

    if (!formData.departmentName.trim())
      errors.departmentName = 'Nome do departamento é obrigatório';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await createDepartment({
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim() || null,
        responsible_id: formData.departmentResponsibleId || null,
      });

      await reloadDeps();
      toast.success('Departamento cadastrado com sucesso!');

      setFormData({
        departmentName: '',
        departmentDescription: '',
        departmentResponsibleId: '',
      });

      setTimeout(() => {
        navigate('/departments');
      }, 1500);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao processar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  if (usersLoading || depsLoading) {
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
              <Building className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Cadastrar Departamento
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Crie novos departamentos para estruturar a organização
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
            <Building className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
            Informações do Departamento
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome do Departamento *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border transition-all bg-secondary text-foreground placeholder:text-muted-foreground ${
                  formErrors.departmentName
                    ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                    : 'border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background'
                }`}
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="Ex: Vendas"
              />
              {formErrors.departmentName && (
                <p className="text-sm text-destructive mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.departmentName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Responsável pelo Departamento (Opcional)
              </label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <select
                  className="w-full pl-12 pr-10 py-3 rounded-lg border transition-all appearance-none bg-secondary text-foreground border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background"
                  value={formData.departmentResponsibleId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentResponsibleId: e.target.value })
                  }
                >
                  <option value="">Sem responsável</option>
                  {users
                    .filter((u) => !u.is_admin && u.is_director)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.position}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descrição do Departamento
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border transition-all bg-secondary text-foreground placeholder:text-muted-foreground border-border focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background"
                rows={4}
                value={formData.departmentDescription}
                onChange={(e) =>
                  setFormData({ ...formData, departmentDescription: e.target.value })
                }
                placeholder="Descreva as responsabilidades e objetivos do departamento..."
              />
            </div>
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
            onClick={() => navigate('/departments')}
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
            {isLoading ? 'Salvando...' : 'Salvar Departamento'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterDepartment;
