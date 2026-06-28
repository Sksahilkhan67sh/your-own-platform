import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { AREA_UNIT_VALUES, AREA_UNIT_LABELS, LAND_STATUS_VALUES } from '@your-own/shared';

const STATUS_LABELS = { available: 'Available', pending: 'Under negotiation', sold: 'Sold' };

const landFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(140),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  areaValue: z.coerce.number().min(0, 'Area cannot be negative'),
  areaUnit: z.enum(AREA_UNIT_VALUES),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  status: z.enum(LAND_STATUS_VALUES),
  featured: z.boolean().optional(),
  whatsappNumberOverride: z
    .string()
    .regex(/^\d{10,15}$/, 'Enter digits only, no symbols (e.g. 919876543210)')
    .optional()
    .or(z.literal('')),
  highlightsText: z.string().optional(),
});

function highlightsToArray(text) {
  return (text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function highlightsToText(arr) {
  return (arr || []).join('\n');
}

export function LandForm({ defaultValues, onSubmit, submitLabel = 'Save listing' }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const { highlights: _highlights, ...restDefaultValues } = defaultValues || {};

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(landFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      areaValue: '',
      areaUnit: 'sqft',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      status: 'available',
      featured: false,
      whatsappNumberOverride: '',
      highlightsText: highlightsToText(defaultValues?.highlights),
      ...restDefaultValues,
    },
  });

  const submitHandler = async (values) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        highlights: highlightsToArray(values.highlightsText),
        latitude: values.latitude === '' ? undefined : values.latitude,
        longitude: values.longitude === '' ? undefined : values.longitude,
        whatsappNumberOverride: values.whatsappNumberOverride || undefined,
      };
      delete payload.highlightsText;
      await onSubmit(payload);
    } catch (err) {
      setServerError(err?.response?.data?.error?.message || 'Could not save this listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">Basics</h2>
        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" rows={5} error={errors.description?.message} {...register('description')} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Price (INR)" type="number" min="0" error={errors.price?.message} {...register('price')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Area" type="number" min="0" error={errors.areaValue?.message} {...register('areaValue')} />
          <Select label="Unit" error={errors.areaUnit?.message} {...register('areaUnit')}>
            {AREA_UNIT_VALUES.map((unit) => (
              <option key={unit} value={unit}>{AREA_UNIT_LABELS[unit]}</option>
            ))}
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">Location</h2>
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State" error={errors.state?.message} {...register('state')} />
          <Input label="Postal code" error={errors.postalCode?.message} {...register('postalCode')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Latitude (optional)"
            type="number"
            step="any"
            error={errors.latitude?.message}
            {...register('latitude')}
          />
          <Input
            label="Longitude (optional)"
            type="number"
            step="any"
            error={errors.longitude?.message}
            {...register('longitude')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">Status & visibility</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {LAND_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
          <Controller
            name="featured"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus-visible:ring-accent"
                />
                Mark as featured on homepage
              </label>
            )}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">More details</h2>
        <Textarea
          label="Highlights (one per line, up to 20)"
          rows={4}
          placeholder={'Borewell on site\nClear & marketable title\nFenced on three sides'}
          error={errors.highlightsText?.message}
          {...register('highlightsText')}
        />
        <Input
          label="WhatsApp number override (optional)"
          placeholder="919876543210"
          hint="Leave blank to use the site's default WhatsApp number from Settings."
          error={errors.whatsappNumberOverride?.message}
          {...register('whatsappNumberOverride')}
        />
      </section>

      {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
