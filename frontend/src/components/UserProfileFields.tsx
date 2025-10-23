import React from 'react';
import { motion } from 'framer-motion';
import { Users, Baby, AlertCircle } from 'lucide-react';

interface UserProfileFieldsProps {
  formData: {
    has_children: boolean;
    children_age_ranges?: string[];
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

        {/* Removido: Children Age Ranges - coluna não existe no banco */}
      </div>
    </div>
  );
};

export default UserProfileFields;