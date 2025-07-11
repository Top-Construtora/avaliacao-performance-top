import React from 'react';
import { useUserRole } from '../context/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'director' | 'leader' | 'collaborator'>;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role } = useUserRole();
  
  if (!allowedRoles.includes(role as 'director' | 'leader' | 'collaborator')) {
    return null;
  }
  
  return <>{children}</>;
}

export default RoleGuard;