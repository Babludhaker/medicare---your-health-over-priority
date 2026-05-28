import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

/**
 * ToastHost — renders the toast queue from the UI store. Mount once,
 * near the app root.
 */
const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-600',
    ring: 'border-emerald-200',
  },
  error: {
    icon: AlertCircle,
    accent: 'text-clay-600',
    ring: 'border-clay-200',
  },
  info: {
    icon: Info,
    accent: 'text-sky-600',
    ring: 'border-sky-200',
  },
};

export default function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-paper-50 p-3.5 shadow-lift',
                style.ring
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.accent)} />
              <div className="min-w-0 flex-1">
                {t.title && (
                  <p className="text-sm font-semibold text-pine-900">
                    {t.title}
                  </p>
                )}
                <p className="text-sm text-paper-600">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-paper-400 transition-colors hover:bg-paper-100 hover:text-paper-700"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
