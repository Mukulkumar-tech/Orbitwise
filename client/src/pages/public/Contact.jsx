import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, Mail, MessageSquare, Phone, Send, User } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Alert from '../../components/ui/Alert.jsx';
import publicService from '../../services/publicService.js';
import { PATHS } from '../../constants/routes.js';
import { EDUCATION_LEVEL_ORDER, educationLabel } from '../../constants/domain.js';
import applyServerErrors from '../../utils/formErrors.js';

/** Mirrors server/validators/publicValidators.js — both must agree. */
const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number')
    .or(z.literal('')),
  educationLevel: z.string(),
  message: z.string().trim().min(10, 'Tell us a little more — at least 10 characters').max(2000),
});

export default function Contact() {
  const [submitted, setSubmitted] = useState(null);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', educationLevel: '', message: '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const result = await publicService.submitEnquiry(values);
      setSubmitted(result);
    } catch (error) {
      if (!applyServerErrors(error, setError, ['name', 'email', 'phone', 'educationLevel', 'message'])) {
        setFormError(error.message);
      }
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Counselling"
        title="Book a free counselling session"
        description="Tell us where you are academically and what you are aiming for. A counsellor will come back to you with realistic options — no charge, no obligation."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Contact' }]}
      />

      <div className="container-page py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          {/* ─── Form ─────────────────────────────────────────────── */}
          <div>
            {submitted ? (
              <div className="rounded-2xl bg-surface p-8 shadow-md hairline">
                <div className="flex size-12 items-center justify-center rounded-xl bg-success-50 text-success-600">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-navy-950">
                  Thanks, {submitted.name.split(' ')[0]}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-navy-600">
                  Your enquiry is logged and a counsellor will be in touch. Your reference is{' '}
                  <code className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-xs text-navy-800">
                    {submitted.reference.slice(-8)}
                  </code>
                  .
                </p>
                <p className="mt-5 text-sm leading-relaxed text-navy-600">
                  In the meantime, build your profile — the counsellor can then discuss your actual matched courses
                  rather than generalities.
                </p>
                <Button as="a" href={PATHS.register} className="mt-7">
                  Build my profile
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {formError && <Alert tone="danger">{formError}</Alert>}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Your name" leftIcon={User} required error={errors.name?.message} {...register('name')} />
                  <Input
                    label="Email"
                    type="email"
                    leftIcon={Mail}
                    required
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Phone"
                    type="tel"
                    leftIcon={Phone}
                    optionalLabel
                    placeholder="+91 98765 43210"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Select
                    label="Current education"
                    optionalLabel
                    error={errors.educationLevel?.message}
                    {...register('educationLevel')}
                  >
                    <option value="">Prefer not to say</option>
                    {EDUCATION_LEVEL_ORDER.map((level) => (
                      <option key={level} value={level}>
                        {educationLabel(level)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy-800">
                    What would you like help with?
                    <span className="ml-0.5 text-danger-600" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    aria-invalid={errors.message ? true : undefined}
                    placeholder="For example: I finished Class 12 with 78% in commerce and my budget is around ₹20L a year. Which countries are realistic?"
                    className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-3 text-sm text-navy-900 transition-[border-color,box-shadow] duration-150 placeholder:text-navy-400 hover:border-navy-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p role="alert" className="mt-1.5 text-sm text-danger-600">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" isLoading={isSubmitting} loadingText="Sending…" rightIcon={Send}>
                  Request counselling
                </Button>
              </form>
            )}
          </div>

          {/* ─── Aside ────────────────────────────────────────────── */}
          <aside className="space-y-6">
            <div className="rounded-2xl bg-navy-950 p-6">
              <h2 className="text-base font-semibold text-white">What happens next</h2>
              <ol className="mt-5 space-y-4 text-sm text-navy-300">
                {[
                  'A counsellor reviews what you have told us',
                  'They come back with destinations and courses that fit your marks and budget',
                  'You decide whether to go further — nothing is charged',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs text-primary-300">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-sm hairline">
              <h2 className="text-base font-semibold text-navy-950">Reach us directly</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
                  <a href="mailto:hello@orbitwise.dev" className="text-navy-700 hover:text-primary-700">
                    hello@orbitwise.dev
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
                  <a href="tel:+919000000000" className="text-navy-700 hover:text-primary-700">
                    +91 90000 00000
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
                  <span className="text-navy-700">Mon–Sat, 10am–7pm IST</span>
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-5">
              <MessageSquare className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-navy-700">
                Already have a profile? Your counsellor can see your matched courses, which makes the first conversation
                far more concrete.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
