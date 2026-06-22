import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUserRole } from '../../context/AuthContext';
import { competencyService } from '../../services/competency.service';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Award, Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

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
    is_active: true,
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
      setCompetencies(
        (data || []).sort(
          (a: OrganizationalCompetency, b: OrganizationalCompetency) => a.position - b.position,
        ),
      );
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
      is_active: competency.is_active,
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      position: competencies.length + 1,
      is_active: true,
    });
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      position: competencies.length + 1,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    if (!editingId && competencies.length >= 4) {
      toast.error('O máximo de competências organizacionais é 4');
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
    if (
      !confirm('Tem certeza que deseja excluir esta competência? Esta ação não pode ser desfeita.')
    ) {
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

      toast.success(competency.is_active ? 'Competência desativada' : 'Competência ativada');
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              <Award className="h-7 w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime" />
              Código Cultural
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as competências organizacionais que definem a cultura da empresa
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-lime/20 text-lime-deep dark:text-lime border border-lime/30">
                {competencies.length}{' '}
                {competencies.length === 1 ? 'competência cadastrada' : 'competências cadastradas'}
              </span>
              {competencies.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
                  {competencies.filter((c) => c.is_active).length} ativas
                </span>
              )}
            </div>
          </div>

          {!showAddForm && !editingId && competencies.length < 4 && (
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
            className="bg-card rounded-xl shadow-sm border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-lime-deep dark:text-lime" />
                  <h2 className="text-lg font-semibold text-foreground">Editar Competência</h2>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-lime-deep dark:text-lime" />
                  <h2 className="text-lg font-semibold text-foreground">Nova Competência</h2>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Nome da Competência *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-all"
                  placeholder="Ex: Meritocracia e Missão Compartilhada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-all resize-none"
                  placeholder="Descreva o que esta competência significa..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length} caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Posição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Define a ordem nas avaliações
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-[#D2FF00] transition-colors bg-secondary">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-lime border-border rounded focus:ring-[#D2FF00]/20"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-muted-foreground">
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
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-lime-deep dark:text-lime" />
            Competências Cadastradas
          </h2>

          {competencies.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-1">
                Nenhuma competência organizacional cadastrada
              </p>
              <p className="text-sm text-muted-foreground">
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
                      ? 'border-[#D2FF00] bg-lime/10'
                      : competency.is_active
                        ? 'border-border bg-secondary hover:border-[#D2FF00]'
                        : 'border-border bg-secondary opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-lime/20">
                        <span className="text-lime-deep dark:text-lime font-bold text-sm">
                          {competency.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-2">{competency.name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {competency.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(competency)}
                            className="p-2 text-lime-deep dark:text-lime hover:bg-accent rounded-lg transition-colors"
                            title="Editar competência"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(competency.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
      <div className="bg-lime/10 border border-lime/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-lime-deep dark:text-lime flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                As competências organizacionais definidas aqui serão utilizadas em todas as
                avaliações
              </li>
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
