import React from 'react';
import { useUserRole } from '../context/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'director' | 'leader' | 'collaborator'>;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isAdmin } = useUserRole();

  // Admin tem acesso a tudo
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(role as 'admin' | 'director' | 'leader' | 'collaborator')) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;