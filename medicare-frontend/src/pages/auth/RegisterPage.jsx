import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { notify } from '@/store/ui.store';
import { errorMessage, fieldErrors } from '@/lib/utils';

/**
 * RegisterPage — patient self-registration.
 *
 * The backend only allows PATIENT self-signup; clinic staff are
 * created by a clinic admin. On success we show a confirmation rather
 * than auto-logging in, since email verification may be pending.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      });
      setDone(true);
      notify.success('Account created — you can now sign in.');
    } catch (err) {
      // Surface field-level validation errors from the API.
      const fields = fieldErrors(err);
      if (fields) {
        Object.entries(fields).forEach(([name, message]) =>
          setError(name, { message })
        );
      }
      setFormError(errorMessage(err, 'Could not create account'));
    }
  };

  if (done) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-emerald-100 p-4">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-pine-900">
          You're all set
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-600">
          Your account has been created. If email verification is
          enabled for your clinic, check your inbox for a verification
          link.
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
      <h1 className="text-2xl font-semibold text-pine-900">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-paper-500">
        Book appointments and manage your health records in one place.
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            placeholder="Asha"
            required
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'First name is required',
            })}
          />
          <Input
            label="Last name"
            placeholder="Verma"
            required
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Last name is required',
            })}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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

        <Input
          label="Phone number"
          type="tel"
          placeholder="+91 98765 43210"
          hint="Optional — used for SMS reminders and 2FA."
          error={errors.phone?.message}
          {...register('phone', {
            minLength: { value: 6, message: 'Phone number looks too short' },
          })}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Use at least 8 characters',
            },
          })}
        />

        <Input
          label="Confirm password"
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
          {!isSubmitting && <UserPlus className="h-4 w-4" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paper-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-pine-700 hover:text-pine-900"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-paper-400">
        Running a clinic? Clinic accounts are set up by our team —{' '}
        <Link to="/contact" className="underline hover:text-pine-600">
          get in touch
        </Link>
        .
      </p>
    </div>
  );
}
