import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Stethoscope, CalendarClock, Pencil } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/Dashboard';
import { Toolbar } from '@/components/ui/Toolbar';
import { useResource, useMutation } from '@/hooks/useResource';
import { doctorApi, departmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { initials, errorMessage } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/dates';

/**
 * DoctorsAdminPage (Clinic Admin) — manage doctor profiles and their
 * weekly availability.
 */
export default function DoctorsAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editProfile, setEditProfile] = useState(null);
  const [editAvailability, setEditAvailability] = useState(null);

  const params = { page, limit: 10, search: search || undefined };
  const { data, meta, loading, error } = useResource(
    qk.doctors.list(params),
    () => doctorApi.list(params)
  );

  const doctors =
    data?.doctors || data?.items || (Array.isArray(data) ? data : []);

  const columns = [
    {
      key: 'name',
      header: 'Doctor',
      render: (d) => {
        const first = d.user?.firstName || d.firstName || '';
        const last = d.user?.lastName || d.lastName || '';
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-100 text-xs font-semibold text-pine-700">
              {initials(first, last)}
            </span>
            <div>
              <p className="font-semibold text-pine-900">
                Dr. {first} {last}
              </p>
              <p className="text-xs text-paper-500">
                {d.user?.email || d.email || '—'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'speciality',
      header: 'Speciality',
      render: (d) => d.speciality || d.specialization || '—',
    },
    {
      key: 'department',
      header: 'Department',
      render: (d) => d.department?.name || '—',
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (d) =>
        d.consultationFee != null ? `₹${d.consultationFee}` : '—',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditProfile(d)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditAvailability(d)}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Availability
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        subtitle="Doctor profiles, specialities, and weekly availability."
      />

      <Card>
        <div className="p-4">
          <Toolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search doctors…"
          />
        </div>
        <DataTable
          columns={columns}
          rows={doctors}
          loading={loading}
          error={error}
          emptyTitle="No doctors yet"
          emptyMessage="Add doctors from the Staff tab — they'll appear here for profile setup."
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {editProfile && (
        <DoctorProfileModal
          doctor={editProfile}
          onClose={() => setEditProfile(null)}
          onSaved={() => setEditProfile(null)}
        />
      )}

      {editAvailability && (
        <AvailabilityModal
          doctor={editAvailability}
          onClose={() => setEditAvailability(null)}
          onSaved={() => setEditAvailability(null)}
        />
      )}
    </div>
  );
}

/**
 * DoctorProfileModal — edit a doctor's speciality, department, fee,
 * and bio.
 */
function DoctorProfileModal({ doctor, onClose, onSaved }) {
  const { data: deptData } = useResource(
    qk.departments.list(),
    () => departmentApi.list()
  );
  const departments =
    deptData?.departments || (Array.isArray(deptData) ? deptData : []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      speciality: doctor.speciality || doctor.specialization || '',
      departmentId: doctor.departmentId || doctor.department?.id || '',
      consultationFee: doctor.consultationFee ?? '',
      slotDuration: doctor.slotDuration ?? 30,
      bio: doctor.bio || '',
    },
  });

  const { mutate, loading } = useMutation(
    (body) => doctorApi.update(doctor.id, body),
    {
      invalidate: [qk.doctors.all],
      onSuccess: () => {
        notify.success('Doctor profile updated.');
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const onSubmit = (values) => {
    mutate({
      speciality: values.speciality || undefined,
      departmentId: values.departmentId || undefined,
      consultationFee:
        values.consultationFee !== ''
          ? Number(values.consultationFee)
          : undefined,
      slotDuration: Number(values.slotDuration),
      bio: values.bio || undefined,
    });
  };

  const first = doctor.user?.firstName || doctor.firstName || '';
  const last = doctor.user?.lastName || doctor.lastName || '';

  return (
    <Modal
      open
      onClose={onClose}
      title={`Dr. ${first} ${last}`}
      description="Update this doctor's professional profile."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Save profile
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Speciality"
            placeholder="e.g. Cardiology"
            error={errors.speciality?.message}
            {...register('speciality')}
          />
          <Select label="Department" {...register('departmentId')}>
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Consultation fee (₹)"
            type="number"
            placeholder="500"
            error={errors.consultationFee?.message}
            {...register('consultationFee')}
          />
          <Select label="Slot duration" {...register('slotDuration')}>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </Select>
        </div>
        <Textarea
          label="Bio"
          rows={3}
          placeholder="A short professional bio shown to patients."
          {...register('bio')}
        />
      </form>
    </Modal>
  );
}

/**
 * AvailabilityModal — set a doctor's weekly recurring availability.
 * Each weekday can be toggled on with a start and end time.
 */
function AvailabilityModal({ doctor, onClose, onSaved }) {
  // Seed from existing availability if present.
  const existing = doctor.availability || doctor.availabilitySlots || [];
  const seed = WEEKDAYS.map((_, idx) => {
    const found = existing.find(
      (s) => s.dayOfWeek === idx || s.day === idx
    );
    return {
      dayOfWeek: idx,
      enabled: !!found,
      startTime: found?.startTime || '09:00',
      endTime: found?.endTime || '17:00',
    };
  });

  const [days, setDays] = useState(seed);

  const { mutate, loading } = useMutation(
    (slots) => doctorApi.setAvailability(doctor.id, slots),
    {
      invalidate: [qk.doctors.all],
      onSuccess: () => {
        notify.success('Availability updated.');
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const update = (idx, patch) =>
    setDays((d) =>
      d.map((day, i) => (i === idx ? { ...day, ...patch } : day))
    );

  const save = () => {
    const slots = days
      .filter((d) => d.enabled)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
      }));
    mutate(slots);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Weekly availability"
      description="Turn on the days this doctor sees patients and set the hours. Bookable slots generate automatically."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={loading}>
            Save availability
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {days.map((day, idx) => (
          <div
            key={day.dayOfWeek}
            className={
              'flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ' +
              (day.enabled
                ? 'border-pine-200 bg-pine-50'
                : 'border-paper-200 bg-paper-50')
            }
          >
            <label className="flex w-32 items-center gap-2.5">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) =>
                  update(idx, { enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-paper-300 text-pine-600 focus:ring-pine-500"
              />
              <span className="text-sm font-medium text-pine-900">
                {WEEKDAYS[day.dayOfWeek]}
              </span>
            </label>

            {day.enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) =>
                    update(idx, { startTime: e.target.value })
                  }
                  className="h-9 rounded-lg border border-paper-300 bg-paper-50 px-2 text-sm focus:border-pine-500 focus:outline-none"
                />
                <span className="text-paper-400">to</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) =>
                    update(idx, { endTime: e.target.value })
                  }
                  className="h-9 rounded-lg border border-paper-300 bg-paper-50 px-2 text-sm focus:border-pine-500 focus:outline-none"
                />
              </div>
            ) : (
              <span className="text-sm text-paper-400">Not available</span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
