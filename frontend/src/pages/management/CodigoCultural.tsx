import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUserRole } from '../../context/AuthContext';
import { competencyService } from '../../services/competency.service';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';

interface OrganizationalCompetency {
  id: string;
  name: string;
  description: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompetencyFormData {
  id?: string;
  name: string;
  description: string;
  position: number;
  is_active: boolean;
}

const CodigoCultural = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isAdmin, isDirector } = useUserRole();
  const [competencies, setCompetencies] = useState<OrganizationalCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: '',
    description: '',
    position: 1,
    is_active: true
  });

  // Verificar se o usuário tem permissão
  useEffect(() => {
    if (!isAdmin && !isDirector) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/');
    }
  }, [isAdmin, isDirector, navigate]);

  // Carregar competências
  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    try {
      setLoading(true);
      const data = await competencyService.getOrganizationalCompetencies();
      setCompetencies(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar competências:', error);
      toast.error('Erro ao carregar competências organizacionais');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (competency: OrganizationalCompetency) => {
    setEditingId(competency.id);
    setFormData({
      id: competency.id,
      name: competency.name,
      description: competency.description,
      position: competency.position,
      is_active: competency.is_active
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      position: competencies.length + 1,
      is_active: true
    });
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      position: competencies.length + 1,
      is_active: true
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Atualizar existente
        await competencyService.updateOrganizationalCompetency(editingId, {
          name: formData.name,
          description: formData.description,
        });
        toast.success('Competência atualizada com sucesso!');
      } else {
        // Criar nova
        await competencyService.createOrganizationalCompetency({
          name: formData.name,
          description: formData.description,
        });
        toast.success('Competência criada com sucesso!');
      }

      handleCancelEdit();
      setShowAddForm(false);
      loadCompetencies();
    } catch (error: any) {
      console.error('Erro ao salvar competência:', error);
      toast.error(error.message || 'Erro ao salvar competência');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta competência? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await competencyService.deleteOrganizationalCompetency(id);
      toast.success('Competência excluída com sucesso!');
      loadCompetencies();
    } catch (error: any) {
      console.error('Erro ao excluir competência:', error);
      toast.error('Erro ao excluir competência');
    }
  };

  const toggleActive = async (competency: OrganizationalCompetency) => {
    try {
      await competencyService.updateOrganizationalCompetency(competency.id, {
        is_active: !competency.is_active,
      });

      toast.success(
        competency.is_active
          ? 'Competência desativada'
          : 'Competência ativada'
      );
      loadCompetencies();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da competência');
    }
  };

  if (loading) {
    return <LoadingSpinner minHeight="min-h-[60vh]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <Award className="h-7 w-7 lg:h-8 lg:w-8 text-primary-00 dark:text-primary-700" />
              Código Cultural
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie as competências organizacionais que definem a cultura da empresa
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-600/30 text-primary-00 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
                {competencies.length} {competencies.length === 1 ? 'competência cadastrada' : 'competências cadastradas'}
              </span>
              {competencies.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  {competencies.filter(c => c.is_active).length} ativas
                </span>
              )}
            </div>
          </div>

          {!showAddForm && !editingId && (
            <Button
              variant="primary"
              onClick={handleShowAddForm}
              icon={<Plus size={18} />}
              size="lg"
            >
              Nova Competência
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(showAddForm || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-primary-00 dark:text-primary-700" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Editar Competência
                  </h2>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary-00 dark:text-primary-700" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Nova Competência
                  </h2>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Competência *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-primary-00 dark:focus:border-primary-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  placeholder="Ex: Meritocracia e Missão Compartilhada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-primary-00 dark:focus:border-primary-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all resize-none"
                  placeholder="Descreva o que esta competência significa..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length} caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Posição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-primary-00 dark:focus:border-primary-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Define a ordem nas avaliações
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 transition-colors bg-white dark:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-primary-00 border-gray-300 rounded focus:ring-primary-800 dark:border-gray-600 dark:focus:ring-primary-700"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Competência ativa
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={showAddForm ? () => setShowAddForm(false) : handleCancelEdit}
                  icon={<X size={18} />}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || !formData.name.trim() || !formData.description.trim()}
                  icon={<Save size={18} />}
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competencies List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-00 dark:text-primary-700" />
            Competências Cadastradas
          </h2>

          {competencies.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                Nenhuma competência organizacional cadastrada
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Clique em "Nova Competência" para adicionar a primeira
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {competencies.map((competency, index) => (
                <motion.div
                  key={competency.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    editingId === competency.id
                      ? 'border-primary-00 dark:border-primary-700 bg-primary-50 dark:bg-primary-600/20'
                      : competency.is_active
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-600'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-600/30">
                        <span className="text-primary-00 dark:text-primary-300 font-bold text-sm">
                          {competency.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {competency.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {competency.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(competency)}
                            className="p-2 text-primary-900 dark:text-primary-700 hover:bg-primary-100 dark:hover:bg-primary-600/20 rounded-lg transition-colors"
                            title="Editar competência"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(competency.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir competência"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>As competências organizacionais definidas aqui serão utilizadas em todas as avaliações</li>
              <li>Competências inativas não aparecerão nos formulários de avaliação</li>
              <li>A posição define a ordem em que aparecem nas avaliações</li>
              <li>Ao editar uma competência, as avaliações futuras usarão a nova versão</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CodigoCultural;
