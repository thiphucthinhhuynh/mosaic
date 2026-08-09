import { createContext } from 'react';
import type { PublicUser, SignupInput, LoginInput } from '@mosaic/shared';

export type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  signup: (input: SignupInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
