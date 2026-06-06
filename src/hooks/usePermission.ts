import { useStore } from '../store/useStore';
import type { UserRole } from '../types';

export const usePermission = () => {
  const currentUser = useStore(state => state.currentUser);

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const canAccess = (requiredRoles: UserRole[]): boolean => {
    return hasRole(requiredRoles);
  };

  const isAdmin = (): boolean => currentUser?.role === 'admin';
  const isPresident = (): boolean => currentUser?.role === 'president';
  const isChief = (): boolean => currentUser?.role === 'chief';
  const isJudge = (): boolean => currentUser?.role === 'judge';
  const isClerk = (): boolean => currentUser?.role === 'clerk';

  const canViewAllCases = (): boolean => {
    return isAdmin() || isPresident();
  };

  const canViewDepartmentCases = (): boolean => {
    return canViewAllCases() || isChief();
  };

  const canApproveDocument = (level: number): boolean => {
    if (level === 1) return isChief() || isPresident() || isAdmin();
    if (level === 2) return isPresident() || isAdmin();
    return false;
  };

  const canAssignCase = (): boolean => {
    return isClerk() || isChief() || isPresident() || isAdmin();
  };

  const canManageSystem = (): boolean => {
    return isAdmin();
  };

  return {
    hasRole,
    canAccess,
    isAdmin,
    isPresident,
    isChief,
    isJudge,
    isClerk,
    canViewAllCases,
    canViewDepartmentCases,
    canApproveDocument,
    canAssignCase,
    canManageSystem,
  };
};
