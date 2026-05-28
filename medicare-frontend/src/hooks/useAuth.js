import { useAuthStore } from '@/store/auth.store';
import { ROLES } from '@/lib/constants';

/**
 * useAuth — a thin convenience wrapper over the auth store with a few
 * derived booleans, so components don't repeat role checks.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    status,
    logout,
    isAuthenticated: status === 'authenticated' && !!user,
    isResolving: status === 'idle' || status === 'loading',
    role: user?.role || null,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isClinicAdmin: user?.role === ROLES.CLINIC_ADMIN,
    isDoctor: user?.role === ROLES.DOCTOR,
    isReceptionist: user?.role === ROLES.RECEPTIONIST,
    isPatient: user?.role === ROLES.PATIENT,
  };
}
