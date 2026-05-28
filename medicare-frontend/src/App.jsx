import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from '@/router';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth.store';
import ToastHost from '@/components/ui/ToastHost';
import { PageLoader } from '@/components/ui/Card';
import Logo from '@/components/layout/Logo';

/**
 * App — application root.
 *
 * Wraps the app in the React Query provider for server-state caching,
 * then runs the auth bootstrap (rehydrate + revalidate the stored
 * session). Until that first check resolves we show a brief splash,
 * so guarded routes never flash the wrong screen.
 *
 * The React Query Devtools panel is dev-only — it is tree-shaken out
 * of production builds.
 */
export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let active = true;
    bootstrap().finally(() => {
      if (active) setBooted(true);
    });
    return () => {
      active = false;
    };
  }, [bootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      {!booted ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper-50">
          <Logo />
          <PageLoader label="Starting MediCare Connect…" />
        </div>
      ) : (
        <>
          <RouterProvider router={router} />
          <ToastHost />
        </>
      )}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
