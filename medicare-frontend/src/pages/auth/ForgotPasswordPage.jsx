import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MailCheck, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { errorMessage } from '@/lib/utils';

/**
 * ForgotPasswordPage — request a password-reset link.
 *
 * The backend always returns success (it never reveals whether an
 * email exists), so we always show the same confirmation screen.
 */
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await authApi.forgotPassword(email);
      setSubmittedEmail(email);
      setSent(true);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not send reset link'));
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-emerald-100 p-4">
          <MailCheck className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          Check your inbox
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          If an account exists for{' '}
          <span className="font-medium text-pine-800">
            {submittedEmail}
          </span>
          , we've sent a link to reset your password. The link expires
          in one hour.
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

  return (
    <div className="animate-fade-up">
      <div className="inline-flex rounded-2xl bg-pine-100 p-3.5">
        <KeyRound className="h-7 w-7 text-pine-700" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-pine-900">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-sm text-paper-500">
        Enter your email and we'll send you a link to reset it.
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
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@clinic.com"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email',
            },
          })}
        />
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paper-500">
        Remembered it?{' '}
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
