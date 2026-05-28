import { useState } from 'react';
import { Plus, CalendarX, RotateCcw, Check, UserX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/Dashboard';
import { Toolbar, FilterSelect } from '@/components/ui/Toolbar';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import BookingFlow from '@/features/appointments/BookingFlow';
import { useResource, useMutation } from '@/hooks/useResource';
import { useConfirm } from '@/hooks/useConfirm';
import { appointmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { APPOINTMENT_STATUS } from '@/lib/constants';
import { errorMessage } from '@/lib/utils';

/**
 * AppointmentsPage — manage appointments. Shared by the clinic-admin
 * and receptionist dashboards. Supports filtering by status, booking a
 * new appointment, and lifecycle actions (confirm, complete, cancel,
 * no-show).
 *
 * @param {boolean} canBook  show the "Book appointment" action
 */
export default function AppointmentsPage({ canBook = true }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [booking, setBooking] = useState(false);
  const confirm = useConfirm();

  const apptParams = {
    page,
    limit: 10,
    status: status === 'all' ? undefined : status,
  };
  const { data, meta, loading, error } = useResource(
    qk.appointments.list(apptParams),
    () => appointmentApi.list(apptParams)
  );

  const appointments =
    data?.appointments ||
    data?.items ||
    (Array.isArray(data) ? data : []);

  // --- lifecycle actions ------------------------------------------
  const action = useMutation(({ fn }) => fn(), {
    invalidate: [qk.appointments.all],
    onSuccess: () => notify.success('Appointment updated.'),
    onError: (err) => notify.error(errorMessage(err)),
  });

  const confirmAppt = (a) =>
    action.mutate({ fn: () => appointmentApi.confirm(a.id) });
  const completeAppt = (a) =>
    action.mutate({ fn: () => appointmentApi.complete(a.id) });

  const cancelAppt = async (a) => {
    const ok = await confirm.ask({
      title: 'Cancel appointment?',
      message:
        'This will cancel the appointment. The patient will be notified.',
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      tone: 'danger',
    });
    if (ok) {
      action.mutate({
        fn: () => appointmentApi.cancel(a.id, 'Cancelled by clinic'),
      });
    }
  };

  const noShowAppt = async (a) => {
    const ok = await confirm.ask({
      title: 'Mark as no-show?',
      message: 'Record that the patient did not attend this appointment.',
      confirmLabel: 'Mark no-show',
      tone: 'danger',
    });
    if (ok) action.mutate({ fn: () => appointmentApi.noShow(a.id) });
  };

  // --- per-row actions by status ----------------------------------
  const renderActions = (a) => {
    const buttons = [];
    if (a.status === APPOINTMENT_STATUS.HOLD) {
      buttons.push(
        <Button key="c" size="sm" onClick={() => confirmAppt(a)}>
          <Check className="h-3.5 w-3.5" />
          Confirm
        </Button>
      );
    }
    if (a.status === APPOINTMENT_STATUS.CONFIRMED) {
      buttons.push(
        <Button
          key="done"
          size="sm"
          variant="outline"
          onClick={() => completeAppt(a)}
        >
          <Check className="h-3.5 w-3.5" />
          Complete
        </Button>,
        <Button
          key="ns"
          size="sm"
          variant="ghost"
          onClick={() => noShowAppt(a)}
        >
          <UserX className="h-3.5 w-3.5" />
          No-show
        </Button>
      );
    }
    if (
      a.status === APPOINTMENT_STATUS.HOLD ||
      a.status === APPOINTMENT_STATUS.CONFIRMED
    ) {
      buttons.push(
        <Button
          key="x"
          size="sm"
          variant="ghost"
          onClick={() => cancelAppt(a)}
        >
          <CalendarX className="h-3.5 w-3.5" />
          Cancel
        </Button>
      );
    }
    return <div className="flex justify-end gap-1.5">{buttons}</div>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle="View and manage the clinic's appointments."
        action={
          canBook && (
            <Button onClick={() => setBooking(true)}>
              <Plus className="h-4 w-4" />
              Book appointment
            </Button>
          )
        }
      />

      <Card>
        <div className="p-4">
          <Toolbar>
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'HOLD', label: 'On hold' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'NO_SHOW', label: 'No-show' },
              ]}
            />
          </Toolbar>
        </div>
        <AppointmentsTable
          appointments={appointments}
          loading={loading || action.loading}
          error={error}
          variant="clinic"
          renderActions={renderActions}
          emptyTitle="No appointments"
          emptyMessage={
            canBook
              ? 'Book the first appointment to get started.'
              : 'Appointments will appear here once booked.'
          }
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {booking && (
        <Modal
          open
          onClose={() => setBooking(false)}
          title="Book an appointment"
          size="lg"
        >
          <BookingFlow
            onBooked={() => setBooking(false)}
          />
        </Modal>
      )}

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}
