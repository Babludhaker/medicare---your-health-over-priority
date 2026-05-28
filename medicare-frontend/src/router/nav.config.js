import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  Building2,
  ClipboardList,
  CreditCard,
  BarChart3,
  UserCog,
  FolderHeart,
  ConciergeBell,
} from 'lucide-react';
import { ROLES } from '@/lib/constants';

/**
 * Navigation map for the dashboard sidebar, keyed by role.
 *
 * `to` paths are placeholders for the dashboard feature set (built in
 * the next phase). They render simple placeholder pages for now so the
 * routing and guards are fully exercised end to end.
 */
export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    { to: '/app/platform', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/clinics', label: 'Clinics', icon: Building2 },
    { to: '/app/plans', label: 'Subscription Plans', icon: CreditCard },
    { to: '/app/insights', label: 'Platform Analytics', icon: BarChart3 },
  ],
  [ROLES.CLINIC_ADMIN]: [
    { to: '/app/clinic', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/staff', label: 'Staff', icon: UserCog },
    { to: '/app/departments', label: 'Departments', icon: Building2 },
    { to: '/app/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/app/billing', label: 'Billing', icon: CreditCard },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  [ROLES.DOCTOR]: [
    { to: '/app/schedule', label: 'My Schedule', icon: CalendarDays },
    { to: '/app/patients', label: 'Patients', icon: Users },
    { to: '/app/records', label: 'Records', icon: ClipboardList },
  ],
  [ROLES.RECEPTIONIST]: [
    { to: '/app/front-desk', label: 'Front Desk', icon: ConciergeBell },
    { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/app/patients', label: 'Patients', icon: Users },
  ],
  [ROLES.PATIENT]: [
    { to: '/app/appointments', label: 'My Appointments', icon: CalendarDays },
    { to: '/app/book', label: 'Book a Visit', icon: Stethoscope },
    { to: '/app/health', label: 'My Health', icon: FolderHeart },
  ],
};

/** Items shared by every role, shown below the role-specific nav. */
export const COMMON_NAV = [
  { to: '/app/profile', label: 'Profile & Settings', icon: UserCog },
];
