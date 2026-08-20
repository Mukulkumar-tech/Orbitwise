import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail, Phone, User } from 'lucide-react';

import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS, homeForRole } from '../../constants/routes.js';
import applyServerErrors from '../../utils/formErrors.js';

/**
 * Mirrors server/validators/authValidators.js.
 *
 * Duplicated deliberately: the client copy gives instant feedback, the server
 * copy is the one that actually protects the database. Neither is redundant —
 * but they must agree, so any change here needs the same change there.
 */
const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80, 'Name cannot exceed 80 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number')
    .or(z.literal('')),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});

export default function Register() {
  const { register: createAccount, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  if (isAuthenticated) return <Navigate to={homeForRole(user.role)} replace />;

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const session = await createAccount(values);
      toast.success('Account created — check your email to verify it.');
      // Phase 5 redirects students to /onboarding instead: the profile is what
      // powers every recommendation, so it becomes the real next step.
      navigate(homeForRole(session.user.role), { replace: true });
    } catch (error) {
      if (!applyServerErrors(error, setError, ['name', 'email', 'phone', 'password'])) {
        setFormError(error.message);
      }
    }
  };

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Build your profile once, then get university and course matches tailored to you."
      footer={
        <p className="text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link to={PATHS.login} className="font-semibold text-primary-700 hover:text-primary-800">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          leftIcon={User}
          required
          error={errors.name?.message}
          {...register('name')}
        />

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

        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          leftIcon={Phone}
          optionalLabel
          hint="Used only if your counsellor needs to reach you."
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          leftIcon={Lock}
          required
          hint="Use 10+ characters with at least one letter and one number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Creating account…"
          rightIcon={ArrowRight}
        >
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-navy-400">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
