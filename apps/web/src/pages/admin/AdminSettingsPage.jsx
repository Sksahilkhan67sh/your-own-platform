import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { fetchAdminSettings, updateAdminSettings } from '../../lib/landApi.js';

const settingsFormSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(80),
  defaultWhatsappNumber: z
    .string()
    .regex(/^\d{10,15}$/, 'Enter digits only, no symbols (e.g. 919876543210)'),
  contactEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  heroHeadline: z.string().max(140).optional(),
  heroSubheadline: z.string().max(240).optional(),
  instagram: z.string().url('Enter a full URL').optional().or(z.literal('')),
  facebook: z.string().url('Enter a full URL').optional().or(z.literal('')),
});

export function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(settingsFormSchema) });

  useEffect(() => {
    fetchAdminSettings()
      .then((settings) => {
        reset({
          siteName: settings.siteName,
          defaultWhatsappNumber: settings.defaultWhatsappNumber,
          contactEmail: settings.contactEmail || '',
          heroHeadline: settings.heroHeadline || '',
          heroSubheadline: settings.heroSubheadline || '',
          instagram: settings.socialLinks?.instagram || '',
          facebook: settings.socialLinks?.facebook || '',
        });
        setIsLoading(false);
      })
      .catch(() => {
        setServerError('Could not load settings. Try refreshing the page.');
        setIsLoading(false);
      });
  }, [reset]);

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await updateAdminSettings({
        siteName: values.siteName,
        defaultWhatsappNumber: values.defaultWhatsappNumber,
        contactEmail: values.contactEmail || undefined,
        heroHeadline: values.heroHeadline || undefined,
        heroSubheadline: values.heroSubheadline || undefined,
        socialLinks: { instagram: values.instagram || '', facebook: values.facebook || '' },
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setServerError(err?.response?.data?.error?.message || 'Could not save settings.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-display-md text-ink">Settings</h1>
      <p className="mt-2 text-ink-soft">
        Changes here apply site-wide — including the WhatsApp number used on every listing that
        doesn't have its own override.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8" noValidate>
        <section className="space-y-4">
          <h2 className="font-display text-lg text-ink">Site identity</h2>
          <Input label="Site name" error={errors.siteName?.message} {...register('siteName')} />
          <Input label="Hero headline" error={errors.heroHeadline?.message} {...register('heroHeadline')} />
          <Textarea label="Hero subheadline" rows={2} error={errors.heroSubheadline?.message} {...register('heroSubheadline')} />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-ink">Contact</h2>
          <Input
            label="Default WhatsApp number"
            placeholder="919876543210"
            hint="Digits only, with country code, no symbols or spaces."
            error={errors.defaultWhatsappNumber?.message}
            {...register('defaultWhatsappNumber')}
          />
          <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-ink">Social links</h2>
          <Input label="Instagram URL" error={errors.instagram?.message} {...register('instagram')} />
          <Input label="Facebook URL" error={errors.facebook?.message} {...register('facebook')} />
        </section>

        {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
        {savedNotice && (
          <p role="status" className="rounded bg-accent-soft px-4 py-2.5 text-sm text-accent-hover">
            Settings saved.
          </p>
        )}

        <div className="flex justify-end border-t border-border pt-6">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
