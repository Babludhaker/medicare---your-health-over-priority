import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';

/**
 * PublicFooter — site-wide footer for the marketing pages.
 */
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/pricing', label: 'Pricing' },
      { to: '/doctors', label: 'Find a Doctor' },
      { to: '/register', label: 'Create account' },
      { to: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/about', label: 'Careers' },
      { to: '/about', label: 'Press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/contact', label: 'Privacy Policy' },
      { to: '/contact', label: 'Terms of Service' },
      { to: '/contact', label: 'Data Protection' },
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-pine-800 bg-pine-900 text-paper-200">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand + contact */}
          <div>
            <Logo mono />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-400">
              Modern appointment booking and patient records — built so
              clinics can spend less time on admin and more time on care.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-paper-300">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-clay-300" />
                hello@medicareconnect.app
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-clay-300" />
                +91 731 000 0000
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-clay-300" />
                Indore, Madhya Pradesh, India
              </li>
            </ul>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-paper-50">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={`${link.label}-${i}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-paper-400 transition-colors hover:text-clay-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-pine-800 pt-6 text-sm text-paper-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} MediCare Connect. All rights
            reserved.
          </p>
          <p>Built for clinics that care.</p>
        </div>
      </div>
    </footer>
  );
}
