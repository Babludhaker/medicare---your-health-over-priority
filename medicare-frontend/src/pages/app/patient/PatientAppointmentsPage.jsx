import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarX } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/Dashboard';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import { useResource, useMutation } from '@/hooks/useResource';
import { useConfirm } from '@/hooks/useConfirm';
import { appointmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { errorMessage } from '@/lib/utils';

/**
 * PatientAppointmentsPage — the patient's own appointments, split into
 * upcoming and past.
 */
export default function PatientAppointmentsPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const apptParams = { limit: 100 };
  const { data, loading, error } = useResource(
    qk.appointments.list(apptParams),
    () => appointmentApi.list(apptParams)
  );

  const all =
    data?.appointments ||
    data?.items ||
    (Array.isArray(data) ? data : []);

  const now = Date.now();
  const isUpcoming = (a) => {
    const t = new Date(a.startTime || a.scheduledAt || a.date).getTime();
    return (
      t >= now &&
      ['HOLD', 'CONFIRMED'].includes(a.status)
    );
  };
  const upcoming = all.filter(isUpcoming);
  const past = all.filter((a) => !isUpcoming(a));

  const cancel = useMutation(
    (id) => appointmentApi.cancel(id, 'Cancelled by patient'),
    {
      invalidate: [qk.appointments.all],
      onSuccess: () => notify.success('Appointment cancelled.'),
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const handleCancel = async (a) => {
    const ok = await confirm.ask({
      title: 'Cancel this appointment?',
      message:
        'You can always book again later. Cancel this appointment?',
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      tone: 'danger',
    });
    if (ok) cancel.mutate(a.id);
  };

  const renderActions = (a) =>
    ['HOLD', 'CONFIRMED'].includes(a.status) ? (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleCancel(a)}
      >
        <CalendarX className="h-3.5 w-3.5" />
        Cancel
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Appointments"
        subtitle="Your upcoming and past visits."
        action={
          <Button onClick={() => navigate('/app/book')}>
            <CalendarPlus className="h-4 w-4" />
            Book a visit
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Upcoming"
          subtitle={`${upcoming.length} scheduled`}
        />
        <AppointmentsTable
          appointments={upcoming}
          loading={loading || cancel.loading}
          error={error}
          variant="patient"
          renderActions={renderActions}
          emptyTitle="No upcoming appointments"
          emptyMessage="Book a visit and it will show up here."
        />
      </Card>

      <Card>
        <CardHeader
          title="Past"
          subtitle={`${past.length} visit(s)`}
        />
        <AppointmentsTable
          appointments={past}
          loading={loading}
          error={error}
          variant="patient"
          emptyTitle="No past appointments"
          emptyMessage="Your visit history will appear here."
        />
      </Card>

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}
