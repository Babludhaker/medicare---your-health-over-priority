import { useState } from 'react';
import { ClipboardList, ClipboardPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/Dashboard';
import { Toolbar, FilterSelect } from '@/components/ui/Toolbar';
import AppointmentsTable from '@/features/appointments/AppointmentsTable';
import RecordModal from './RecordModal';
import { useResource } from '@/hooks/useResource';
import { appointmentApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';

/**
 * DoctorRecordsPage — a browseable list of the doctor's appointments
 * for writing or reviewing EMR records and prescriptions.
 *
 * Defaults to completed visits (the ones needing records), with a
 * filter to see other statuses.
 */
export default function DoctorRecordsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('COMPLETED');
  const [recordFor, setRecordFor] = useState(null);

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

  const renderActions = (a) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setRecordFor(a)}
    >
      <ClipboardPlus className="h-3.5 w-3.5" />
      Open record
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Records"
        subtitle="Write and review visit notes and e-prescriptions."
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
                { value: 'COMPLETED', label: 'Completed visits' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'all', label: 'All appointments' },
              ]}
            />
          </Toolbar>
        </div>
        <AppointmentsTable
          appointments={appointments}
          loading={loading}
          error={error}
          variant="doctor"
          renderActions={renderActions}
          emptyTitle="No records to show"
          emptyMessage="Completed appointments will appear here for record-keeping."
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {recordFor && (
        <RecordModal
          appointment={recordFor}
          onClose={() => setRecordFor(null)}
          onSaved={() => setRecordFor(null)}
        />
      )}
    </div>
  );
}
