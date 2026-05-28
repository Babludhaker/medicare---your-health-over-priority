import { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardBody, PageLoader } from '@/components/ui/Card';
import { StatCard, StatGrid, PageHeader } from '@/components/ui/Dashboard';
import { MiniBarChart, DonutStat } from '@/components/ui/Charts';
import { FilterSelect } from '@/components/ui/Toolbar';
import Button from '@/components/ui/Button';
import { useResource } from '@/hooks/useResource';
import { analyticsApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { formatCurrency, errorMessage } from '@/lib/utils';

/**
 * ClinicAnalyticsPage (Clinic Admin) — appointment volume, no-show
 * rate, revenue, and per-doctor breakdown, with CSV export.
 */
const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function ClinicAnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [exporting, setExporting] = useState(false);

  const { data, loading, error } = useResource(
    qk.analytics.clinic({ range }),
    () => analyticsApi.clinic({ range })
  );

  const m = data || {};
  const total = m.totalAppointments ?? m.appointments ?? 0;
  const completed = m.completed ?? m.completedAppointments ?? 0;
  const noShows = m.noShows ?? m.noShowCount ?? 0;
  const revenue = m.revenue ?? 0;
  const noShowRate =
    m.noShowRate ?? (total ? (noShows / total) * 100 : 0);

  const byDoctor =
    m.appointmentsByDoctor ||
    m.byDoctor ||
    (m.doctors
      ? m.doctors.map((d) => ({
          label: d.name,
          value: d.appointments,
        }))
      : []);

  const byStatus =
    m.appointmentsByStatus ||
    m.byStatus ||
    (m.statusBreakdown
      ? Object.entries(m.statusBreakdown).map(([label, value]) => ({
          label,
          value,
        }))
      : []);

  // CSV export — the API returns a blob.
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsApi.exportClinic({ range });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinic-analytics-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify.success('Report downloaded.');
    } catch (err) {
      notify.error(errorMessage(err, 'Export is unavailable right now'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Appointment and revenue trends for your clinic."
        action={
          <div className="flex gap-2">
            <FilterSelect
              value={range}
              onChange={setRange}
              options={RANGES}
            />
            <Button
              variant="outline"
              onClick={handleExport}
              loading={exporting}
            >
              {!exporting && <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </div>
        }
      />

      {loading ? (
        <PageLoader label="Crunching the numbers…" />
      ) : (
        <>
          {error && (
            <Card>
              <CardBody>
                <p className="text-sm text-paper-500">
                  Analytics service unavailable ({error}).
                </p>
              </CardBody>
            </Card>
          )}

          <StatGrid>
            <StatCard
              icon={CalendarDays}
              label="Appointments"
              value={Number(total).toLocaleString('en-IN')}
              tone="pine"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={Number(completed).toLocaleString('en-IN')}
              tone="green"
            />
            <StatCard
              icon={XCircle}
              label="No-shows"
              value={noShows}
              tone="amber"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue"
              value={formatCurrency(revenue)}
              tone="clay"
            />
          </StatGrid>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Appointments by doctor" />
              <CardBody>
                <MiniBarChart items={byDoctor} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="No-show rate" />
              <CardBody className="flex flex-col items-center justify-center">
                <DonutStat
                  percent={noShowRate}
                  label="of appointments"
                  tone={noShowRate > 15 ? 'clay' : 'pine'}
                />
                <p className="mt-3 text-center text-xs text-paper-500">
                  {noShowRate > 15
                    ? 'Higher than ideal — reminders can help.'
                    : 'Healthy — reminders are working.'}
                </p>
              </CardBody>
            </Card>
          </div>

          {byStatus.length > 0 && (
            <Card>
              <CardHeader title="Appointments by status" />
              <CardBody>
                <MiniBarChart items={byStatus} />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
