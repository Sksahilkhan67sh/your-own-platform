import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { fetchPublicSettings } from '../../lib/landApi.js';

const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    fetchPublicSettings()
      .then(setBranding)
      .catch(() => setBranding(null));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'ACCOUNT_LOCKED') {
        setServerError('This account is temporarily locked due to repeated failed attempts. Please try again later.');
      } else {
        setServerError('Incorrect email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundStyle = branding?.loginBackgroundUrl
    ? {
        backgroundImage: `linear-gradient(rgba(43,38,32,0.35), rgba(43,38,32,0.35)), url(${branding.loginBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-4" style={backgroundStyle}>
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-card">
        {branding?.loginLogoUrl ? (
          <img src={branding.loginLogoUrl} alt="" className="h-10 w-10 object-contain" />
        ) : (
          <p className="font-display text-xl text-ink">{branding?.siteName || 'YOUR OWN'}</p>
        )}
        <h1 className="mt-1 text-sm uppercase tracking-wide text-ink-soft">
          {branding?.loginWelcomeHeading || 'Admin sign in'}
        </h1>
        {branding?.loginWelcomeDescription && (
          <p className="mt-1 text-sm text-ink-soft">{branding.loginWelcomeDescription}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p role="alert" className="text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
