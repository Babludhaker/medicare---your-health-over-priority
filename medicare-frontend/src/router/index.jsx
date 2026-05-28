import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts and guards stay eager — they're small and needed immediately.
import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import {
  ProtectedRoute,
  RoleRoute,
  GuestOnlyRoute,
} from '@/router/guards';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui/Card';
import { ROLES } from '@/lib/constants';

/**
 * Page components are lazy-loaded so each route ships its own chunk.
 * The public site, the auth flow, and each role's dashboard download
 * only when first visited.
 */

// Public
const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const DoctorsPage = lazy(() => import('@/pages/DoctorsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage')
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage')
);
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

// Shared dashboard
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));
const NotificationsPage = lazy(() =>
  import('@/pages/app/shared/NotificationsPage')
);
const AppointmentsPage = lazy(() =>
  import('@/pages/app/shared/AppointmentsPage')
);
const PatientsPage = lazy(() => import('@/pages/app/shared/PatientsPage'));

// Super Admin
const PlatformOverviewPage = lazy(() =>
  import('@/pages/app/superadmin/PlatformOverviewPage')
);
const ClinicsPage = lazy(() =>
  import('@/pages/app/superadmin/ClinicsPage')
);
const PlansPage = lazy(() => import('@/pages/app/superadmin/PlansPage'));
const PlatformAnalyticsPage = lazy(() =>
  import('@/pages/app/superadmin/PlatformAnalyticsPage')
);

// Clinic Admin
const ClinicOverviewPage = lazy(() =>
  import('@/pages/app/clinicadmin/ClinicOverviewPage')
);
const StaffPage = lazy(() => import('@/pages/app/clinicadmin/StaffPage'));
const DepartmentsPage = lazy(() =>
  import('@/pages/app/clinicadmin/DepartmentsPage')
);
const DoctorsAdminPage = lazy(() =>
  import('@/pages/app/clinicadmin/DoctorsAdminPage')
);
const BillingPage = lazy(() =>
  import('@/pages/app/clinicadmin/BillingPage')
);
const ClinicAnalyticsPage = lazy(() =>
  import('@/pages/app/clinicadmin/ClinicAnalyticsPage')
);

// Doctor
const DoctorSchedulePage = lazy(() =>
  import('@/pages/app/doctor/DoctorSchedulePage')
);
const DoctorRecordsPage = lazy(() =>
  import('@/pages/app/doctor/DoctorRecordsPage')
);

// Receptionist
const FrontDeskPage = lazy(() =>
  import('@/pages/app/receptionist/FrontDeskPage')
);

// Patient
const PatientAppointmentsPage = lazy(() =>
  import('@/pages/app/patient/PatientAppointmentsPage')
);
const PatientBookPage = lazy(() =>
  import('@/pages/app/patient/PatientBookPage')
);
const PatientHealthPage = lazy(() =>
  import('@/pages/app/patient/PatientHealthPage')
);

/** Wrap a lazy element in a Suspense boundary with a page loader. */
function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

/**
 * AppointmentsRouter — /app/appointments is shared. Patients see their
 * personal list; clinic staff see the management view.
 */
function AppointmentsRouter() {
  const { isPatient } = useAuth();
  return isPatient ? (
    <PatientAppointmentsPage />
  ) : (
    <AppointmentsPage canBook />
  );
}

/**
 * PatientsRouter — /app/patients is shared. Receptionists can register
 * patients; doctors get a read-only directory.
 */
function PatientsRouter() {
  const { isReceptionist } = useAuth();
  return <PatientsPage canRegister={isReceptionist} />;
}

/** Keeps the route table readable: wrap an element in a role guard. */
const role = (allow, element) => (
  <RoleRoute allow={allow}>{element}</RoleRoute>
);

/**
 * Application route tree.
 *
 *   /            public marketing site   (PublicLayout)
 *   /login …     authentication          (AuthLayout, guests only)
 *   /app/*       role dashboards         (AppLayout, authenticated)
 *   *            404
 */
export const router = createBrowserRouter([
  // ---- Public marketing site -------------------------------------
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: withSuspense(<HomePage />) },
      { path: '/about', element: withSuspense(<AboutPage />) },
      { path: '/contact', element: withSuspense(<ContactPage />) },
      { path: '/pricing', element: withSuspense(<PricingPage />) },
      { path: '/doctors', element: withSuspense(<DoctorsPage />) },
    ],
  },

  // ---- Authentication (guests only) ------------------------------
  {
    element: (
      <GuestOnlyRoute>
        <AuthLayout />
      </GuestOnlyRoute>
    ),
    children: [
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/register', element: withSuspense(<RegisterPage />) },
      { path: '/verify-otp', element: withSuspense(<VerifyOtpPage />) },
      {
        path: '/forgot-password',
        element: withSuspense(<ForgotPasswordPage />),
      },
      {
        path: '/reset-password',
        element: withSuspense(<ResetPasswordPage />),
      },
      {
        path: '/verify-email',
        element: withSuspense(<VerifyEmailPage />),
      },
    ],
  },

  // ---- Authenticated dashboard -----------------------------------
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/login" replace /> },

      // --- Super Admin ---------------------------------------------
      {
        path: 'platform',
        element: role(
          ROLES.SUPER_ADMIN,
          withSuspense(<PlatformOverviewPage />)
        ),
      },
      {
        path: 'clinics',
        element: role(ROLES.SUPER_ADMIN, withSuspense(<ClinicsPage />)),
      },
      {
        path: 'plans',
        element: role(ROLES.SUPER_ADMIN, withSuspense(<PlansPage />)),
      },
      {
        path: 'insights',
        element: role(
          ROLES.SUPER_ADMIN,
          withSuspense(<PlatformAnalyticsPage />)
        ),
      },

      // --- Clinic Admin --------------------------------------------
      {
        path: 'clinic',
        element: role(
          ROLES.CLINIC_ADMIN,
          withSuspense(<ClinicOverviewPage />)
        ),
      },
      {
        path: 'staff',
        element: role(ROLES.CLINIC_ADMIN, withSuspense(<StaffPage />)),
      },
      {
        path: 'departments',
        element: role(
          ROLES.CLINIC_ADMIN,
          withSuspense(<DepartmentsPage />)
        ),
      },
      {
        path: 'doctors',
        element: role(
          ROLES.CLINIC_ADMIN,
          withSuspense(<DoctorsAdminPage />)
        ),
      },
      {
        path: 'billing',
        element: role(ROLES.CLINIC_ADMIN, withSuspense(<BillingPage />)),
      },
      {
        path: 'analytics',
        element: role(
          ROLES.CLINIC_ADMIN,
          withSuspense(<ClinicAnalyticsPage />)
        ),
      },

      // --- Doctor ---------------------------------------------------
      {
        path: 'schedule',
        element: role(
          ROLES.DOCTOR,
          withSuspense(<DoctorSchedulePage />)
        ),
      },
      {
        path: 'records',
        element: role(ROLES.DOCTOR, withSuspense(<DoctorRecordsPage />)),
      },

      // --- Receptionist --------------------------------------------
      {
        path: 'front-desk',
        element: role(
          ROLES.RECEPTIONIST,
          withSuspense(<FrontDeskPage />)
        ),
      },

      // --- Patient --------------------------------------------------
      {
        path: 'book',
        element: role(ROLES.PATIENT, withSuspense(<PatientBookPage />)),
      },
      {
        path: 'health',
        element: role(
          ROLES.PATIENT,
          withSuspense(<PatientHealthPage />)
        ),
      },

      // --- Shared: appointments ------------------------------------
      {
        path: 'appointments',
        element: role(
          [ROLES.CLINIC_ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT],
          withSuspense(<AppointmentsRouter />)
        ),
      },

      // --- Shared: patients ----------------------------------------
      {
        path: 'patients',
        element: role(
          [ROLES.DOCTOR, ROLES.RECEPTIONIST],
          withSuspense(<PatientsRouter />)
        ),
      },

      // --- Available to every authenticated user -------------------
      { path: 'profile', element: withSuspense(<ProfilePage />) },
      {
        path: 'notifications',
        element: withSuspense(<NotificationsPage />),
      },
    ],
  },

  // ---- 404 --------------------------------------------------------
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
