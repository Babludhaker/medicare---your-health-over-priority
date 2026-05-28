import { Badge, statusTone } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatTime } from '@/lib/utils';

/**
 * AppointmentsTable — a shared table for appointment lists, used by
 * the clinic-admin, receptionist, and patient dashboards.
 *
 * `variant` tweaks which columns show:
 *   'clinic'  — show patient + doctor
 *   'patient' — show doctor only
 *   'doctor'  — show patient only
 *
 * `renderActions` (optional) adds a right-aligned actions column.
 */
export default function AppointmentsTable({
  appointments,
  loading,
  error,
  variant = 'clinic',
  onRowClick,
  renderActions,
  emptyTitle = 'No appointments',
  emptyMessage = 'Appointments will appear here once booked.',
}) {
  const patientName = (a) => {
    const p = a.patient || a.patientUser || {};
    const first = p.firstName || p.user?.firstName || '';
    const last = p.lastName || p.user?.lastName || '';
    return `${first} ${last}`.trim() || a.patientName || '—';
  };

  const doctorName = (a) => {
    const d = a.doctor || {};
    const first = d.firstName || d.user?.firstName || '';
    const last = d.lastName || d.user?.lastName || '';
    const name = `${first} ${last}`.trim();
    return name ? `Dr. ${name}` : a.doctorName || '—';
  };

  const columns = [
    {
      key: 'when',
      header: 'Date & time',
      render: (a) => (
        <div>
          <p className="font-semibold text-pine-900">
            {formatDate(a.startTime || a.scheduledAt || a.date)}
          </p>
          <p className="text-xs text-paper-500">
            {formatTime(a.startTime || a.scheduledAt)}
          </p>
        </div>
      ),
    },
    (variant === 'clinic' || variant === 'doctor') && {
      key: 'patient',
      header: 'Patient',
      render: (a) => patientName(a),
    },
    (variant === 'clinic' || variant === 'patient') && {
      key: 'doctor',
      header: 'Doctor',
      render: (a) => (
        <div>
          <p className="text-pine-900">{doctorName(a)}</p>
          {a.doctor?.speciality && (
            <p className="text-xs text-paper-500">
              {a.doctor.speciality}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (a) => (
        <span className="text-paper-600">
          {a.reason || a.notes || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge tone={statusTone(a.status)}>{a.status}</Badge>
      ),
    },
    renderActions && {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => renderActions(a),
    },
  ].filter(Boolean);

  return (
    <DataTable
      columns={columns}
      rows={appointments}
      loading={loading}
      error={error}
      onRowClick={onRowClick}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    />
  );
}
