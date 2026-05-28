import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Stethoscope, ArrowRight, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SectionHeading from '@/features/public/SectionHeading';

/**
 * DoctorsPage — a public "find a doctor" directory.
 *
 * The backend's doctor listing is tenant-scoped and requires auth, so
 * this public page shows a curated showcase and routes visitors to
 * register / sign in to book. The showcase is illustrative content.
 */

const SPECIALITIES = [
  'All',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'General Medicine',
];

const DOCTORS = [
  {
    name: 'Dr. Meera Mehta',
    speciality: 'Cardiology',
    clinic: 'Sunrise Family Clinic',
    city: 'Indore',
    exp: 14,
    initials: 'MM',
  },
  {
    name: 'Dr. Arjun Pillai',
    speciality: 'Pediatrics',
    clinic: 'Little Steps Clinic',
    city: 'Bhopal',
    exp: 9,
    initials: 'AP',
  },
  {
    name: 'Dr. Sneha Kulkarni',
    speciality: 'Dermatology',
    clinic: 'GlowCare Skin Centre',
    city: 'Indore',
    exp: 11,
    initials: 'SK',
  },
  {
    name: 'Dr. Rahul Verma',
    speciality: 'Orthopedics',
    clinic: 'BoneWell Hospital',
    city: 'Ujjain',
    exp: 17,
    initials: 'RV',
  },
  {
    name: 'Dr. Anjali Rao',
    speciality: 'General Medicine',
    clinic: 'CityCare Clinic',
    city: 'Indore',
    exp: 8,
    initials: 'AR',
  },
  {
    name: 'Dr. Imran Sheikh',
    speciality: 'Cardiology',
    clinic: 'Heartline Centre',
    city: 'Bhopal',
    exp: 21,
    initials: 'IS',
  },
];

export default function DoctorsPage() {
  const [query, setQuery] = useState('');
  const [speciality, setSpeciality] = useState('All');

  const filtered = DOCTORS.filter((d) => {
    const matchesSpeciality =
      speciality === 'All' || d.speciality === speciality;
    const matchesQuery =
      !query ||
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.clinic.toLowerCase().includes(query.toLowerCase()) ||
      d.city.toLowerCase().includes(query.toLowerCase());
    return matchesSpeciality && matchesQuery;
  });

  return (
    <>
      {/* Hero + search */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-dotted opacity-60" />
        <div className="container-page relative pb-12 pt-32 text-center sm:pt-40">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="eyebrow justify-center"
          >
            <span className="h-px w-6 bg-pine-400" />
            Find a doctor
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-pine-900 sm:text-5xl"
          >
            The right doctor, a few clicks away
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl text-lg text-paper-600"
          >
            Browse specialists across our partner clinics. Create an
            account to see live availability and book instantly.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mx-auto mt-8 flex max-w-md items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, clinic, or city…"
                className="h-12 w-full rounded-xl border border-paper-300 bg-paper-50 pl-10 pr-4 text-sm text-paper-900 placeholder:text-paper-400 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/20"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter chips */}
      <section className="container-page pt-10">
        <div className="flex flex-wrap justify-center gap-2">
          {SPECIALITIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpeciality(s)}
              className={
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
                (speciality === s
                  ? 'bg-pine-700 text-paper-50'
                  : 'border border-paper-300 text-paper-600 hover:border-pine-300 hover:text-pine-700')
              }
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Doctor grid */}
      <section className="container-page py-12">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Stethoscope className="mx-auto h-10 w-10 text-paper-300" />
            <p className="mt-3 font-semibold text-pine-900">
              No doctors match your search
            </p>
            <p className="mt-1 text-sm text-paper-500">
              Try a different speciality or search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.06, duration: 0.4 }}
                className="group flex flex-col rounded-2xl border border-paper-200 bg-paper-50 p-6 transition-all hover:border-pine-300 hover:shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-100 font-display text-xl font-semibold text-pine-700">
                    {d.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-pine-900">
                      {d.name}
                    </h3>
                    <p className="text-sm text-clay-600">{d.speciality}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-paper-600">
                  <p className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-paper-400" />
                    {d.exp} years experience
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-paper-400" />
                    {d.clinic}, {d.city}
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/register"
                  variant="outline"
                  size="sm"
                  className="mt-5 w-full"
                >
                  Book appointment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="rounded-3xl border border-paper-200 bg-paper-100 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold text-pine-900 sm:text-3xl">
            Run a clinic? List your doctors here.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-paper-600">
            Join MediCare Connect and let patients discover and book your
            practice online.
          </p>
          <Button as={Link} to="/register" size="lg" className="mt-7">
            Register your clinic
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
