import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  Stethoscope,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  PageLoader,
} from '@/components/ui/Card';
import { StatCard, StatGrid, PageHeader } from '@/components/ui/Dashboard';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import Button from '@/components/ui/Button';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/hooks/useAuth';
import { analyticsApi, appointmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';
import { todayISO } from '@/lib/dates';

/**
 * ClinicOverviewPage (Clinic Admin) — the landing dashboard. Headline
 * metrics plus today's appointment list.
 */
export default function ClinicOverviewPage() {
  const { user } = useAuth();

  const { data: stats, loading: statsLoading } = useResource(
    qk.analytics.clinic({ scope: 'overview' }),
    () => analyticsApi.clinic()
  );

  const today = todayISO();
  const apptParams = { date: today, limit: 8 };
  const { data: apptData, loading: apptLoading, error: apptError } =
    useResource(
      qk.appointments.list(apptParams),
      () => appointmentApi.list(apptParams)
    );

  const m = stats || {};
  const todayAppointments =
    apptData?.appointments ||
    apptData?.items ||
    (Array.isArray(apptData) ? apptData : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.firstName || 'there'}`}
        subtitle="Your clinic at a glance."
      />

      {statsLoading ? (
        <PageLoader label="Loading your clinic…" />
      ) : (
        <StatGrid>
          <StatCard
            icon={CalendarDays}
            label="Appointments today"
            value={m.appointmentsToday ?? m.todayAppointments ?? 0}
            tone="pine"
          />
          <StatCard
            icon={Stethoscope}
            label="Active doctors"
            value={m.activeDoctors ?? m.doctors ?? 0}
            tone="blue"
          />
          <StatCard
            icon={Users}
            label="Total patients"
            value={Number(
              m.totalPatients ?? m.patients ?? 0
            ).toLocaleString('en-IN')}
            tone="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue this month"
            value={formatCurrency(m.revenueThisMonth ?? m.revenue ?? 0)}
            tone="clay"
          />
        </StatGrid>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="Today's appointments"
            action={
              <Button
                as={Link}
                to="/app/appointments"
                size="sm"
                variant="ghost"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <AppointmentsTable
            appointments={todayAppointments}
            loading={apptLoading}
            error={apptError}
            variant="clinic"
            emptyTitle="Nothing scheduled today"
            emptyMessage="Today's appointments will appear here."
          />
        </Card>

        <Card>
          <CardHeader title="Manage" />
          <CardBody className="space-y-3">
            <ActionRow
              to="/app/appointments"
              title="Appointments"
              desc="Book and manage appointments."
            />
            <ActionRow
              to="/app/staff"
              title="Staff"
              desc="Add doctors and receptionists."
            />
            <ActionRow
              to="/app/doctors"
              title="Doctors"
              desc="Profiles and availability."
            />
            <ActionRow
              to="/app/analytics"
              title="Analytics"
              desc="Trends and reports."
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ActionRow({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-paper-200 p-3.5 transition-colors hover:border-pine-300 hover:bg-pine-50"
    >
      <div>
        <p className="text-sm font-semibold text-pine-900">{title}</p>
        <p className="text-xs text-paper-500">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-paper-400" />
    </Link>
  );
}
