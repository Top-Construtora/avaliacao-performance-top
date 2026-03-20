import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft, Save, Briefcase, FileText, Users as UsersIcon,
  Plus, Trash2, Calendar, Star, UserPlus, Mail, Phone, Link,
  MessageSquare, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { recruitmentService, JobOpening, JobCandidate } from '../../services/recruitment.service';
import { useSupabaseData } from '../../hooks/useSupabaseData';

const TextareaField = ({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500"
    />
  </div>
);

const candidateStatusConfig: Record<string, { label: string; color: string }> = {
  received: { label: 'Recebido', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  screening: { label: 'Triagem', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  interview_scheduled: { label: 'Entrevista Agendada', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  interviewed: { label: 'Entrevistado', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  approved: { label: 'Aprovado', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  rejected: { label: 'Reprovado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  hired: { label: 'Contratado', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

const RecruitmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { departments } = useSupabaseData();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState<JobOpening | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionsCount, setPositionsCount] = useState(1);
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('CLT');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [priority, setPriority] = useState('normal');

  // Brief
  const [briefReason, setBriefReason] = useState('');
  const [briefExpectedStart, setBriefExpectedStart] = useState('');
  const [briefTeamContext, setBriefTeamContext] = useState('');
  const [briefKeyActivities, setBriefKeyActivities] = useState('');
  const [briefRequiredSkills, setBriefRequiredSkills] = useState('');
  const [briefNiceToHave, setBriefNiceToHave] = useState('');
  const [briefObservations, setBriefObservations] = useState('');

  // Candidatos (só no modo edição)
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateEmail, setNewCandidateEmail] = useState('');
  const [newCandidatePhone, setNewCandidatePhone] = useState('');
  const [newCandidateSource, setNewCandidateSource] = useState('');

  useEffect(() => {
    if (id) loadOpening();
  }, [id]);

  const loadOpening = async () => {
    try {
      setLoading(true);
      const data = await recruitmentService.getJobOpeningById(id!);
      setOpening(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setDepartmentId(data.department_id || '');
      setPositionsCount(data.positions_count);
      setLocation(data.location || '');
      setContractType(data.contract_type || 'CLT');
      setSalaryMin(data.salary_range_min?.toString() || '');
      setSalaryMax(data.salary_range_max?.toString() || '');
      setRequirements(data.requirements || '');
      setBenefits(data.benefits || '');
      setPriority(data.priority || 'normal');
      setBriefReason(data.brief_reason || '');
      setBriefExpectedStart(data.brief_expected_start || '');
      setBriefTeamContext(data.brief_team_context || '');
      setBriefKeyActivities(data.brief_key_activities || '');
      setBriefRequiredSkills(data.brief_required_skills || '');
      setBriefNiceToHave(data.brief_nice_to_have || '');
      setBriefObservations(data.brief_observations || '');
    } catch (error) {
      toast.error('Erro ao carregar vaga');
      navigate('/recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título da vaga é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title, description, department_id: departmentId || null,
        positions_count: positionsCount, location, contract_type: contractType,
        salary_range_min: salaryMin ? Number(salaryMin) : null,
        salary_range_max: salaryMax ? Number(salaryMax) : null,
        requirements, benefits, priority,
        brief_reason: briefReason, brief_expected_start: briefExpectedStart || null,
        brief_team_context: briefTeamContext, brief_key_activities: briefKeyActivities,
        brief_required_skills: briefRequiredSkills, brief_nice_to_have: briefNiceToHave,
        brief_observations: briefObservations,
      };

      if (isEditing) {
        await recruitmentService.updateJobOpening(id!, payload as any);
        toast.success('Vaga atualizada!');
      } else {
        const created = await recruitmentService.createJobOpening(payload as any);
        toast.success('Vaga solicitada com sucesso!');
        navigate(`/recruitment/${created.id}`);
        return;
      }
      loadOpening();
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidateName.trim()) {
      toast.error('Nome do candidato é obrigatório');
      return;
    }
    try {
      await recruitmentService.createCandidate({
        job_opening_id: id!,
        name: newCandidateName,
        email: newCandidateEmail || null,
        phone: newCandidatePhone || null,
        source: newCandidateSource || null,
      });
      toast.success('Candidato adicionado!');
      setNewCandidateName('');
      setNewCandidateEmail('');
      setNewCandidatePhone('');
      setNewCandidateSource('');
      setShowAddCandidate(false);
      loadOpening();
    } catch (error) {
      toast.error('Erro ao adicionar candidato');
    }
  };

  const handleCandidateStatus = async (candidateId: string, status: string) => {
    try {
      await recruitmentService.updateCandidate(candidateId, { status } as any);
      setOpening(prev => prev ? {
        ...prev,
        candidates: prev.candidates?.map(c => c.id === candidateId ? { ...c, status } : c),
      } : null);
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm border border-naue-border-gray dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/recruitment')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <Briefcase className="h-6 w-6 text-primary-700 dark:text-primary-400 mr-2" />
                {isEditing ? title || 'Detalhes da Vaga' : 'Solicitar Nova Vaga'}
              </h1>
              {opening?.requester && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Solicitado por: {opening.requester.name}
                </p>
              )}
            </div>
          </div>
          <Button variant="primary" onClick={handleSave} disabled={saving} icon={<Save size={18} />}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Solicitar Vaga'}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados da Vaga */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm border border-naue-border-gray dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-700 dark:text-primary-400" />
            Descrição da Vaga
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Título da Vaga *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Engenheiro Civil Sênior"
                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Departamento</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">Selecione</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nº de Posições</label>
                <input type="number" min={1} value={positionsCount} onChange={(e) => setPositionsCount(Number(e.target.value))}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo de Contrato</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="INTERN">Estágio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prioridade</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Local</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Escritório SP, Remoto, Híbrido"
                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Salário Mín (R$)</label>
                <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Salário Máx (R$)</label>
                <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
            </div>

            <TextareaField label="Descrição" value={description} onChange={setDescription} placeholder="Descrição detalhada da vaga..." />
            <TextareaField label="Requisitos" value={requirements} onChange={setRequirements} placeholder="Requisitos técnicos e comportamentais..." />
            <TextareaField label="Benefícios" value={benefits} onChange={setBenefits} placeholder="Benefícios oferecidos..." />
          </div>
        </motion.div>

        {/* Brief do Gestor */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm border border-naue-border-gray dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            Brief do Gestor
          </h2>
          <div className="space-y-4">
            <TextareaField label="Motivo da abertura da vaga" value={briefReason} onChange={setBriefReason}
              placeholder="Ex: Expansão da equipe, substituição, novo projeto..." />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Previsão de início</label>
              <input type="date" value={briefExpectedStart} onChange={(e) => setBriefExpectedStart(e.target.value)}
                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>

            <TextareaField label="Contexto da equipe" value={briefTeamContext} onChange={setBriefTeamContext}
              placeholder="Tamanho da equipe, dinâmica, projetos em andamento..." />
            <TextareaField label="Atividades principais do cargo" value={briefKeyActivities} onChange={setBriefKeyActivities}
              placeholder="Quais serão as principais responsabilidades?" />
            <TextareaField label="Habilidades e competências necessárias" value={briefRequiredSkills} onChange={setBriefRequiredSkills}
              placeholder="Hard skills e soft skills obrigatórias..." />
            <TextareaField label="Diferenciais desejáveis" value={briefNiceToHave} onChange={setBriefNiceToHave}
              placeholder="Certificações, experiências, idiomas..." />
            <TextareaField label="Observações adicionais" value={briefObservations} onChange={setBriefObservations}
              placeholder="Qualquer informação relevante para o recrutamento..." />
          </div>
        </motion.div>
      </div>

      {/* Candidatos (só no modo edição) */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm border border-naue-border-gray dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-primary-700 dark:text-primary-400" />
              Candidatos ({opening?.candidates?.length || 0})
            </h2>
            <Button variant="outline" onClick={() => setShowAddCandidate(!showAddCandidate)} icon={<UserPlus size={16} />} size="sm">
              Adicionar
            </Button>
          </div>

          {/* Form de adicionar candidato */}
          {showAddCandidate && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <input type="text" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} placeholder="Nome *"
                  className="rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                <input type="email" value={newCandidateEmail} onChange={(e) => setNewCandidateEmail(e.target.value)} placeholder="Email"
                  className="rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                <input type="text" value={newCandidatePhone} onChange={(e) => setNewCandidatePhone(e.target.value)} placeholder="Telefone"
                  className="rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                <select value={newCandidateSource} onChange={(e) => setNewCandidateSource(e.target.value)}
                  className="rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                  <option value="">Fonte</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indicacao">Indicação</option>
                  <option value="site">Site</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddCandidate(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleAddCandidate} icon={<Plus size={14} />}>Adicionar</Button>
              </div>
            </div>
          )}

          {/* Lista de candidatos */}
          <div className="space-y-2">
            {opening?.candidates?.map(candidate => {
              const statusInfo = candidateStatusConfig[candidate.status] || candidateStatusConfig.received;
              return (
                <div key={candidate.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{candidate.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {candidate.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{candidate.email}</span>}
                      {candidate.source && <span>{candidate.source}</span>}
                    </div>
                  </div>
                  <select
                    value={candidate.status}
                    onChange={(e) => handleCandidateStatus(candidate.id, e.target.value)}
                    className={`text-xs rounded-lg border-0 font-medium px-2 py-1 ${statusInfo.color}`}
                  >
                    {Object.entries(candidateStatusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}

            {(!opening?.candidates || opening.candidates.length === 0) && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum candidato registrado</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RecruitmentForm;
