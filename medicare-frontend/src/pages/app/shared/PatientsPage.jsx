import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/Dashboard';
import { Toolbar } from '@/components/ui/Toolbar';
import { useResource, useMutation } from '@/hooks/useResource';
import { patientApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import {
  initials,
  formatDate,
  fieldErrors,
  errorMessage,
} from '@/lib/utils';
import PatientDetailModal from './PatientDetailModal';

/**
 * PatientsPage — the clinic's patient registry. Shared by the
 * receptionist and doctor dashboards.
 *
 * @param {boolean} canRegister  show the "Register patient" action
 *                               (receptionists yes, doctors no)
 */
export default function PatientsPage({ canRegister = true }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [registering, setRegistering] = useState(false);
  const [viewing, setViewing] = useState(null);

  const params = { page, limit: 10, search: search || undefined };
  const { data, meta, loading, error } = useResource(
    qk.patients.list(params),
    () => patientApi.list(params)
  );

  const patients =
    data?.patients || data?.items || (Array.isArray(data) ? data : []);

  const columns = [
    {
      key: 'name',
      header: 'Patient',
      render: (p) => {
        const first = p.firstName || p.user?.firstName || '';
        const last = p.lastName || p.user?.lastName || '';
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-100 text-xs font-semibold text-pine-700">
              {initials(first, last)}
            </span>
            <div>
              <p className="font-semibold text-pine-900">
                {first} {last}
              </p>
              <p className="text-xs text-paper-500">
                {p.email || p.user?.email || '—'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (p) => p.phone || p.user?.phone || '—',
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (p) => p.gender || '—',
    },
    {
      key: 'dob',
      header: 'Date of birth',
      render: (p) => (p.dateOfBirth ? formatDate(p.dateOfBirth) : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setViewing(p)}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle="The clinic's patient registry."
        action={
          canRegister && (
            <Button onClick={() => setRegistering(true)}>
              <Plus className="h-4 w-4" />
              Register patient
            </Button>
          )
        }
      />

      <Card>
        <div className="p-4">
          <Toolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search by name, email, or phone…"
          />
        </div>
        <DataTable
          columns={columns}
          rows={patients}
          loading={loading}
          error={error}
          onRowClick={(p) => setViewing(p)}
          emptyTitle="No patients yet"
          emptyMessage={
            canRegister
              ? 'Register your first patient to get started.'
              : 'Patients will appear here once registered.'
          }
          emptyAction={
            canRegister && (
              <Button
                onClick={() => setRegistering(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4" />
                Register patient
              </Button>
            )
          }
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {registering && (
        <PatientFormModal
          onClose={() => setRegistering(false)}
          onSaved={() => setRegistering(false)}
        />
      )}

      {viewing && (
        <PatientDetailModal
          patient={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

/**
 * PatientFormModal — register a new patient (receptionist flow).
 */
function PatientFormModal({ onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  const { mutateAsync, loading } = useMutation(
    (body) => patientApi.register(body),
    {
      invalidate: [qk.patients.all],
      onSuccess: () => {
        notify.success('Patient registered.');
        onSaved();
      },
    }
  );

  const onSubmit = async (values) => {
    try {
      await mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
      });
    } catch (err) {
      const fields = fieldErrors(err);
      if (fields) {
        Object.entries(fields).forEach(([n, m]) =>
          setError(n, { message: m })
        );
      } else {
        notify.error(errorMessage(err));
      }
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Register patient"
      description="Add a new patient to the clinic registry."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Register patient
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            required
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            {...register('phone', { required: 'Phone is required' })}
          />
          <Input
            label="Email"
            type="email"
            hint="Optional"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Gender" {...register('gender')}>
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input
            label="Date of birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
        </div>
        <Input
          label="Address"
          placeholder="Street, city, state"
          {...register('address')}
        />
      </form>
    </Modal>
  );
}
