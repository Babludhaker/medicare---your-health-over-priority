import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { notify } from "@/store/ui.store";
import { useResource } from "@/hooks/useResource";
import { notificationApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";

/**
 * Topbar — the dashboard header. Holds the mobile menu trigger, a
 * notifications bell, and the user menu (profile / sign out).
 */
export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: countData } = useResource(
    qk.notifications.unreadCount(),
    () => notificationApi.unreadCount(),
    { refetchInterval: 30000 }, // har 30 sec mein check karo
  );
  const unread = countData?.unreadCount ?? 0;

  // Close the user menu on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    notify.info("You have been signed out.");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-paper-200 bg-paper-50/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left — mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-pine-800 hover:bg-paper-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      {/* Right — actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative rounded-lg p-2 text-paper-500 hover:bg-paper-100 hover:text-pine-700"
          aria-label="Notifications"
          onClick={() => navigate("/app/notifications")}
        >
          <Bell className="h-5 w-5" />
          {/* ✅ Sirf unread > 0 ho tab red dot dikhega */}
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-clay-500"></span>
          )}
          {/* ✅ Count badge — 9+ show karo agar zyada ho */}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay-500 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 py-1.5 pl-1.5 pr-2.5 hover:bg-paper-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-700 text-xs font-semibold text-paper-50">
              {initials(user?.firstName, user?.lastName)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-pine-900">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="block text-xs leading-tight text-paper-500">
                {ROLE_LABELS[role]}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-paper-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-paper-200 bg-paper-50 shadow-lift">
              <div className="border-b border-paper-200 px-4 py-3">
                <p className="text-sm font-semibold text-pine-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-paper-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/app/profile");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-100"
              >
                <UserCircle className="h-4 w-4 text-paper-400" />
                Profile & Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 border-t border-paper-200 px-4 py-2.5 text-sm text-clay-600 hover:bg-clay-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
