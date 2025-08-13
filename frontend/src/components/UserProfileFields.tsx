import React from 'react';
import { motion } from 'framer-motion';
import { Users, Baby, AlertCircle } from 'lucide-react';

interface UserProfileFieldsProps {
  formData: {
    has_children: boolean;
    children_age_ranges: string[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ageRangeOptions = [
  { value: '0-3', label: '0-3 anos' },
  { value: '4-6', label: '4-6 anos' },
  { value: '7-10', label: '7-10 anos' },
  { value: '11-14', label: '11-14 anos' },
  { value: '15-17', label: '15-17 anos' },
  { value: '18+', label: '18+ anos' },
];

const UserProfileFields: React.FC<UserProfileFieldsProps> = ({ formData, onChange, errors = {} }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
        <Users className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
        Informações Pessoais
      </h3>
      
      <div className="space-y-4">
        {/* Has Children Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center">
            <Baby className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Possui filhos?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Informação opcional para melhor gestão de benefícios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('has_children', !formData.has_children);
              if (!formData.has_children === false) {
                onChange('children_age_ranges', []);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.has_children ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.has_children ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Children Age Ranges */}
        {formData.has_children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium">
              Faixa etária dos filhos
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ageRangeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    formData.children_age_ranges.includes(option.value)
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-400'
                      : 'bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                    checked={formData.children_age_ranges.includes(option.value)}
                    onChange={(e) => {
                      const currentRanges = formData.children_age_ranges || [];
                      if (e.target.checked) {
                        onChange('children_age_ranges', [...currentRanges, option.value]);
                      } else {
                        onChange('children_age_ranges', currentRanges.filter(r => r !== option.value));
                      }
                    }}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Selecione todas as faixas etárias aplicáveis
            </p>
          </motion.div>
        )}

        {errors.children_age_ranges && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.children_age_ranges}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfileFields;