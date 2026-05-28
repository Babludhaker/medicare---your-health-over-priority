import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Check,
  UserX,
  Eye,
  ClipboardPlus,
} from 'lucide-react';
import { Card, CardHeader, Badge, statusTone } from '@/components/ui/Card';
import { StatCard, StatGrid, PageHeader } from '@/components/ui/Dashboard';
import { Toolbar } from '@/components/ui/Toolbar';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import PatientDetailModal from '@/pages/app/shared/PatientDetailModal';
import RecordModal from './RecordModal';
import { useResource, useMutation } from '@/hooks/useResource';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuth } from '@/hooks/useAuth';
import { appointmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { todayISO, dayLabel, upcomingDays } from '@/lib/dates';
import { errorMessage } from '@/lib/utils';

/**
 * DoctorSchedulePage — the doctor's daily schedule. Lists the chosen
 * day's appointments with quick access to patient history and the EMR
 * record editor.
 */
export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [viewingPatient, setViewingPatient] = useState(null);
  const [recordFor, setRecordFor] = useState(null);
  const confirm = useConfirm();

  const days = upcomingDays(10);

  const apptParams = { date, limit: 50 };
  const { data, loading, error } = useResource(
    qk.appointments.list(apptParams),
    () => appointmentApi.list(apptParams)
  );

  const appointments =
    data?.appointments ||
    data?.items ||
    (Array.isArray(data) ? data : []);

  const confirmed = appointments.filter(
    (a) => a.status === 'CONFIRMED'
  ).length;
  const completed = appointments.filter(
    (a) => a.status === 'COMPLETED'
  ).length;

  const action = useMutation(({ fn }) => fn(), {
    invalidate: [qk.appointments.all],
    onSuccess: () => notify.success('Appointment updated.'),
    onError: (err) => notify.error(errorMessage(err)),
  });

  const completeAppt = (a) =>
    action.mutate({ fn: () => appointmentApi.complete(a.id) });

  const noShowAppt = async (a) => {
    const ok = await confirm.ask({
      title: 'Mark as no-show?',
      message: 'Record that this patient did not attend.',
      confirmLabel: 'Mark no-show',
      tone: 'danger',
    });
    if (ok) action.mutate({ fn: () => appointmentApi.noShow(a.id) });
  };

  const renderActions = (a) => (
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setViewingPatient(a.patient || a.patientUser)}
      >
        <Eye className="h-3.5 w-3.5" />
        History
      </Button>
      {(a.status === 'CONFIRMED' || a.status === 'COMPLETED') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRecordFor(a)}
        >
          <ClipboardPlus className="h-3.5 w-3.5" />
          Record
        </Button>
      )}
      {a.status === 'CONFIRMED' && (
        <>
          <Button size="sm" onClick={() => completeAppt(a)}>
            <Check className="h-3.5 w-3.5" />
            Complete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => noShowAppt(a)}
          >
            <UserX className="h-3.5 w-3.5" />
            No-show
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, Dr. ${user?.lastName || ''}`}
        subtitle="Your schedule and patients."
      />

      <StatGrid className="lg:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="Appointments"
          value={appointments.length}
          hint={dayLabel(date)}
          tone="pine"
        />
        <StatCard
          icon={Clock}
          label="Still to see"
          value={confirmed}
          tone="amber"
        />
        <StatCard
          icon={Check}
          label="Completed"
          value={completed}
          tone="green"
        />
      </StatGrid>

      {/* Day picker */}
      <Card>
        <div className="p-4">
          <Toolbar>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDate(d.value)}
                  className={
                    'flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-colors ' +
                    (date === d.value
                      ? 'border-pine-600 bg-pine-700 text-paper-50'
                      : 'border-paper-200 text-paper-600 hover:border-pine-300')
                  }
                >
                  <span className="text-xs">
                    {d.isToday ? 'Today' : d.weekday}
                  </span>
                  <span className="font-display text-base font-semibold">
                    {d.day}
                  </span>
                </button>
              ))}
            </div>
          </Toolbar>
        </div>
        <AppointmentsTable
          appointments={appointments}
          loading={loading || action.loading}
          error={error}
          variant="doctor"
          renderActions={renderActions}
          emptyTitle="No appointments"
          emptyMessage={`Nothing scheduled for ${dayLabel(date)}.`}
        />
      </Card>

      {viewingPatient && (
        <PatientDetailModal
          patient={viewingPatient}
          onClose={() => setViewingPatient(null)}
        />
      )}

      {recordFor && (
        <RecordModal
          appointment={recordFor}
          onClose={() => setRecordFor(null)}
          onSaved={() => setRecordFor(null)}
        />
      )}

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}
