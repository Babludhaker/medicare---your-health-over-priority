import { Link } from "react-router-dom";
import {
  Building2,
  CreditCard,
  CalendarDays,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  PageLoader,
  EmptyState,
} from "@/components/ui/Card";
import { StatCard, StatGrid, PageHeader } from "@/components/ui/Dashboard";
import { MiniBarChart } from "@/components/ui/Charts";
import Button from "@/components/ui/Button";
import { useResource } from "@/hooks/useResource";
import { useAuth } from "@/hooks/useAuth";
import { analyticsApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { formatCurrency } from "@/lib/utils";

/**
 * PlatformOverviewPage (Super Admin) — the landing dashboard. Pulls
 * platform-wide analytics and presents headline metrics.
 */
export default function PlatformOverviewPage() {
  const { user } = useAuth();
  const { data, loading, error } = useResource(
    qk.analytics.platform({ scope: "overview" }),
    () => analyticsApi.platform(),
  );

  const m = data || {};

  // ✅ Backend nested structure se seedha read karo
  const totalClinics = m.clinics?.total ?? m.totalClinics ?? 0;
  const activeClinics = m.clinics?.active ?? 0;
  const totalAppointments = m.totals?.appointments ?? m.totalAppointments ?? 0;
  const totalUsers = m.totals?.users ?? 0;
  const mrr = m.subscriptions?.mrr ?? m.mrr ?? 0;
  const activeSubs = m.subscriptions?.byStatus
    ? Object.values(m.subscriptions.byStatus).reduce((a, b) => a + b, 0)
    : (m.activeSubscriptions ?? 0);

  const planBreakdown =
    m.planBreakdown ||
    (m.subscriptions?.tierMix
      ? Object.entries(m.subscriptions.tierMix).map(([label, value]) => ({
          label,
          value,
        }))
      : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.firstName || "Admin"}`}
        subtitle="Platform health across all clinic tenants."
      />

      {loading ? (
        <PageLoader label="Loading platform analytics…" />
      ) : (
        <>
          {error && (
            <Card>
              <CardBody>
                <p className="text-sm text-paper-500">
                  Live analytics are unavailable right now. Showing latest known
                  values.
                </p>
              </CardBody>
            </Card>
          )}

          <StatGrid>
            <StatCard
              icon={Building2}
              label="Total clinics"
              value={totalClinics}
              tone="pine"
            />
            <StatCard
              icon={CreditCard}
              label="Active subscriptions"
              value={activeSubs}
              tone="green"
            />
            <StatCard
              icon={CalendarDays}
              label="Appointments (all-time)"
              value={Number(totalAppointments).toLocaleString("en-IN")}
              tone="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Monthly recurring revenue"
              value={formatCurrency(mrr)}
              tone="clay"
            />
          </StatGrid>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Subscriptions by plan" />
              <CardBody>
                {planBreakdown.length ? (
                  <MiniBarChart items={planBreakdown} />
                ) : (
                  <p className="py-6 text-center text-sm text-paper-500">
                    No subscription data yet.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Quick actions" />
              <CardBody className="space-y-3">
                <ActionRow
                  to="/app/clinics"
                  title="Manage clinics"
                  desc="Create, edit, or deactivate clinic tenants."
                />
                <ActionRow
                  to="/app/plans"
                  title="Subscription plans"
                  desc="Adjust pricing and plan limits."
                />
                <ActionRow
                  to="/app/insights"
                  title="Platform analytics"
                  desc="Dig into usage and revenue trends."
                />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
function ActionRow({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-paper-200 p-3.5 transition-colors hover:border-pine-300 hover:bg-pine-50"
    >
      <div>
        <p className="text-sm font-semibold text-pine-900">{title}</p>
        <p className="text-xs text-paper-500">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-paper-400" />
    </Link>
  );
}
