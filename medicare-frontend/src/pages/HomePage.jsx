import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  CreditCard,
  BellRing,
  LineChart,
  ArrowRight,
  Star,
  Quote,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/features/public/SectionHeading';

/**
 * HomePage — the marketing landing page.
 *
 * Sections: hero · trust strip · features · how-it-works · roles ·
 * testimonial · CTA.
 */

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Smart scheduling',
    body: 'Real-time slot availability with conflict-free booking. No double-bookings, ever — guaranteed at the database level.',
  },
  {
    icon: Stethoscope,
    title: 'Electronic records',
    body: 'Visit notes, vitals, and e-prescriptions in one timeline. Doctors get full context; receptionists stay out of clinical data.',
  },
  {
    icon: CreditCard,
    title: 'Integrated payments',
    body: 'Collect consultation fees online with automatic invoicing. Refunds follow your cancellation policy.',
  },
  {
    icon: BellRing,
    title: 'Automatic reminders',
    body: '24-hour and 2-hour reminders by email and SMS cut no-shows. Patients always know where to be.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    body: 'Role-based access, account lockout, optional two-factor login, and a complete audit trail on every action.',
  },
  {
    icon: LineChart,
    title: 'Clear analytics',
    body: 'Track appointments, revenue, and no-show rates. Export reports as CSV or PDF whenever you need them.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create your clinic',
    body: 'Register your practice and invite your team — doctors, receptionists, and admins.',
  },
  {
    n: '02',
    title: 'Set availability',
    body: 'Each doctor defines a weekly schedule. Slots generate automatically for patients to book.',
  },
  {
    n: '03',
    title: 'Start seeing patients',
    body: 'Patients book and pay online. You manage the day from one calm, organised dashboard.',
  },
];

const ROLES = [
  {
    title: 'For patients',
    body: 'Find a doctor, book in seconds, pay online, and keep every prescription in one place.',
  },
  {
    title: 'For clinics',
    body: 'Manage staff, departments, and the full appointment lifecycle without the paperwork.',
  },
  {
    title: 'For doctors',
    body: 'See your day at a glance, write records and prescriptions, and never lose patient history.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-dotted opacity-60" />
        <div className="container-page relative pb-20 pt-32 sm:pt-40">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Copy */}
            <div>
              <motion.span
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="eyebrow"
              >
                <span className="h-px w-6 bg-pine-400" />
                Healthcare, simplified
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={1}
                initial="hidden"
                animate="show"
                className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-pine-900 sm:text-6xl"
              >
                Booking appointments,{' '}
                <span className="italic text-clay-600">without the wait.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                initial="hidden"
                animate="show"
                className="mt-5 max-w-xl text-lg leading-relaxed text-paper-600"
              >
                MediCare Connect gives clinics one calm place to manage
                appointments, records, and payments — and gives patients a
                booking experience that actually feels modern.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                initial="hidden"
                animate="show"
                className="mt-8 flex flex-wrap gap-3"
              >
                <Button as={Link} to="/register" size="lg">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  as={Link}
                  to="/doctors"
                  variant="outline"
                  size="lg"
                >
                  Find a doctor
                </Button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={4}
                initial="hidden"
                animate="show"
                className="mt-5 text-sm text-paper-500"
              >
                No credit card required · 14-day trial on every plan
              </motion.p>
            </div>

            {/* Visual — a stylised appointment card stack */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-2xl border border-paper-200 bg-paper-50 p-6 shadow-lift">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-pine-900">
                    Today's schedule
                  </p>
                  <span className="rounded-full bg-pine-100 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
                    8 appointments
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      t: '09:00',
                      n: 'Aarav Sharma',
                      d: 'Dr. Mehta · Cardiology',
                      s: 'Confirmed',
                      tone: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      t: '09:30',
                      n: 'Priya Nair',
                      d: 'Dr. Mehta · Cardiology',
                      s: 'Confirmed',
                      tone: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      t: '10:00',
                      n: 'Walk-in slot',
                      d: 'Open for booking',
                      s: 'Available',
                      tone: 'bg-paper-200 text-paper-600',
                    },
                    {
                      t: '10:30',
                      n: 'Rohan Gupta',
                      d: 'Dr. Mehta · Cardiology',
                      s: 'On hold',
                      tone: 'bg-amber-100 text-amber-800',
                    },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="flex items-center gap-3 rounded-xl border border-paper-200 bg-paper-100/60 p-3"
                    >
                      <span className="font-mono text-sm font-semibold text-pine-700">
                        {row.t}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-pine-900">
                          {row.n}
                        </p>
                        <p className="truncate text-xs text-paper-500">
                          {row.d}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.tone}`}
                      >
                        {row.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating accent card */}
              <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-paper-200 bg-pine-700 p-4 text-paper-50 shadow-lift sm:block">
                <p className="text-2xl font-semibold">98.2%</p>
                <p className="text-xs text-paper-300">
                  Slots booked without conflict
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Trust strip                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="border-y border-paper-200 bg-paper-100">
        <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[
            ['12,000+', 'Appointments booked'],
            ['340+', 'Clinics onboarded'],
            ['1,100+', 'Doctors active'],
            ['4.8 / 5', 'Average clinic rating'],
          ].map(([stat, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-semibold text-pine-800 sm:text-3xl">
                {stat}
              </p>
              <p className="mt-1 text-sm text-paper-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Features                                                   */}
      {/* ---------------------------------------------------------- */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Everything you need"
          title="One platform for the whole practice"
          intro="From the first booking to the final invoice, every part of the appointment lifecycle lives in one considered, dependable system."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="group rounded-2xl border border-paper-200 bg-paper-50 p-6 transition-all hover:border-pine-300 hover:shadow-soft"
            >
              <div className="inline-flex rounded-xl bg-pine-100 p-3 text-pine-700 transition-colors group-hover:bg-pine-700 group-hover:text-paper-50">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-pine-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-600">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* How it works                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-pine-900 py-20 text-paper-100 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="Up and running in three steps"
            intro="No lengthy setup, no migration headaches. Most clinics are taking online bookings the same afternoon."
            className="[&_h2]:text-paper-50 [&_p]:text-paper-300 [&_.eyebrow]:text-clay-300"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="relative rounded-2xl border border-pine-700 bg-pine-800/50 p-6"
              >
                <span className="font-display text-4xl font-semibold text-clay-400">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-paper-50">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-paper-300">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Built for everyone                                         */}
      {/* ---------------------------------------------------------- */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Built for everyone"
          title="Whoever you are, it just fits"
          intro="MediCare Connect adapts to the person using it — a focused view for each role, nothing extra."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="rounded-2xl border border-paper-200 bg-gradient-to-b from-paper-100 to-paper-50 p-7"
            >
              <h3 className="font-display text-xl font-semibold text-pine-900">
                {r.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-paper-600">
                {r.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Testimonial                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="border-y border-paper-200 bg-paper-100 py-20">
        <div className="container-page max-w-3xl text-center">
          <Quote className="mx-auto h-10 w-10 text-clay-400" />
          <blockquote className="mt-5 font-display text-2xl font-medium leading-snug text-pine-900 sm:text-3xl">
            “We cut no-shows by a third in the first month. The front desk
            finally stopped drowning in phone calls — patients just book
            themselves.”
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-1 text-clay-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-sm text-paper-600">
            <span className="font-semibold text-pine-800">
              Dr. Kavita Rao
            </span>{' '}
            · Sunrise Family Clinic, Indore
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Final CTA                                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="container-page py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-pine-800 px-8 py-16 text-center sm:px-16">
          <div className="absolute inset-0 bg-dotted opacity-10" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight text-paper-50 sm:text-4xl">
              Ready to give your clinic a calmer day?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-paper-300">
              Join hundreds of clinics already running on MediCare Connect.
              Set up takes minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/register" variant="accent" size="lg">
                Create your clinic account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                as={Link}
                to="/pricing"
                size="lg"
                variant="outline"
                className="border-pine-500 text-paper-100 hover:bg-pine-700"
              >
                See pricing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
