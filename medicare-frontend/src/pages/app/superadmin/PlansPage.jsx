import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Plus, Pencil, Check } from 'lucide-react';
import { Card, CardBody, Badge } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/Dashboard';
import { PageLoader, EmptyState } from '@/components/ui/Card';
import { useResource, useMutation } from '@/hooks/useResource';
import { subscriptionApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { formatCurrency, errorMessage } from '@/lib/utils';

/**
 * PlansPage (Super Admin) — define the subscription plans clinics can
 * subscribe to. Uses the upsert endpoint, keyed by tier.
 */
const TIERS = ['BASIC', 'PRO', 'ENTERPRISE'];

export default function PlansPage() {
  const [editing, setEditing] = useState(null);

  const { data, loading, error } = useResource(
    qk.plans.list(),
    () => subscriptionApi.listPlans()
  );

  const plans = data?.plans || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        subtitle="The plans clinics can choose from."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" />
            New / update plan
          </Button>
        }
      />

      {loading ? (
        <PageLoader label="Loading plans…" />
      ) : error ? (
        <Card>
          <EmptyState title="Couldn't load plans" message={error} />
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No plans defined"
            message="Create the BASIC, PRO, and ENTERPRISE plans clinics will subscribe to."
            action={
              <Button onClick={() => setEditing({})} className="mt-2">
                <Plus className="h-4 w-4" />
                New plan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.tier || plan.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge tone="pine">{plan.tier}</Badge>
                    <h3 className="mt-2 font-display text-xl font-semibold text-pine-900">
                      {plan.name}
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(plan)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="mt-3 font-display text-3xl font-semibold text-pine-900">
                  {formatCurrency(plan.priceMonthly)}
                  <span className="text-sm font-normal text-paper-500">
                    {' '}
                    / month
                  </span>
                </p>

                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-paper-500">Max doctors</dt>
                    <dd className="font-medium text-pine-900">
                      {plan.maxDoctors}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-paper-500">Appointments / mo</dt>
                    <dd className="font-medium text-pine-900">
                      {plan.maxAppointments === -1
                        ? 'Unlimited'
                        : plan.maxAppointments?.toLocaleString('en-IN')}
                    </dd>
                  </div>
                </dl>

                {plan.features?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-paper-200 pt-4">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex gap-2 text-sm text-paper-600"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-pine-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <PlanFormModal
          plan={editing.tier ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/**
 * PlanFormModal — create or update a plan via the upsert endpoint.
 */
function PlanFormModal({ plan, onClose, onSaved }) {
  const isEdit = !!plan;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tier: plan?.tier || 'BASIC',
      name: plan?.name || '',
      priceMonthly: plan?.priceMonthly ?? '',
      maxDoctors: plan?.maxDoctors ?? '',
      maxAppointments: plan?.maxAppointments ?? '',
      features: (plan?.features || []).join('\n'),
    },
  });

  const { mutate, loading } = useMutation(
    (body) => subscriptionApi.upsertPlan(body),
    {
      invalidate: [qk.plans.all],
      onSuccess: () => {
        notify.success('Plan saved.');
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    }
  );

  const onSubmit = (values) => {
    mutate({
      tier: values.tier,
      name: values.name,
      priceMonthly: Number(values.priceMonthly),
      maxDoctors: Number(values.maxDoctors),
      maxAppointments: Number(values.maxAppointments),
      features: values.features
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit ${plan.tier} plan` : 'New / update plan'}
      description="Plans are keyed by tier — saving an existing tier updates it."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Save plan
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-paper-700">
              Tier <span className="text-clay-500">*</span>
            </label>
            <select
              className="h-11 w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 text-paper-900 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/20"
              disabled={isEdit}
              {...register('tier')}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Display name"
            required
            placeholder="Pro"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Price / month (₹)"
            type="number"
            required
            error={errors.priceMonthly?.message}
            {...register('priceMonthly', {
              required: 'Required',
              min: { value: 0, message: 'Must be ≥ 0' },
            })}
          />
          <Input
            label="Max doctors"
            type="number"
            required
            error={errors.maxDoctors?.message}
            {...register('maxDoctors', { required: 'Required' })}
          />
          <Input
            label="Max appointments"
            type="number"
            required
            hint="-1 for unlimited"
            error={errors.maxAppointments?.message}
            {...register('maxAppointments', { required: 'Required' })}
          />
        </div>

        <Textarea
          label="Features"
          rows={5}
          hint="One feature per line."
          placeholder={'Online booking\nE-prescriptions\nSMS reminders'}
          {...register('features')}
        />
      </form>
    </Modal>
  );
}
