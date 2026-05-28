import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Card';
import SectionHeading from '@/features/public/SectionHeading';
import { subscriptionApi } from '@/api/resources.api';
import { formatCurrency, errorMessage } from '@/lib/utils';

/**
 * PricingPage — pulls live subscription plans from the backend
 * (`GET /subscriptions/plans`) and falls back to a static catalogue if
 * the API is unreachable, so the marketing page is never blank.
 */

// Fallback used only if the API call fails.
const FALLBACK_PLANS = [
  {
    tier: 'BASIC',
    name: 'Basic',
    priceMonthly: 999,
    maxDoctors: 3,
    maxAppointments: 300,
    features: [
      'Up to 3 doctors',
      'Online appointment booking',
      'Patient records & e-prescriptions',
      'Email reminders',
      'Basic analytics',
    ],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    priceMonthly: 2999,
    maxDoctors: 15,
    maxAppointments: 2000,
    features: [
      'Up to 15 doctors',
      'Everything in Basic',
      'SMS reminders',
      'Online payments & invoicing',
      'Advanced analytics & exports',
      'Priority support',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthly: 7999,
    maxDoctors: 100,
    maxAppointments: -1,
    features: [
      'Unlimited doctors',
      'Everything in Pro',
      'Unlimited appointments',
      'Dedicated account manager',
      'Custom onboarding',
      'SLA-backed support',
    ],
  },
];

const TIER_NOTE = {
  BASIC: 'For small practices finding their feet.',
  PRO: 'For growing clinics that need the full toolkit.',
  ENTERPRISE: 'For multi-department centres at scale.',
};

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every plan starts with a 14-day trial. No credit card needed to begin.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time from your clinic settings; changes apply from the next billing cycle.',
  },
  {
    q: 'What happens if I exceed my plan limits?',
    a: 'The platform will let you know as you approach a limit. You can upgrade in a couple of clicks — no data is ever lost.',
  },
  {
    q: 'How does billing work?',
    a: 'Plans are billed monthly via secure online payment. You get an invoice automatically for every charge.',
  },
];

function planAppointments(plan) {
  return plan.maxAppointments === -1
    ? 'Unlimited appointments'
    : `${plan.maxAppointments.toLocaleString('en-IN')} appointments / month`;
}

export default function PricingPage() {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await subscriptionApi.listPlans();
        const list = data?.plans || [];
        if (active) {
          if (list.length) {
            // Order tiers consistently.
            const order = { BASIC: 0, PRO: 1, ENTERPRISE: 2 };
            list.sort((a, b) => (order[a.tier] ?? 9) - (order[b.tier] ?? 9));
            setPlans(list);
          } else {
            setPlans(FALLBACK_PLANS);
            setUsedFallback(true);
          }
        }
      } catch (err) {
        // API unreachable — show the static catalogue instead of an error.
        // eslint-disable-next-line no-console
        console.warn('Pricing fell back to static plans:', errorMessage(err));
        if (active) {
          setPlans(FALLBACK_PLANS);
          setUsedFallback(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-dotted opacity-60" />
        <div className="container-page relative pb-12 pt-32 text-center sm:pt-40">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="eyebrow justify-center"
          >
            <span className="h-px w-6 bg-pine-400" />
            Pricing
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-pine-900 sm:text-5xl"
          >
            Simple pricing that grows with you
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl text-lg text-paper-600"
          >
            One transparent monthly price per clinic. No per-booking fees,
            no surprises. Every plan starts with a 14-day free trial.
          </motion.p>
        </div>
      </section>

      {/* Plans */}
      <section className="container-page pb-8 pt-4 sm:pt-8">
        {loading ? (
          <PageLoader label="Loading plans…" />
        ) : (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const featured = plan.tier === 'PRO';
              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={
                    'relative flex flex-col rounded-2xl border p-7 ' +
                    (featured
                      ? 'border-pine-700 bg-pine-900 text-paper-100 shadow-lift lg:-my-3 lg:py-10'
                      : 'border-paper-200 bg-paper-50')
                  }
                >
                  {featured && (
                    <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-paper-50">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </span>
                  )}

                  <h3
                    className={
                      'font-display text-xl font-semibold ' +
                      (featured ? 'text-paper-50' : 'text-pine-900')
                    }
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={
                      'mt-1 text-sm ' +
                      (featured ? 'text-paper-300' : 'text-paper-500')
                    }
                  >
                    {TIER_NOTE[plan.tier] || 'A plan for your clinic.'}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span
                      className={
                        'font-display text-4xl font-semibold ' +
                        (featured ? 'text-paper-50' : 'text-pine-900')
                      }
                    >
                      {formatCurrency(plan.priceMonthly)}
                    </span>
                    <span
                      className={
                        'text-sm ' +
                        (featured ? 'text-paper-400' : 'text-paper-500')
                      }
                    >
                      / month
                    </span>
                  </div>

                  <Button
                    as={Link}
                    to="/register"
                    variant={featured ? 'accent' : 'primary'}
                    size="lg"
                    className="mt-6 w-full"
                  >
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <ul className="mt-7 space-y-3">
                    {(plan.features?.length
                      ? plan.features
                      : [
                          `Up to ${plan.maxDoctors} doctors`,
                          planAppointments(plan),
                        ]
                    ).map((feat) => (
                      <li key={feat} className="flex gap-2.5 text-sm">
                        <Check
                          className={
                            'mt-0.5 h-4 w-4 shrink-0 ' +
                            (featured ? 'text-clay-300' : 'text-pine-600')
                          }
                        />
                        <span
                          className={
                            featured ? 'text-paper-200' : 'text-paper-600'
                          }
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}

        {usedFallback && !loading && (
          <p className="mt-6 text-center text-xs text-paper-400">
            Showing standard plans. Connect to the API to display live
            pricing.
          </p>
        )}
      </section>

      {/* FAQ */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Questions"
          title="Pricing, answered"
          intro="Everything you might want to know before getting started."
        />
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-paper-200 rounded-2xl border border-paper-200 bg-paper-50">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-pine-900">
                {faq.q}
                <span className="text-clay-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-paper-600">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="rounded-3xl bg-pine-800 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold text-paper-50 sm:text-3xl">
            Still deciding? Try it free for 14 days.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-paper-300">
            Full access to every feature during your trial. No card, no
            commitment.
          </p>
          <Button
            as={Link}
            to="/register"
            variant="accent"
            size="lg"
            className="mt-7"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
