import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Sparkles, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { culturalCodeService, CulturalCodeSection } from '../../services/culturalCode.service';
import { useUserRole } from '../../context/AuthContext';

const inputClass =
  'w-full rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3';

interface DraftForm {
  title: string;
  description: string;
}

const emptyDraft: DraftForm = { title: '', description: '' };

const CulturalCode = () => {
  const { isDirector, isAdmin } = useUserRole();
  const canManage = isDirector || isAdmin;

  const [sections, setSections] = useState<CulturalCodeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulários inline (um de cada tipo aberto por vez)
  const [showNewSection, setShowNewSection] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<DraftForm>(emptyDraft);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<DraftForm>(emptyDraft);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await culturalCodeService.getAll();
      setSections(data);
    } catch {
      toast.error('Erro ao carregar o Código Cultural');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const closeForms = () => {
    setShowNewSection(false);
    setEditingSectionId(null);
    setAddingItemTo(null);
    setEditingItemId(null);
    setSectionDraft(emptyDraft);
    setItemDraft(emptyDraft);
  };

  const handleSaveSection = async () => {
    if (!sectionDraft.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    try {
      setSaving(true);
      if (editingSectionId) {
        await culturalCodeService.updateSection(editingSectionId, {
          title: sectionDraft.title.trim(),
          description: sectionDraft.description.trim() || null,
        } as any);
        toast.success('Seção atualizada');
      } else {
        await culturalCodeService.createSection({
          title: sectionDraft.title.trim(),
          description: sectionDraft.description.trim() || undefined,
        });
        toast.success('Seção criada');
      }
      closeForms();
      await load();
    } catch {
      toast.error('Erro ao salvar seção');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Excluir esta seção e todos os seus itens?')) return;
    try {
      await culturalCodeService.deleteSection(id);
      toast.success('Seção excluída');
      await load();
    } catch {
      toast.error('Erro ao excluir seção');
    }
  };

  const handleMoveSection = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const a = sections[index];
    const b = sections[target];
    try {
      await Promise.all([
        culturalCodeService.updateSection(a.id, { order_index: b.order_index }),
        culturalCodeService.updateSection(b.id, { order_index: a.order_index }),
      ]);
      await load();
    } catch {
      toast.error('Erro ao reordenar');
    }
  };

  const handleSaveItem = async (sectionId: string) => {
    if (!itemDraft.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    try {
      setSaving(true);
      if (editingItemId) {
        await culturalCodeService.updateItem(editingItemId, {
          title: itemDraft.title.trim(),
          description: itemDraft.description.trim() || null,
        } as any);
        toast.success('Item atualizado');
      } else {
        await culturalCodeService.createItem({
          section_id: sectionId,
          title: itemDraft.title.trim(),
          description: itemDraft.description.trim() || undefined,
        });
        toast.success('Item adicionado');
      }
      closeForms();
      await load();
    } catch {
      toast.error('Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Excluir este item?')) return;
    try {
      await culturalCodeService.deleteItem(id);
      toast.success('Item excluído');
      await load();
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  // Funções de render (NÃO componentes): se fossem componentes definidos aqui
  // dentro, cada re-render criaria um tipo novo e o React remontaria os inputs,
  // fazendo-os perder o foco a cada tecla.
  const renderSectionForm = (onCancel: () => void) => (
    <div className="p-4 bg-secondary rounded-xl border border-border space-y-3">
      <input
        type="text"
        value={sectionDraft.title}
        onChange={(e) => setSectionDraft((d) => ({ ...d, title: e.target.value }))}
        placeholder="Título da seção (ex: Valores, Missão, Nossos Rituais...)"
        className={inputClass}
        autoFocus
      />
      <textarea
        value={sectionDraft.description}
        onChange={(e) => setSectionDraft((d) => ({ ...d, description: e.target.value }))}
        placeholder="Descrição da seção (opcional)..."
        rows={2}
        className={`${inputClass} resize-none`}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={handleSaveSection} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );

  const renderItemForm = (sectionId: string, onCancel: () => void) => (
    <div className="p-4 bg-card rounded-xl border border-border space-y-3">
      <input
        type="text"
        value={itemDraft.title}
        onChange={(e) => setItemDraft((d) => ({ ...d, title: e.target.value }))}
        placeholder="Título (ex: Integridade)"
        className={inputClass}
        autoFocus
      />
      <textarea
        value={itemDraft.description}
        onChange={(e) => setItemDraft((d) => ({ ...d, description: e.target.value }))}
        placeholder="Descrição (opcional)..."
        rows={3}
        className={`${inputClass} resize-none`}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSaveItem(sectionId)}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Código Cultural
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              O que nos define: valores, princípios e o jeito de ser da empresa
            </p>
          </div>
          {canManage && !showNewSection && (
            <Button
              variant="primary"
              onClick={() => {
                closeForms();
                setShowNewSection(true);
              }}
              icon={<Plus size={18} />}
            >
              Nova Seção
            </Button>
          )}
        </div>
        {canManage && showNewSection && <div className="mt-6">{renderSectionForm(closeForms)}</div>}
      </motion.div>

      {/* Seções */}
      {sections.length === 0 && !showNewSection ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            O Código Cultural ainda não foi cadastrado
          </h3>
          <p className="text-muted-foreground">
            {canManage
              ? 'Crie a primeira seção (ex: Valores, Missão) e adicione os itens.'
              : 'Em breve você encontrará aqui os valores e princípios da empresa.'}
          </p>
        </div>
      ) : (
        sections.map((section, sIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIndex * 0.05 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            {editingSectionId === section.id ? (
              renderSectionForm(closeForms)
            ) : (
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {section.description}
                    </p>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveSection(sIndex, -1)}
                      disabled={sIndex === 0}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(sIndex, 1)}
                      disabled={sIndex === sections.length - 1}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        closeForms();
                        setEditingSectionId(section.id);
                        setSectionDraft({
                          title: section.title,
                          description: section.description || '',
                        });
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime"
                      title="Editar seção"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive"
                      title="Excluir seção"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Itens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.items.map((item) =>
                editingItemId === item.id ? (
                  <div key={item.id} className="md:col-span-2">
                    {renderItemForm(section.id, closeForms)}
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="group relative p-4 bg-secondary rounded-xl border border-border hover:border-[#D2FF00]/40 transition-colors"
                  >
                    <h3 className="font-semibold text-foreground pr-14">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {canManage && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            closeForms();
                            setEditingItemId(item.id);
                            setItemDraft({
                              title: item.title,
                              description: item.description || '',
                            });
                          }}
                          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive"
                          title="Excluir"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>

            {/* Adicionar item */}
            {canManage &&
              (addingItemTo === section.id ? (
                <div className="mt-3">{renderItemForm(section.id, closeForms)}</div>
              ) : (
                <button
                  onClick={() => {
                    closeForms();
                    setAddingItemTo(section.id);
                  }}
                  className="mt-3 text-sm text-lime-deep dark:text-lime hover:opacity-80 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Adicionar item
                </button>
              ))}
          </motion.div>
        ))
      )}
    </div>
  );
};

export default CulturalCode;
