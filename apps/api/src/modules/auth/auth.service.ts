import type { PublicUser, SignupInput, LoginInput } from '@mosaic/shared';
import { ConflictError, UnauthorizedError } from '@/lib/errors';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signAuthToken } from '@/lib/jwt';
import {
  createUser,
  findUserByEmail,
  findByUsernameOrEmailCaseInsensitive,
} from '@/modules/auth/auth.repository';
import { findPublicProfileById } from '@/modules/users';

type AuthResult = { user: PublicUser; token: string };

function toPublicUser(user: {
  id: string;
  username: string;
  profilePic: string | null;
}): PublicUser {
  return { id: user.id, username: user.username, profilePic: user.profilePic };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await findByUsernameOrEmailCaseInsensitive(input.username, input.email);
  if (existing) {
    throw new ConflictError('Username or email is already taken.');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    username: input.username,
    email: input.email,
    passwordHash,
  });

  return { user: toPublicUser(user), token: signAuthToken(user.id) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);

  // Same error for "no such user" and "wrong password" — distinguishing them
  // would let an attacker enumerate registered emails. See docs/api/authentication.md.
  const invalidCredentials = () => new UnauthorizedError('Invalid email or password.');

  if (!user) {
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw invalidCredentials();
  }

  return { user: toPublicUser(user), token: signAuthToken(user.id) };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await findPublicProfileById(userId);
  if (!user) {
    // A structurally valid, unexpired JWT for a user that no longer exists
    // (e.g. deleted elsewhere) — from the client's point of view the session
    // is simply invalid, not a 404.
    throw new UnauthorizedError('Session is no longer valid.');
  }
  return user;
}
