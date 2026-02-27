import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, Calendar, Info, ChevronDown,
  AlertCircle, Building, Grid3x3, Search, X, Clock
} from 'lucide-react';
import type { EvaluationCycle } from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useEvaluation } from '../hooks/useEvaluation'; // Import useEvaluation to get getNineBoxByEmployeeId

interface LeaderEvaluationHeaderProps {
  currentStep: number;
  currentCycle: EvaluationCycle | null;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  subordinates: UserWithDetails[];
  loading: boolean;
  progress: number;
  periodMessage: { type: 'warning' | 'error', message: string } | null;
  pdiData: any; // PDI data passed from parent
  setPdiData: React.Dispatch<React.SetStateAction<any>>; // Setter for PDI data
  lastSaved?: Date | null; // Timestamp of last auto-save
}

const LeaderEvaluationHeader: React.FC<LeaderEvaluationHeaderProps> = ({
  currentStep,
  currentCycle,
  selectedEmployeeId,
  setSelectedEmployeeId,
  subordinates,
  loading,
  progress,
  periodMessage,
  pdiData,
  setPdiData,
  lastSaved
}) => {
  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);
  const { getNineBoxByEmployeeId } = useEvaluation(); // Get the hook here
  const employeeNineBox = selectedEmployeeId ? getNineBoxByEmployeeId(selectedEmployeeId) : undefined;

  // Search dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter subordinates based on search
  const filteredSubordinates = useMemo(() => {
    if (!searchTerm.trim()) return subordinates;
    const term = searchTerm.toLowerCase();
    return subordinates.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      emp.position.toLowerCase().includes(term)
    );
  }, [subordinates, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };


  const getQuadrantDescription = (quadrant?: string) => {
    const descriptions: Record<string, string> = {
      'A1': 'Alto Potencial - Alta performancee',
      'A2': 'Alto Potencial - Média performance',
      'A3': 'Alto Potencial - Baixa performance',
      'B1': 'Médio Potencial - Alta performance',
      'B3': 'Médio Potencial - Baixa performance',
      'C1': 'Baixo Potencial - Alta performance',
      'C2': 'Baixo Potencial - Média performance',
      'C3': 'Baixo Potencial - Baixa performance'
    };
    return quadrant ? descriptions[quadrant] || 'Não avaliado' : 'Não avaliado';
  };

  const getQuadrantColor = (quadrant?: string) => {
    if (!quadrant) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'A2': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      'A3': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'B1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'B2': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      'B3': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'C1': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'C2': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      'C3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[quadrant] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  React.useEffect(() => {
    if (employeeNineBox) {
      setPdiData((prev: any) => ({
        ...prev,
        nineBoxQuadrante: employeeNineBox.nine_box_position,
        nineBoxDescricao: getQuadrantDescription(employeeNineBox.nine_box_position)
      }));
    }
  }, [employeeNineBox, setPdiData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center font-lemon-milk tracking-wide">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-600 dark:text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="truncate">Avaliação do Líder</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 1 ? 'Etapa 1: Avalie as competências' :
               currentStep === 2 ? 'Etapa 2: Avalie o potencial' :
               'Etapa 3: Plano de Desenvolvimento Individual'}
            </p>
            {currentCycle && (
              <p className="text-xs text-gray-500 mt-1">
                Ciclo: {currentCycle.title} | Prazo: {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {periodMessage && (
          <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
            periodMessage.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-stone-100 dark:bg-stone-900/20 text-stone-700 dark:text-stone-300'
          }`}>
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{periodMessage.message}</p>
          </div>
        )}

        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Progresso</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{Math.round(progress)}%</p>
          </div>
          <div className="relative">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
                className="sm:hidden dark:stroke-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="4"
                fill="none"
                className="hidden sm:block dark:stroke-gray-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress * 1.26} 126`}
                strokeLinecap="round"
                className="sm:hidden"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 1.76} 176`}
                strokeLinecap="round"
                className="hidden sm:block"
              />
              <defs>
                <linearGradient id="progressGradient">
                  <stop offset="0%" stopColor="#166534" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2" ref={dropdownRef}>
          <label htmlFor="employee-search" className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
            Selecione o Avaliado
          </label>
          <div className="relative">
            {/* Search input / Selected display */}
            <div
              className={`w-full px-4 py-3 pl-12 pr-10 bg-white dark:bg-gray-700 border ${isDropdownOpen ? 'border-green-800 dark:border-green-700 ring-2 ring-green-800 dark:ring-green-700' : 'border-gray-300 dark:border-gray-600'} rounded-xl text-sm sm:text-base cursor-pointer transition-all`}
              onClick={() => !loading && setIsDropdownOpen(true)}
            >
              {isDropdownOpen ? (
                <input
                  id="employee-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-gray-200"
                  placeholder="Buscar por nome ou cargo..."
                  autoFocus
                />
              ) : (
                <span className={selectedEmployee ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>
                  {selectedEmployee ? `${selectedEmployee.name} - ${selectedEmployee.position}` : 'Escolha um avaliado...'}
                </span>
              )}
            </div>
            {isDropdownOpen ? (
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-800 dark:text-green-700 pointer-events-none" />
            ) : (
              <Info className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            )}
            {selectedEmployee && !isDropdownOpen ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEmployeeId('');
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            )}

            {/* Dropdown list */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {loading ? (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">Carregando...</div>
                  ) : filteredSubordinates.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                      {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum avaliado subordinado'}
                    </div>
                  ) : (
                    filteredSubordinates.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${
                          employee.id === selectedEmployeeId ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{employee.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.position}</p>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {subordinates.length === 0 && !loading && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Entre em contato com o RH para verificar suas permissões.
            </p>
          )}
          {subordinates.length > 5 && !isDropdownOpen && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {subordinates.length} colaboradores disponíveis • Clique para buscar
            </p>
          )}
        </div>

        {selectedEmployee && (
          <>
            <div>
              <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Cargo
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {selectedEmployee.position}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Departamento
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {Array.isArray(selectedEmployee.departments)
                  ? selectedEmployee.departments.length > 0
                    ? selectedEmployee.departments.map(dep => dep.name).join(', ')
                    : 'Não definido'
                  : selectedEmployee.departments || 'Não definido'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEmployee && employeeNineBox && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Grid3x3 className="h-5 w-5 text-green-800 dark:text-green-700" />
            <div>
              <p className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Resultado Nine Box</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuadrantColor(pdiData.nineBoxQuadrante)}`}>
                  {pdiData.nineBoxQuadrante}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pdiData.nineBoxDescricao}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
            Período do PDI
          </label>
          <input
            type="text"
            className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-800 dark:focus:border-green-700 focus:ring-green-800 dark:focus:ring-green-700 text-naue-black dark:text-gray-300 font-medium transition-all duration-200 text-sm sm:text-base"
            value={pdiData.periodo}
            onChange={(e) => setPdiData((prev: any) => ({ ...prev, periodo: e.target.value }))}
            placeholder="Ex: 2024-2025"
          />
        </div>
      )}

      {selectedEmployeeId && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-green-800 dark:text-green-700' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-green-800 dark:bg-green-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Competências</span>
          </div>
          <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-green-800 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className={`flex items-center ${currentStep >= 2 ? 'text-green-800 dark:text-green-700' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-green-800 dark:bg-green-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Potencial</span>
          </div>
          <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-green-800 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className={`flex items-center ${currentStep >= 3 ? 'text-green-800 dark:text-green-700' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-green-800 dark:bg-green-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">PDI</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LeaderEvaluationHeader;