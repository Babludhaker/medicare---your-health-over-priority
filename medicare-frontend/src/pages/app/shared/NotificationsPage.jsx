import { Bell, BellOff, Check } from 'lucide-react';
import {
  Card,
  PageLoader,
  EmptyState,
} from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/Dashboard';
import Button from '@/components/ui/Button';
import { useResource, useMutation } from '@/hooks/useResource';
import { notificationApi } from '@/api/resources.api';
import { qk } from '@/lib/queryKeys';
import { notify } from '@/store/ui.store';
import { formatDateTime, cn, errorMessage } from '@/lib/utils';

/**
 * NotificationsPage — the user's reminders and alerts. Available to
 * every authenticated role.
 */
export default function NotificationsPage() {
  const listParams = { limit: 50 };
  const { data, loading, error } = useResource(
    qk.notifications.list(listParams),
    () => notificationApi.list(listParams)
  );

  const notifications =
    data?.notifications ||
    data?.items ||
    (Array.isArray(data) ? data : []);

  const hasUnread = notifications.some((n) => !n.read && !n.readAt);

  const markAll = useMutation(() => notificationApi.markAllRead(), {
    invalidate: [qk.notifications.all],
    onSuccess: () => notify.success('All notifications marked as read.'),
    onError: (err) => notify.error(errorMessage(err)),
  });

  const markOne = useMutation((id) => notificationApi.markRead(id), {
    invalidate: [qk.notifications.all],
    onError: (err) => notify.error(errorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Your reminders and alerts."
        action={
          hasUnread && (
            <Button
              variant="outline"
              onClick={() => markAll.mutate()}
              loading={markAll.loading}
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )
        }
      />

      {loading ? (
        <PageLoader label="Loading notifications…" />
      ) : error ? (
        <Card>
          <EmptyState
            icon={BellOff}
            title="Couldn't load notifications"
            message={error}
          />
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            message="Reminders and alerts will appear here."
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-paper-100">
            {notifications.map((n) => {
              const unread = !n.read && !n.readAt;
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 p-4 transition-colors',
                    unread && 'bg-pine-50/60'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 rounded-lg p-2',
                      unread
                        ? 'bg-pine-100 text-pine-700'
                        : 'bg-paper-100 text-paper-400'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-pine-900">
                      {n.title || n.subject || 'Notification'}
                    </p>
                    {(n.message || n.body) && (
                      <p className="mt-0.5 text-sm text-paper-600">
                        {n.message || n.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-paper-400">
                      {formatDateTime(n.createdAt || n.sentAt)}
                    </p>
                  </div>
                  {unread && (
                    <button
                      onClick={() => markOne.mutate(n.id)}
                      className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-pine-600 transition-colors hover:bg-pine-100"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
