import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';

import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import authService from '../../services/authService.js';
import { PATHS } from '../../constants/routes.js';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState(null);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setFormError(null);
    try {
      await authService.forgotPassword(email);
      // The API returns the same response whether or not the account exists, so
      // this screen must not imply the address was found.
      setSentTo(email);
    } catch (error) {
      setFormError(error.message);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`If an account exists for ${sentTo}, we've sent a link to reset your password. It expires in one hour.`}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-2xl bg-primary-50 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600">
              <MailCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="text-sm leading-relaxed text-navy-600">
              <p className="font-semibold text-navy-900">Didn’t get the email?</p>
              <p className="mt-1">
                Check your spam folder, and confirm you used the address you registered with.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="outline" size="lg" fullWidth onClick={() => onSubmit({ email: getValues('email') })}>
              Resend the link
            </Button>
            <Button as={Link} to={PATHS.login} variant="ghost" size="lg" fullWidth leftIcon={ArrowLeft}>
              Back to sign in
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you registered with and we'll send you a secure reset link."
      footer={
        <p className="text-center text-sm text-navy-500">
          Remembered it?{' '}
          <Link to={PATHS.login} className="font-semibold text-primary-600 hover:text-primary-700">
            Back to sign in
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

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} loadingText="Sending link…">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
