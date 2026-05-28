import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './Logo';
import { NAV_BY_ROLE, COMMON_NAV } from '@/router/nav.config';
import { ROLE_LABELS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/**
 * Sidebar — the dashboard's primary navigation.
 *
 * Renders the navigation set for the current user's role. On mobile it
 * behaves as a slide-in drawer controlled by `open` / `onClose`.
 */
export default function Sidebar({ open, onClose }) {
  const { role } = useAuth();
  const items = NAV_BY_ROLE[role] || [];

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-pine-700 text-paper-50'
        : 'text-paper-300 hover:bg-pine-800 hover:text-paper-50'
    );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-pine-950/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-pine-900 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <Logo mono />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-paper-400 hover:bg-pine-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role label */}
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-pine-400">
            {ROLE_LABELS[role] || 'Dashboard'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={linkClass}
              onClick={onClose}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-pine-800" />

          {COMMON_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={linkClass}
              onClick={onClose}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-pine-800 p-4">
          <p className="text-xs text-pine-400">
            MediCare Connect · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
