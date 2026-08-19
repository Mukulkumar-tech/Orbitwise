import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail } from 'lucide-react';

import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS, homeForRole } from '../../constants/routes.js';
import applyServerErrors from '../../utils/formErrors.js';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // Already signed in — skip the form entirely rather than letting a stale tab
  // present a login screen to an authenticated user.
  if (isAuthenticated) return <Navigate to={homeForRole(user.role)} replace />;

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const session = await login(values);
      toast.success(`Welcome back, ${session.user.name.split(' ')[0]}`);
      // Return the user to wherever they were headed before the gate stopped them.
      const intended = location.state?.from?.pathname;
      navigate(intended || homeForRole(session.user.role), { replace: true });
    } catch (error) {
      if (!applyServerErrors(error, setError, ['email', 'password'])) {
        setFormError(error.message);
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your study-abroad plan where you left off."
      footer={
        <p className="text-center text-sm text-navy-500">
          New to Orbitwise?{' '}
          <Link to={PATHS.register} className="font-semibold text-primary-600 hover:text-primary-700">
            Create a free account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={Mail}
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={Lock}
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to={PATHS.forgotPassword}
              className="rounded text-sm font-medium text-navy-500 transition-colors duration-150 hover:text-primary-600"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Signing in…"
          rightIcon={ArrowRight}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
