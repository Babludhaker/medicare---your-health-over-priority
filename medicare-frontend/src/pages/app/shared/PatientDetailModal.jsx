import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Spinner, Badge, statusTone } from '@/components/ui/Card';
import { useResource } from '@/hooks/useResource';
import { patientApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { initials, formatDate, formatDateTime } from '@/lib/utils';

/**
 * PatientDetailModal — read-only patient profile with appointment
 * history. Used by the receptionist and doctor dashboards.
 */
export default function PatientDetailModal({ patient, onClose }) {
  const first = patient.firstName || patient.user?.firstName || '';
  const last = patient.lastName || patient.user?.lastName || '';

  const { data: history, loading } = useResource(
    qk.patients.history(patient.id),
    () => patientApi.history(patient.id)
  );

  const visits =
    history?.appointments ||
    history?.history ||
    (Array.isArray(history) ? history : []);

  return (
    <Modal
      open
      onClose={onClose}
      title={`${first} ${last}`}
      description="Patient profile and visit history."
      size="lg"
    >
      <div className="space-y-5">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-100 font-display text-lg font-semibold text-pine-700">
            {initials(first, last)}
          </span>
          <div>
            <p className="font-semibold text-pine-900">
              {first} {last}
            </p>
            <p className="text-sm text-paper-500">
              {patient.gender || 'Gender not set'}
              {patient.dateOfBirth &&
                ` · Born ${formatDate(patient.dateOfBirth)}`}
            </p>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid gap-3 rounded-xl border border-paper-200 bg-paper-100 p-4 sm:grid-cols-2">
          <Detail
            icon={Phone}
            label="Phone"
            value={patient.phone || patient.user?.phone || '—'}
          />
          <Detail
            icon={Mail}
            label="Email"
            value={patient.email || patient.user?.email || '—'}
          />
          <Detail
            icon={MapPin}
            label="Address"
            value={patient.address || '—'}
          />
          <Detail
            icon={Calendar}
            label="Registered"
            value={
              patient.createdAt ? formatDate(patient.createdAt) : '—'
            }
          />
        </div>

        {/* Visit history */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-pine-900">
            <Activity className="h-4 w-4 text-pine-600" />
            Visit history
          </h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={22} />
            </div>
          ) : visits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-paper-300 py-6 text-center text-sm text-paper-500">
              No past visits on record.
            </p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-paper-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-pine-900">
                      {formatDateTime(
                        v.startTime || v.scheduledAt || v.date
                      )}
                    </p>
                    <p className="text-xs text-paper-500">
                      {v.doctor
                        ? `Dr. ${
                            v.doctor.firstName ||
                            v.doctor.user?.firstName ||
                            ''
                          } ${
                            v.doctor.lastName ||
                            v.doctor.user?.lastName ||
                            ''
                          }`
                        : v.reason || 'Visit'}
                    </p>
                  </div>
                  {v.status && (
                    <Badge tone={statusTone(v.status)}>{v.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-paper-400" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-paper-500">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-pine-900">
          {value}
        </p>
      </div>
    </div>
  );
}
