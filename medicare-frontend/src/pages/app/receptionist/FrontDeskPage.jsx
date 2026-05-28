import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  ConciergeBell,
  CalendarPlus,
  UserPlus,
  Footprints,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
} from '@/components/ui/Card';
import { StatCard, StatGrid, PageHeader } from '@/components/ui/Dashboard';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import BookingFlow from '@/features/appointments/BookingFlow';
import { useResource, useMutation } from '@/hooks/useResource';
import { useAuth } from '@/hooks/useAuth';
import { appointmentApi, doctorApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { todayISO } from '@/lib/dates';
import { errorMessage } from '@/lib/utils';

/**
 * FrontDeskPage (Receptionist) — the daily command centre: today's
 * appointments, quick booking, walk-in registration.
 */
export default function FrontDeskPage() {
  const { user } = useAuth();
  const [booking, setBooking] = useState(false);
  const [walkIn, setWalkIn] = useState(false);

  const apptParams = { date: todayISO(), limit: 20 };
  const { data, loading, error } = useResource(
    qk.appointments.list(apptParams),
    () => appointmentApi.list(apptParams)
  );

  const todayAppointments =
    data?.appointments ||
    data?.items ||
    (Array.isArray(data) ? data : []);

  // Quick metrics from today's list.
  const confirmed = todayAppointments.filter(
    (a) => a.status === 'CONFIRMED'
  ).length;
  const completed = todayAppointments.filter(
    (a) => a.status === 'COMPLETED'
  ).length;
  const onHold = todayAppointments.filter(
    (a) => a.status === 'HOLD'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Front desk — ${user?.firstName || ''}`}
        subtitle="Today's patient flow at a glance."
      />

      <StatGrid>
        <StatCard
          icon={ConciergeBell}
          label="Today's appointments"
          value={todayAppointments.length}
          tone="pine"
        />
        <StatCard
          icon={Check}
          label="Confirmed"
          value={confirmed}
          tone="green"
        />
        <StatCard
          icon={CalendarPlus}
          label="Awaiting confirmation"
          value={onHold}
          tone="amber"
        />
        <StatCard
          icon={Check}
          label="Completed"
          value={completed}
          tone="blue"
        />
      </StatGrid>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          icon={CalendarPlus}
          title="Book appointment"
          desc="Schedule a future visit."
          onClick={() => setBooking(true)}
        />
        <QuickAction
          icon={Footprints}
          title="Register walk-in"
          desc="Add a patient who's here now."
          onClick={() => setWalkIn(true)}
        />
        <Link to="/app/patients" className="block">
          <div className="flex h-full items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-5 transition-colors hover:border-pine-300 hover:bg-pine-50">
            <div className="rounded-xl bg-pine-100 p-2.5 text-pine-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-pine-900">
                Patient registry
              </p>
              <p className="text-xs text-paper-500">
                Register and search patients.
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-paper-400" />
          </div>
        </Link>
      </div>

      {/* Today's appointments */}
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
              All appointments
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <AppointmentsTable
          appointments={todayAppointments}
          loading={loading}
          error={error}
          variant="clinic"
          emptyTitle="Nothing scheduled today"
          emptyMessage="Booked appointments for today will appear here."
        />
      </Card>

      {/* Booking modal */}
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

      {/* Walk-in modal */}
      {walkIn && (
        <WalkInModal
          onClose={() => setWalkIn(false)}
          onSaved={() => setWalkIn(false)}
        />
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-5 text-left transition-colors hover:border-pine-300 hover:bg-pine-50"
    >
      <div className="rounded-xl bg-pine-100 p-2.5 text-pine-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-pine-900">{title}</p>
        <p className="text-xs text-paper-500">{desc}</p>
      </div>
    </button>
  );
}

/**
 * WalkInModal — register a walk-in appointment. Captures minimal
 * patient details and a doctor, and creates an immediate appointment.
 */
function WalkInModal({ onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { data: docData } = useResource(
    qk.doctors.list({ limit: 50 }),
    () => doctorApi.list({ limit: 50 })
  );
  const doctors =
    docData?.doctors ||
    docData?.items ||
    (Array.isArray(docData) ? docData : []);

  const { mutate, loading } = useMutation(
    (body) => appointmentApi.walkIn(body),
    {
      invalidate: [qk.appointments.all, qk.patients.all],
      onSuccess: () => {
        notify.success('Walk-in registered.');
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const onSubmit = (values) => {
    mutate({
      doctorId: values.doctorId,
      patient: {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      },
      reason: values.reason || undefined,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Register walk-in"
      description="Add a patient who has arrived without an appointment."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Register walk-in
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            required
            error={errors.firstName?.message}
            {...register('firstName', { required: 'Required' })}
          />
          <Input
            label="Last name"
            required
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Required' })}
          />
        </div>
        <Input
          label="Phone"
          required
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone', { required: 'Phone is required' })}
        />
        <Select
          label="Doctor"
          required
          error={errors.doctorId?.message}
          {...register('doctorId', { required: 'Choose a doctor' })}
        >
          <option value="">Select a doctor…</option>
          {doctors.map((d) => {
            const first = d.user?.firstName || d.firstName || '';
            const last = d.user?.lastName || d.lastName || '';
            return (
              <option key={d.id} value={d.id}>
                Dr. {first} {last}
                {d.speciality ? ` — ${d.speciality}` : ''}
              </option>
            );
          })}
        </Select>
        <Textarea
          label="Reason for visit"
          rows={3}
          placeholder="Briefly describe the reason (optional)."
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
