import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, Phone, Shield, BadgeCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/lib/constants';
import { initials, formatDate } from '@/lib/utils';
import { notify } from '@/store/ui.store';

/**
 * ProfilePage — shows the signed-in user's account details.
 *
 * Read-only for now; profile editing is part of the next build phase.
 * Wired to the live auth store, so it reflects the real session.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    notify.info('You have been signed out.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-pine-900">
        Profile & Settings
      </h1>
      <p className="mt-1.5 text-paper-600">
        Your account details and preferences.
      </p>

      {/* Identity card */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-700 font-display text-xl font-semibold text-paper-50">
              {initials(user?.firstName, user?.lastName)}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-pine-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="pine">{ROLE_LABELS[role]}</Badge>
                {user?.emailVerified && (
                  <Badge tone="green">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account details */}
      <Card className="mt-5">
        <CardHeader title="Account details" />
        <CardBody className="space-y-4">
          <DetailRow
            icon={Mail}
            label="Email address"
            value={user?.email || '—'}
          />
          <DetailRow
            icon={Phone}
            label="Phone number"
            value={user?.phone || 'Not provided'}
          />
          <DetailRow
            icon={Shield}
            label="Two-factor authentication"
            value={user?.twoFactorOn ? 'Enabled' : 'Disabled'}
          />
          {user?.createdAt && (
            <DetailRow
              icon={BadgeCheck}
              label="Member since"
              value={formatDate(user.createdAt)}
            />
          )}
        </CardBody>
      </Card>

      {/* Danger / session */}
      <Card className="mt-5">
        <CardHeader
          title="Session"
          subtitle="Sign out of MediCare Connect on this device."
        />
        <CardBody>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-xs text-paper-400">
        Profile editing and security settings are part of the next
        build phase.
      </p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-paper-100 p-2 text-paper-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-paper-500">
          {label}
        </p>
        <p className="text-sm font-medium text-pine-900">{value}</p>
      </div>
    </div>
  );
}
