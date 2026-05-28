import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { notify } from '@/store/ui.store';
import { ROLE_HOME } from '@/lib/constants';
import { errorMessage } from '@/lib/utils';

/**
 * LoginPage — email + password sign-in.
 *
 * If the account has two-factor enabled, the backend responds with
 * `twoFactorRequired` instead of tokens; we then route to /verify-otp.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Where to go after login — back to the page the user wanted, or
  // their role's home dashboard.
  const redirectTo = location.state?.from || null;

  const onSubmit = async ({ email, password }) => {
    setFormError('');
    try {
      const result = await login(email, password);

      if (result.twoFactorRequired) {
        notify.info('Enter the code we sent to finish signing in.');
        navigate('/verify-otp', { state: { from: redirectTo } });
        return;
      }

      notify.success(`Welcome back, ${result.user.firstName}!`);
      navigate(redirectTo || ROLE_HOME[result.user.role] || '/app', {
        replace: true,
      });
    } catch (err) {
      setFormError(errorMessage(err, 'Could not sign in'));
    }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold text-pine-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-paper-500">
        Sign in to your MediCare Connect account.
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

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
            })}
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-pine-600 hover:text-pine-800"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          {!isSubmitting && <LogIn className="h-4 w-4" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paper-500">
        New to MediCare Connect?{' '}
        <Link
          to="/register"
          className="font-semibold text-pine-700 hover:text-pine-900"
        >
          Create an account
        </Link>
      </p>

      {/* Demo credentials hint — remove in production */}
      <div className="mt-6 rounded-xl border border-paper-200 bg-paper-100 p-3.5">
        <p className="text-xs font-semibold text-paper-600">
          Demo accounts (password: ChangeMe123!)
        </p>
        <p className="mt-1 text-xs leading-relaxed text-paper-500">
          superadmin@medicare.test · admin@democlinic.test ·
          doctor@democlinic.test · reception@democlinic.test ·
          patient@democlinic.test
        </p>
      </div>
    </div>
  );
}
