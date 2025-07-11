import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from './Button';
import {
  DollarSign, GitBranch, Briefcase, Target, TrendingUp,
  Save, X, Info, Calendar, Award, ArrowRight, Clock,
  FileText, AlertCircle, UserRound
} from 'lucide-react';
import { salaryService, CareerTrack, TrackPosition, SalaryLevel, UserSalaryInfo } from '../services/salary.service';
import { User } from '../types/supabase';

interface UserSalaryAssignmentProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const UserSalaryAssignment = ({ user, isOpen, onClose, onUpdate }: UserSalaryAssignmentProps) => {
  const [loading, setLoading] = useState(false);
  const [currentSalaryInfo, setCurrentSalaryInfo] = useState<UserSalaryInfo | null>(null);
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [trackPositions, setTrackPositions] = useState<TrackPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [salaryLevels, setSalaryLevels] = useState<SalaryLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [calculatedSalary, setCalculatedSalary] = useState<number | null>(null);
  const [possibleProgressions, setPossibleProgressions] = useState<any[]>([]);
  const [progressionHistory, setProgressionHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assign' | 'progress' | 'history'>('assign');

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserData();
      loadFormData();
    }
  }, [isOpen, user.id]);

  useEffect(() => {
    if (selectedTrack) {
      loadTrackPositions(selectedTrack);
    }
  }, [selectedTrack]);

  useEffect(() => {
    if (selectedPosition && selectedLevel) {
      calculateNewSalary();
    }
  }, [selectedPosition, selectedLevel]);

  const loadUserData = async () => {
    try {
      const [salaryInfo, progressions, history] = await Promise.all([
        salaryService.getUserSalaryInfo(user.id),
        salaryService.getUserPossibleProgressions(user.id),
        salaryService.getUserProgressionHistory(user.id)
      ]);
      
      setCurrentSalaryInfo(salaryInfo);
      setPossibleProgressions(progressions);
      setProgressionHistory(history);
      
      // Se o usuário já tem um nível, pré-selecionar
      if (salaryInfo.salary_level) {
        const level = salaryLevels.find(l => l.name === salaryInfo.salary_level);
        if (level) setSelectedLevel(level.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadFormData = async () => {
    try {
      const [tracksData, levelsData] = await Promise.all([
        salaryService.getTracks(),
        salaryService.getLevels()
      ]);
      setTracks(tracksData.filter(t => t.active));
      setSalaryLevels(levelsData.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const loadTrackPositions = async (trackId: string) => {
    try {
      const positions = await salaryService.getPositionsByTrack(trackId);
      setTrackPositions(positions.sort((a, b) => a.order_index - b.order_index));
      setSelectedPosition('');
      setCalculatedSalary(null);
    } catch (error) {
      toast.error('Erro ao carregar cargos da trilha');
    }
  };

  const calculateNewSalary = async () => {
    try {
      const result = await salaryService.calculateSalary(selectedPosition, selectedLevel);
      setCalculatedSalary(result.calculatedSalary);
    } catch (error) {
      console.error('Erro ao calcular salário:', error);
    }
  };

  const handleAssignToTrack = async () => {
    if (!selectedPosition || !selectedLevel) {
      toast.error('Selecione um cargo e um internível');
      return;
    }

    setLoading(true);
    try {
      await salaryService.assignUserToTrack(user.id, selectedPosition, selectedLevel);
      toast.success('Colaborador atribuído à trilha com sucesso!');
      onUpdate?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao atribuir colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleProgression = async (progressionId: string, type: string) => {
    const progression = possibleProgressions.find(p => p.rule_id === progressionId);
    if (!progression) return;

    if (!confirm(`Confirma a progressão para ${progression.to_position_name}?`)) return;

    setLoading(true);
    try {
      await salaryService.progressUser(user.id, {
        toTrackPositionId: progression.to_position_id,
        toSalaryLevelId: selectedLevel || currentSalaryInfo?.salary_level || '',
        progressionType: type as any,
        reason: `Progressão ${type === 'vertical' ? 'vertical' : type === 'horizontal' ? 'horizontal' : 'por mérito'}`
      });
      toast.success('Progressão realizada com sucesso!');
      loadUserData();
      onUpdate?.();
    } catch (error) {
      toast.error('Erro ao realizar progressão');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary-500" />
              Gestão Salarial - {user.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user.position} • {user.contract_type || 'CLT'}
            </p>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Info atual */}
        {currentSalaryInfo && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cargo Atual</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSalaryInfo.position_name || 'Não definido'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Classe/Nível</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSalaryInfo.class_code ? 
                    `Classe ${currentSalaryInfo.class_code} - Nível ${currentSalaryInfo.salary_level}` : 
                    'Não definido'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Salário Atual</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSalaryInfo.current_salary ? 
                    formatCurrency(currentSalaryInfo.current_salary) : 
                    'Não definido'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'assign', label: 'Atribuir Trilha', icon: GitBranch },
            { id: 'progress', label: 'Progressões', icon: TrendingUp },
            { id: 'history', label: 'Histórico', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'assign' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trilha de Carreira
              </label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Selecione uma trilha</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name} {track.department?.name && `(${track.department.name})`}
                  </option>
                ))}
              </select>
            </div>

            {trackPositions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo na Trilha
                </label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Selecione um cargo</option>
                  {trackPositions.map(pos => (
                    <option key={pos.id} value={pos.id}>
                      {pos.position?.name} - Classe {pos.class?.code} ({formatCurrency(pos.base_salary)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internível
              </label>
              <div className="grid grid-cols-5 gap-2">
                {salaryLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedLevel === level.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {level.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      +{level.percentage}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {calculatedSalary && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      Novo Salário Calculado
                    </p>
                    <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                      {formatCurrency(calculatedSalary)}
                    </p>
                  </div>
                  {currentSalaryInfo?.current_salary && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Diferença
                      </p>
                      <p className={`font-medium ${
                        calculatedSalary > currentSalaryInfo.current_salary
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {calculatedSalary > currentSalaryInfo.current_salary ? '+' : ''}
                        {formatCurrency(calculatedSalary - currentSalaryInfo.current_salary)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleAssignToTrack}
                disabled={!selectedPosition || !selectedLevel || loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Atribuição
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            {possibleProgressions.length > 0 ? (
              possibleProgressions.map(prog => (
                <div
                  key={prog.rule_id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {prog.to_position_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        De: {prog.from_position_name} → Para: Classe {prog.to_class_code}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {prog.min_time_months || 0} meses
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Nota mínima: {prog.performance_requirement || 'N/A'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          prog.progression_type === 'vertical'
                            ? 'bg-blue-100 text-blue-700'
                            : prog.progression_type === 'horizontal'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {prog.progression_type_label}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleProgression(prog.rule_id, prog.progression_type)}
                      disabled={loading}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Promover
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma progressão disponível no momento.</p>
                <p className="text-sm mt-2">
                  O colaborador precisa estar atribuído a uma trilha primeiro.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {progressionHistory.length > 0 ? (
              progressionHistory.map((hist, index) => (
                <motion.div
                  key={hist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary-500" />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {hist.to_position?.position?.name || 'Cargo'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {hist.from_position?.position?.name || 'Sem cargo anterior'} → 
                        Classe {hist.to_position?.class?.code}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(hist.progression_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(hist.to_salary)}
                        </span>
                        {hist.approver && (
                          <span className="flex items-center gap-1">
                            <UserRound className="h-4 w-4" />
                            {hist.approver.name}
                          </span>
                        )}
                      </div>
                      {hist.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                          "{hist.reason}"
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      hist.progression_type === 'vertical'
                        ? 'bg-blue-100 text-blue-700'
                        : hist.progression_type === 'horizontal'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {hist.progression_type === 'vertical' ? 'Vertical' :
                       hist.progression_type === 'horizontal' ? 'Horizontal' : 'Mérito'}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum histórico de progressão encontrado.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserSalaryAssignment;