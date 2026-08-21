import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Mail, Phone, UserPlus, X } from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Alert from '../../components/ui/Alert.jsx';
import adminService from '../../services/adminService.js';
import applyServerErrors from '../../utils/formErrors.js';
import { FIELDS, fieldLabel } from '../../constants/domain.js';

/**
 * Mirrors the admin router's body schema, which itself reuses the auth module's
 * emailSchema and passwordSchema.
 *
 * Duplicated deliberately, same reasoning as the register form: this copy gives
 * instant feedback, the server copy is what protects the database. The password
 * rule in particular has to stay identical to authValidators.passwordSchema — an
 * admin-created account must not be held to a weaker rule than a self-registered
 * one.
 */
const schema = z.object({
  name: z.string().trim().min(2, 'Enter their full name').max(80, 'Name cannot exceed 80 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number')
    .or(z.literal('')),
  title: z.string().trim().max(80).or(z.literal('')),
  experienceYears: z.coerce.number().int().min(0, 'Cannot be negative').max(60, 'That seems too high'),
  countries: z
    .string()
    .trim()
    .regex(/^$|^[A-Za-z]{2}(\s*,\s*[A-Za-z]{2})*$/, 'Two-letter codes separated by commas, e.g. CA, DE'),
  languages: z.string().trim().max(200),
  bio: z.string().trim().max(600, 'Keep it under 600 characters'),
  primaryField: z.string(),
});

const FIELD_OPTIONS = [
  { value: '', label: 'No specialism' },
  ...Object.keys(FIELDS).map((slug) => ({ value: slug, label: fieldLabel(slug) })),
];

/** Splits a comma-separated input into trimmed, non-empty entries. */
const splitList = (value) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/**
 * Creates a counsellor login and profile.
 *
 * An inline panel rather than a modal: there is no Modal primitive in the design
 * system yet, and introducing one for a single form would be a larger change
 * than the feature. The panel also keeps the existing list visible, which is
 * useful — an admin adding a counsellor usually wants to see who is already
 * there and how loaded they are.
 *
 * The admin sets the initial password. The alternative — generating one — needs
 * a delivery mechanism, and returning a plaintext credential in an API response
 * is worse than an admin handing it over and the counsellor changing it.
 */
export default function NewCounsellorForm({ onCreated, onCancel }) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      title: 'Education Counsellor',
      experienceYears: 0,
      countries: '',
      languages: 'English',
      bio: '',
      primaryField: '',
    },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const created = await adminService.createCounsellor({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.phone ? { phone: values.phone } : {}),
        ...(values.title ? { title: values.title } : {}),
        ...(values.bio ? { bio: values.bio } : {}),
        experienceYears: values.experienceYears,
        countries: splitList(values.countries).map((code) => code.toUpperCase()),
        languages: splitList(values.languages),
        ...(values.primaryField ? { fields: [values.primaryField] } : {}),
      });

      toast.success(`${created.name} can now sign in`);
      onCreated?.(created);
    } catch (error) {
      // Field-keyed server errors bind straight onto the inputs — a duplicate
      // email belongs on the email field, not in a banner the admin has to map
      // back to a box themselves.
      if (!applyServerErrors(error, setError, ['name', 'email', 'password', 'phone', 'title', 'bio'])) {
        setFormError(error.message);
      }
    }
  };

  return (
    <section className="mt-7 rounded-2xl bg-surface p-6 shadow-sm hairline">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy-950">New counsellor</h2>
          <p className="mt-1 text-sm text-navy-500">
            Creates the login and the profile together. They are bookable immediately, Mon–Fri 10:00–17:00.
          </p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={X} onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {formError && (
        <Alert tone="danger" className="mt-5">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" required error={errors.name?.message} {...register('name')} />
          <Input
            label="Email address"
            type="email"
            required
            leftIcon={Mail}
            hint="This is the address they sign in with."
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Initial password"
            type="password"
            required
            leftIcon={Lock}
            hint="At least 10 characters with a letter and a number. Ask them to change it after first sign-in."
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Phone"
            type="tel"
            optionalLabel
            leftIcon={Phone}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input label="Job title" optionalLabel error={errors.title?.message} {...register('title')} />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={60}
            error={errors.experienceYears?.message}
            {...register('experienceYears')}
          />
          <Input
            label="Destinations they cover"
            optionalLabel
            placeholder="CA, DE, GB"
            hint="Two-letter country codes, comma separated."
            error={errors.countries?.message}
            {...register('countries')}
          />
          <Input
            label="Languages"
            optionalLabel
            placeholder="English, Hindi"
            error={errors.languages?.message}
            {...register('languages')}
          />
          <Select
            label="Main specialism"
            options={FIELD_OPTIONS}
            error={errors.primaryField?.message}
            {...register('primaryField')}
          />
        </div>

        <Input
          containerClassName="mt-4"
          label="Short bio"
          optionalLabel
          placeholder="What they are known for, and who they are best placed to help."
          hint="Students see this when choosing who to book with."
          error={errors.bio?.message}
          {...register('bio')}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" leftIcon={UserPlus} isLoading={isSubmitting}>
            Create counsellor
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
