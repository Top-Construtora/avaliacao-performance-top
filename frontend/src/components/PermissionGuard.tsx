import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, AlertTriangle } from 'lucide-react';
import { usePermissions, useUIPermissions } from '../hooks/usePermissions';
import { UserRole } from '../types/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource?: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  resource,
  action,
  fallback,
  redirectTo,
  showError = true,
}: PermissionGuardProps) {
  const permissions = usePermissions();

  // Se resource e action foram especificados, verifica permissão específica
  if (resource && action) {
    const hasPermission = permissions.hasPermission(resource, action);
    
    if (!hasPermission) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }
      
      if (fallback) {
        return <>{fallback}</>;
      }
      
      if (showError) {
        return <PermissionDenied resource={resource} action={action} />;
      }
      
      return null;
    }
  }

  return <>{children}</>;
}

// Componente de erro de permissão
function PermissionDenied({ resource, action }: { resource: string; action: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <div className="text-center max-w-md">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-6">
          <ShieldOff className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Permissão Negada
        </h2>
        <p className="text-gray-600 mb-6">
          Você não tem permissão para {action === 'create' ? 'criar' : action === 'read' ? 'visualizar' : action === 'update' ? 'editar' : 'excluir'} {resource}.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Voltar
        </button>
      </div>
    </motion.div>
  );
}

// Guard para recursos específicos
export function ResourceGuard({
  children,
  resource,
  showError = false,
}: {
  children: React.ReactNode;
  resource: string;
  showError?: boolean;
}) {
  const permissions = usePermissions();
  const canRead = permissions.hasPermission(resource, 'read');

  if (!canRead) {
    if (showError) {
      return <PermissionDenied resource={resource} action="read" />;
    }
    return null;
  }

  return <>{children}</>;
}

// Guard para ações específicas
export function ActionGuard({
  children,
  can,
  fallback,
}: {
  children: React.ReactNode;
  can: boolean | (() => boolean);
  fallback?: React.ReactNode;
}) {
  const allowed = typeof can === 'function' ? can() : can;

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Guard para elementos UI baseado em permissões
export function UIGuard({
  children,
  show,
}: {
  children: React.ReactNode;
  show: keyof ReturnType<typeof useUIPermissions>;
}) {
  const uiPermissions = useUIPermissions();
  
  if (!uiPermissions[show]) {
    return null;
  }

  return <>{children}</>;
}

// Componente de aviso para operações sensíveis
export function OperationWarning({
  operation,
  targetData,
  onConfirm,
  onCancel,
}: {
  operation: string;
  targetData?: any;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { getValidationWarnings } = useOperationValidator();
  const warnings = getValidationWarnings(operation, targetData);

  if (warnings.length === 0) {
    onConfirm();
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-bold text-gray-900">Atenção</h3>
        </div>
        
        <div className="space-y-2 mb-6">
          {warnings.map((warning, index) => (
            <p key={index} className="text-sm text-gray-600">
              • {warning}
            </p>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hook helper para uso em componentes
import { useOperationValidator } from '../hooks/usePermissions';

export function usePermissionGuard(resource: string, action: 'create' | 'read' | 'update' | 'delete') {
  const permissions = usePermissions();
  return permissions.hasPermission(resource, action);
}