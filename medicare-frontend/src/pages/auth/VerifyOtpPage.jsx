import { useState, useRef } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { notify } from '@/store/ui.store';
import { ROLE_HOME } from '@/lib/constants';
import { errorMessage } from '@/lib/utils';

/**
 * VerifyOtpPage — the second step of a two-factor login.
 *
 * Reachable only when the auth store holds a pendingTwoFactorUserId
 * (set by login() when the backend returns twoFactorRequired). A
 * 6-box OTP input with paste support.
 */
export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const pendingUserId = useAuthStore((s) => s.pendingTwoFactorUserId);

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  // No pending 2FA login — bounce back to /login.
  if (!pendingUserId) {
    return <Navigate to="/login" replace />;
  }

  const code = digits.join('');

  const setDigit = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Handle paste of a full code into one box.
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const next = [...digits];
      for (let i = 0; i < 6; i += 1) {
        if (chars[i]) next[i] = chars[i];
      }
      setDigits(next);
      inputs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, i) => (i === index ? clean : x)));
    if (index < 5) inputs.current[index + 1]?.focus();
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (code.length !== 6) {
      setError('Enter all six digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { user } = await verifyOtp(code);
      notify.success(`Welcome back, ${user.firstName}!`);
      navigate(
        location.state?.from || ROLE_HOME[user.role] || '/app',
        { replace: true }
      );
    } catch (err) {
      setError(errorMessage(err, 'Verification failed'));
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto inline-flex rounded-2xl bg-pine-100 p-4">
        <ShieldCheck className="h-9 w-9 text-pine-700" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-pine-900">
        Two-factor verification
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
        We've sent a 6-digit code to the phone number on your account.
        Enter it below to finish signing in.
      </p>

      {error && (
        <div className="mt-5 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={6}
              className="h-14 w-12 rounded-xl border border-paper-300 bg-paper-50 text-center font-display text-2xl font-semibold text-pine-900 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/20 sm:h-16 sm:w-14"
            />
          ))}
        </div>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="mt-6 w-full"
        >
          Verify & sign in
        </Button>
      </form>

      <button
        onClick={() => navigate('/login')}
        className="mt-5 text-sm font-medium text-pine-600 hover:text-pine-800"
      >
        Back to sign in
      </button>

      <p className="mt-4 text-xs text-paper-400">
        The code expires in 5 minutes. In development, check the backend
        server console for the code.
      </p>
    </div>
  );
}
