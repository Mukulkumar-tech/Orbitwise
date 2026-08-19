import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import authService from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS, homeForRole } from '../../constants/routes.js';

const schema = z
  .object({
    password: z
      .string()
      .min(10, 'Use at least 10 characters')
      .regex(/[a-zA-Z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async ({ password }) => {
    setFormError(null);
    try {
      // A successful reset signs the user straight in — the API returns a fresh
      // session, so making them re-enter the password they just chose would be
      // busywork.
      const session = await authService.resetPassword({ token, password });
      setUser(session.user);
      toast.success('Password updated. All other devices were signed out.');
      navigate(homeForRole(session.user.role), { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you haven't used elsewhere. Every other signed-in device will be logged out."
      footer={
        <p className="text-center text-sm text-navy-500">
          Link expired?{' '}
          <Link to={PATHS.forgotPassword} className="font-semibold text-primary-600 hover:text-primary-700">
            Request a new one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          leftIcon={Lock}
          required
          hint="Use 10+ characters with at least one letter and one number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          leftIcon={Lock}
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} loadingText="Updating password…">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
