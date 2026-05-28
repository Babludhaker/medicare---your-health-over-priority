import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, MailCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Card';
import { authApi } from '@/api/auth.api';
import { errorMessage } from '@/lib/utils';

/**
 * VerifyEmailPage — confirms an email address using the token from the
 * verification email (?token= in the URL). Runs the check once on mount.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  // 'verifying' | 'success' | 'error' | 'no-token'
  const [state, setState] = useState(token ? 'verifying' : 'no-token');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // guard against double-run in StrictMode
    (async () => {
      try {
        await authApi.verifyEmail(token);
        setState('success');
      } catch (err) {
        setState('error');
        setMessage(errorMessage(err, 'Verification failed'));
      }
    })();
  }, [token]);

  if (state === 'verifying') {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-pine-100 p-4">
          <Spinner size={34} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Verifying your email…
        </h1>
        <p className="mt-2 text-sm text-paper-600">
          This will only take a moment.
        </p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-emerald-100 p-4">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Email verified
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          Thanks — your email address is confirmed. You can now sign in
          and start using MediCare Connect.
        </p>
        <Button as={Link} to="/login" size="lg" className="mt-6 w-full">
          Continue to sign in
        </Button>
      </div>
    );
  }

  if (state === 'no-token') {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-pine-100 p-4">
          <MailCheck className="h-9 w-9 text-pine-700" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Check your email
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          Open the verification link we sent to your inbox to confirm
          your address. The link will bring you back here.
        </p>
        <Button
          as={Link}
          to="/login"
          size="lg"
          variant="outline"
          className="mt-6 w-full"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  // state === 'error'
  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto inline-flex rounded-2xl bg-amber-100 p-4">
        <AlertTriangle className="h-9 w-9 text-amber-600" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-pine-900">
        Verification failed
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
        {message ||
          'This verification link is invalid or has expired. Try signing in to request a new one.'}
      </p>
      <Button as={Link} to="/login" size="lg" className="mt-6 w-full">
        Go to sign in
      </Button>
    </div>
  );
}
