import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, CalendarCheck, HeartPulse } from 'lucide-react';
import Logo from '@/components/layout/Logo';

/**
 * AuthLayout — a two-panel shell for all authentication screens.
 * Left: a branded panel with reassurance points. Right: the form,
 * supplied via <Outlet />.
 */
const POINTS = [
  {
    icon: CalendarCheck,
    title: 'Book in seconds',
    body: 'Live availability across every partner clinic.',
  },
  {
    icon: HeartPulse,
    title: 'Records in one place',
    body: 'Prescriptions and visit history, always to hand.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & secure',
    body: 'Bank-grade security with optional two-factor login.',
  },
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — hidden on small screens */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-pine-900 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-dotted opacity-10" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pine-700/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-clay-500/20 blur-3xl" />

        <div className="relative p-10">
          <Link to="/">
            <Logo mono />
          </Link>
        </div>

        <div className="relative px-10">
          <h2 className="max-w-md font-display text-3xl font-semibold leading-tight text-paper-50">
            Healthcare that respects everyone's time.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-paper-300">
            Join the clinics and patients already using MediCare Connect
            for a calmer, clearer day.
          </p>

          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3.5">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-700/60 text-clay-300">
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-paper-50">
                    {p.title}
                  </p>
                  <p className="text-sm text-paper-400">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative p-10">
          <p className="text-xs text-paper-500">
            © {new Date().getFullYear()} MediCare Connect
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col items-center justify-center bg-paper-50 px-5 py-10 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
