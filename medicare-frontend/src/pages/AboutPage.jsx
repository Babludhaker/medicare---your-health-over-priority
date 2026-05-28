import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Target, Users, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/features/public/SectionHeading';

/**
 * AboutPage — company story, values, and team.
 */

const VALUES = [
  {
    icon: Heart,
    title: 'Care comes first',
    body: 'Every decision is measured against one question: does this give clinicians more time with patients?',
  },
  {
    icon: Shield,
    title: 'Trust is earned',
    body: 'Health data is sensitive. We treat security and privacy as features, not afterthoughts.',
  },
  {
    icon: Target,
    title: 'Simple over clever',
    body: 'Software should disappear into the work. We obsess over removing steps, not adding them.',
  },
  {
    icon: Users,
    title: 'Built with clinics',
    body: 'Every feature starts as a conversation with a real front desk, doctor, or practice manager.',
  },
];

const TEAM = [
  { name: 'Ananya Desai', role: 'Co-founder & CEO', initials: 'AD' },
  { name: 'Vikram Iyer', role: 'Co-founder & CTO', initials: 'VI' },
  { name: 'Sara Mathew', role: 'Head of Product', initials: 'SM' },
  { name: 'Dr. Imran Khan', role: 'Clinical Advisor', initials: 'IK' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-dotted opacity-60" />
        <div className="container-page relative pb-16 pt-32 text-center sm:pt-40">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="eyebrow justify-center"
          >
            <span className="h-px w-6 bg-pine-400" />
            Our story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-pine-900 sm:text-5xl"
          >
            We're making healthcare admin{' '}
            <span className="italic text-clay-600">quietly effortless</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-paper-600"
          >
            MediCare Connect began with a simple frustration: clinics were
            losing hours every day to scheduling, paperwork, and missed
            appointments. We thought software could do better.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="container-page py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our mission"
              title="Give clinics their time back"
              align="left"
            />
            <div className="mt-5 space-y-4 text-base leading-relaxed text-paper-600">
              <p>
                A clinic's day is full of small, repetitive tasks —
                confirming appointments, chasing payments, finding the
                right file. None of it is care, but all of it takes time
                away from care.
              </p>
              <p>
                We built MediCare Connect to absorb that work. One system
                that handles booking, records, payments, and reminders, so
                the people in the building can focus on the people they're
                treating.
              </p>
              <p>
                Today the platform serves hundreds of clinics — from
                single-doctor practices to multi-department centres — and
                the goal has never changed.
              </p>
            </div>
          </div>

          {/* Stat panel */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['2023', 'Founded in Indore'],
              ['340+', 'Clinics served'],
              ['12k+', 'Appointments monthly'],
              ['32%', 'Average drop in no-shows'],
            ].map(([stat, label], i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="rounded-2xl border border-paper-200 bg-paper-100 p-6"
              >
                <p className="font-display text-3xl font-semibold text-pine-800">
                  {stat}
                </p>
                <p className="mt-1 text-sm text-paper-500">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-pine-900 py-20 text-paper-100 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we believe"
            title="The principles behind the product"
            className="[&_h2]:text-paper-50 [&_p]:text-paper-300 [&_.eyebrow]:text-clay-300"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="flex gap-4 rounded-2xl border border-pine-700 bg-pine-800/50 p-6"
              >
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clay-500/20 text-clay-300">
                  <v.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-paper-50">
                    {v.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper-300">
                    {v.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="The people"
          title="A small team with clinical roots"
          intro="Engineers, designers, and clinicians working side by side — because good health software can't be built in isolation from the people who use it."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.name}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="rounded-2xl border border-paper-200 bg-paper-50 p-6 text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-pine-100 font-display text-2xl font-semibold text-pine-700">
                {m.initials}
              </div>
              <h3 className="mt-4 font-semibold text-pine-900">{m.name}</h3>
              <p className="mt-0.5 text-sm text-paper-500">{m.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="rounded-3xl border border-paper-200 bg-paper-100 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold text-pine-900 sm:text-3xl">
            Want to be part of the story?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-paper-600">
            Whether you run a clinic or want to join the team, we'd love to
            hear from you.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/register" size="lg">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button as={Link} to="/contact" variant="outline" size="lg">
              Contact us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
