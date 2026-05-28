import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { notify } from '@/store/ui.store';
import { errorMessage } from '@/lib/utils';

/**
 * ResetPasswordPage — set a new password using the token from the
 * reset email (passed as ?token= in the URL).
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async ({ password: pwd }) => {
    setFormError('');
    try {
      await authApi.resetPassword(token, pwd);
      setDone(true);
      notify.success('Password updated — you can now sign in.');
    } catch (err) {
      setFormError(errorMessage(err, 'Could not reset password'));
    }
  };

  // No token in the URL — the link is malformed or missing.
  if (!token) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-amber-100 p-4">
          <AlertTriangle className="h-9 w-9 text-amber-600" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Invalid reset link
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          This password reset link is missing or malformed. Please
          request a new one.
        </p>
        <Button
          as={Link}
          to="/forgot-password"
          size="lg"
          className="mt-6 w-full"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-emerald-100 p-4">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Password updated
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          Your password has been changed. For security, any other
          active sessions have been signed out.
        </p>
        <Button
          onClick={() => navigate('/login')}
          size="lg"
          className="mt-6 w-full"
        >
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="inline-flex rounded-2xl bg-pine-100 p-3.5">
        <KeyRound className="h-7 w-7 text-pine-700" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-pine-900">
        Set a new password
      </h1>
      <p className="mt-1.5 text-sm text-paper-500">
        Choose a strong password you haven't used before.
      </p>

      {formError && (
        <div className="mt-5 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
          {formError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Use at least 8 characters' },
          })}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          })}
        />
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paper-500">
        <Link
          to="/login"
          className="font-semibold text-pine-700 hover:text-pine-900"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
