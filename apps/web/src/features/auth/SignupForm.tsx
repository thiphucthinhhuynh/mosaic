import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { signupSchema, type SignupInput } from '@mosaic/shared';
import { ApiError } from '@/lib/apiClient';
import { useAuth } from './useAuth';

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupInput) => {
    setFormError(null);
    try {
      await signup(data);
      void navigate('/account');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <div>
        <label htmlFor="signup-username">Username</label>
        <input id="signup-username" type="text" {...register('username')} />
        {errors.username && <p role="alert">{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor="signup-email">Email</label>
        <input id="signup-email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        Sign up
      </button>
    </form>
  );
}
