import { CreditCard, Check, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  PageLoader,
  statusTone,
} from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/Dashboard';
import Button from '@/components/ui/Button';
import { useResource, useMutation } from '@/hooks/useResource';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { subscriptionApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { formatCurrency, formatDate, errorMessage } from '@/lib/utils';

/**
 * BillingPage (Clinic Admin) — the clinic's current subscription and
 * the option to change plans.
 */
export default function BillingPage() {
  const confirm = useConfirm();

  const { data: sub, loading: subLoading } = useResource(
    qk.subscription.mine(),
    () => subscriptionApi.mySubscription()
  );

  const { data: planData, loading: plansLoading } = useResource(
    qk.plans.list(),
    () => subscriptionApi.listPlans()
  );

  const plans = planData?.plans || (Array.isArray(planData) ? planData : []);
  const current = sub?.subscription || sub || {};
  const currentTier = current.planTier || current.tier || current.plan?.tier;

  const changePlan = useMutation(
    (tier) => subscriptionApi.subscribe(tier),
    {
      invalidate: [qk.subscription.all],
      onSuccess: () => notify.success('Subscription updated.'),
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const handleChoose = async (plan) => {
    if (plan.tier === currentTier) return;
    const ok = await confirm.ask({
      title: `Switch to ${plan.name}?`,
      message: `Your clinic will move to the ${plan.name} plan at ${formatCurrency(
        plan.priceMonthly
      )}/month. The change applies from your next billing cycle.`,
      confirmLabel: `Switch to ${plan.name}`,
    });
    if (ok) changePlan.mutate(plan.tier);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Your clinic's subscription and plan."
      />

      {/* Current subscription */}
      {subLoading ? (
        <PageLoader label="Loading your subscription…" />
      ) : (
        <Card>
          <CardHeader title="Current subscription" />
          <CardBody>
            {currentTier ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-semibold text-pine-900">
                      {current.plan?.name || currentTier}
                    </span>
                    <Badge tone={statusTone(current.status)}>
                      {current.status || 'ACTIVE'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-paper-500">
                    {current.plan?.priceMonthly != null && (
                      <>
                        {formatCurrency(current.plan.priceMonthly)} / month
                      </>
                    )}
                    {current.currentPeriodEnd && (
                      <>
                        {' · '}Renews{' '}
                        {formatDate(current.currentPeriodEnd)}
                      </>
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-pine-100 p-3 text-pine-700">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-pine-900">
                    No active subscription
                  </p>
                  <p className="text-sm text-paper-500">
                    Choose a plan below to activate your clinic.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Plan options */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-pine-900">
          Available plans
        </h2>
        {plansLoading ? (
          <PageLoader label="Loading plans…" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.tier === currentTier;
              const featured = plan.tier === 'PRO';
              return (
                <Card
                  key={plan.tier}
                  className={
                    isCurrent ? 'ring-2 ring-pine-500' : undefined
                  }
                >
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <Badge tone={featured ? 'clay' : 'pine'}>
                        {plan.tier}
                      </Badge>
                      {isCurrent && (
                        <span className="text-xs font-semibold text-pine-600">
                          Current plan
                        </span>
                      )}
                      {featured && !isCurrent && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-clay-600">
                          <Sparkles className="h-3 w-3" />
                          Popular
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-xl font-semibold text-pine-900">
                      {plan.name}
                    </h3>
                    <p className="mt-1 font-display text-2xl font-semibold text-pine-900">
                      {formatCurrency(plan.priceMonthly)}
                      <span className="text-sm font-normal text-paper-500">
                        {' '}
                        / month
                      </span>
                    </p>

                    <ul className="mt-4 space-y-1.5">
                      {(plan.features?.length
                        ? plan.features
                        : [
                            `Up to ${plan.maxDoctors} doctors`,
                            plan.maxAppointments === -1
                              ? 'Unlimited appointments'
                              : `${plan.maxAppointments} appointments/mo`,
                          ]
                      ).map((f) => (
                        <li
                          key={f}
                          className="flex gap-2 text-sm text-paper-600"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-pine-600" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-5 w-full"
                      variant={isCurrent ? 'outline' : 'primary'}
                      disabled={isCurrent}
                      loading={
                        changePlan.loading &&
                        changePlan.loading === plan.tier
                      }
                      onClick={() => handleChoose(plan)}
                    >
                      {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}
