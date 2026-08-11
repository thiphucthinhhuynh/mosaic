import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(4).max(30),
  email: z.email(),
  password: z.string().min(8),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
