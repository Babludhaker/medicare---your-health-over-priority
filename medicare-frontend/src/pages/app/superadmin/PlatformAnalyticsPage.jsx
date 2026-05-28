import { useState } from 'react';
import { CalendarDays, Users, Building2, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody, PageLoader } from '@/components/ui/Card';
import { StatCard, StatGrid, PageHeader } from '@/components/ui/Dashboard';
import { MiniBarChart, TrendList } from '@/components/ui/Charts';
import { FilterSelect } from '@/components/ui/Toolbar';
import { useResource } from '@/hooks/useResource';
import { analyticsApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';

/**
 * PlatformAnalyticsPage (Super Admin) — deeper platform analytics with
 * a selectable time range.
 */
const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function PlatformAnalyticsPage() {
  const [range, setRange] = useState('30d');

  const { data, loading, error } = useResource(
    qk.analytics.platform({ range }),
    () => analyticsApi.platform({ range })
  );

  const m = data || {};
  const appointments = m.totalAppointments ?? m.appointments ?? 0;
  const newClinics = m.newClinics ?? 0;
  const newUsers = m.newUsers ?? m.newPatients ?? 0;
  const revenue = m.revenue ?? m.mrr ?? 0;

  const byTier = m.planBreakdown || m.subscriptionsByTier || [];
  const topClinics =
    m.topClinics ||
    (m.clinicsByVolume
      ? m.clinicsByVolume.map((c) => ({
          label: c.name,
          value: c.appointments,
        }))
      : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        subtitle="Usage and revenue across all clinics."
        action={
          <FilterSelect
            value={range}
            onChange={setRange}
            options={RANGES}
          />
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
              value={Number(appointments).toLocaleString('en-IN')}
              hint="In selected period"
              tone="pine"
            />
            <StatCard
              icon={Building2}
              label="New clinics"
              value={newClinics}
              hint="In selected period"
              tone="green"
            />
            <StatCard
              icon={Users}
              label="New users"
              value={Number(newUsers).toLocaleString('en-IN')}
              hint="In selected period"
              tone="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue"
              value={formatCurrency(revenue)}
              hint="In selected period"
              tone="clay"
            />
          </StatGrid>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Top clinics by volume"
                subtitle="Most appointments in the period."
              />
              <CardBody>
                <MiniBarChart items={topClinics} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Subscriptions by tier" />
              <CardBody>
                {byTier.length ? (
                  <TrendList
                    rows={byTier.map((t) => ({
                      label: t.label,
                      value: t.value,
                    }))}
                  />
                ) : (
                  <p className="py-6 text-center text-sm text-paper-500">
                    No subscription data for this period.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
