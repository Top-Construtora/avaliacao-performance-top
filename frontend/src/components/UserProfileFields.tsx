// frontend/src/components/users/UserProfileFields.tsx
import React from 'react';
import { 
  User,
  Heart,
  Baby,
  Palette,
  Users,
  Activity,
  Hash,
  Shield
} from 'lucide-react';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  CHILDREN_AGE_OPTIONS,
  FAVORITE_COLORS,
  POPULAR_SPORTS,
  Gender,
  MaritalStatus,
} from '../types/user';

interface UserProfileFieldsProps {
  formData: {
    gender?: Gender | null;
    has_children?: boolean;
    children_age_ranges?: string[];
    marital_status?: MaritalStatus | null;
    hobbies?: string;
    favorite_color?: string;
    supports_team?: boolean;
    team_name?: string;
    practices_sports?: boolean;
    sports?: string[];
  };
  onChange: (field: string, value: any) => void;
}

export const UserProfileFields: React.FC<UserProfileFieldsProps> = ({
  formData,
  onChange,
}) => {
  const handleSportsChange = (sport: string) => {
    const currentSports = formData.sports || [];
    const updated = currentSports.includes(sport)
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport];
    onChange('sports', updated);
  };

  const handleChildrenAgeChange = (ageRange: string) => {
    const currentRanges = formData.children_age_ranges || [];
    const updated = currentRanges.includes(ageRange)
      ? currentRanges.filter(r => r !== ageRange)
      : [...currentRanges, ageRange];
    onChange('children_age_ranges', updated);
  };

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <User className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
          Informações Pessoais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gênero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Shield className="inline h-4 w-4 mr-1" />
              Gênero
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => onChange('gender', e.target.value || null)}
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">Selecione...</option>
              {GENDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Civil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Heart className="inline h-4 w-4 mr-1" />
              Estado Civil
            </label>
            <select
              value={formData.marital_status || ''}
              onChange={(e) => onChange('marital_status', e.target.value || null)}
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">Selecione...</option>
              {MARITAL_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tem Filhos */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_children || false}
                onChange={(e) => {
                  onChange('has_children', e.target.checked);
                  if (!e.target.checked) {
                    onChange('children_age_ranges', []);
                  }
                }}
                className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Baby className="inline h-4 w-4 mr-1" />
                Tem filhos
              </span>
            </label>

            {/* Faixas Etárias dos Filhos */}
            {formData.has_children && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Faixas etárias dos filhos
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CHILDREN_AGE_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.children_age_ranges || []).includes(option.value)}
                        onChange={() => handleChildrenAgeChange(option.value)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interesses e Hobbies */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
          Interesses e Hobbies
        </h3>

        <div className="space-y-6">
          {/* Hobbies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              Hobbies e Lazer
            </label>
            <textarea
              value={formData.hobbies || ''}
              onChange={(e) => onChange('hobbies', e.target.value)}
              rows={3}
              placeholder="Ex: Leitura, viagens, culinária, música..."
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          {/* Cor Preferida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Cor Preferida
            </label>
            <select
              value={formData.favorite_color || ''}
              onChange={(e) => onChange('favorite_color', e.target.value)}
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">Selecione uma cor...</option>
              {FAVORITE_COLORS.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time de Futebol */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.supports_team || false}
                onChange={(e) => {
                  onChange('supports_team', e.target.checked);
                  if (!e.target.checked) {
                    onChange('team_name', '');
                  }
                }}
                className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="inline h-4 w-4 mr-1" />
                Torce para algum time
              </span>
            </label>

            {formData.supports_team && (
              <input
                type="text"
                value={formData.team_name || ''}
                onChange={(e) => onChange('team_name', e.target.value)}
                placeholder="Nome do time"
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            )}
          </div>

          {/* Pratica Esportes */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.practices_sports || false}
                onChange={(e) => {
                  onChange('practices_sports', e.target.checked);
                  if (!e.target.checked) {
                    onChange('sports', []);
                  }
                }}
                className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Activity className="inline h-4 w-4 mr-1" />
                Pratica esportes
              </span>
            </label>

            {formData.practices_sports && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quais esportes?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {POPULAR_SPORTS.map(sport => (
                    <label key={sport} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.sports || []).includes(sport)}
                        onChange={() => handleSportsChange(sport)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {sport}
                      </span>
                    </label>
                  ))}
                </div>
                
                {/* Campo para esporte personalizado */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Outro esporte (pressione Enter para adicionar)"
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !(formData.sports || []).includes(value)) {
                          onChange('sports', [...(formData.sports || []), value]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};