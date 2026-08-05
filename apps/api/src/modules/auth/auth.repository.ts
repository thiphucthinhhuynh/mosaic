import { Prisma, type User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type NewUserInput = {
  username: string;
  email: string;
  passwordHash: string;
};

// Full row, including passwordHash — unlike users.repository's public-safe
// selects, auth genuinely needs the hash to verify a login attempt.
export async function createUser(input: NewUserInput): Promise<User> {
  return prisma.user.create({ data: input });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

// Case-insensitive existence check for signup. The DB's unique constraint on
// username/email is case-sensitive (Postgres default collation — see
// docs/architecture.md §19), so without this, "JohnDoe" and "johndoe" could
// both sign up as distinct accounts. Uses Prisma's built-in `insensitive`
// query mode rather than a schema/migration change (e.g. citext) — this is
// an application-level check, not a DB-level guarantee, so the DB's
// case-sensitive unique constraint remains as a defense-in-depth backstop
// against a race between two concurrent signups.
export async function findByUsernameOrEmailCaseInsensitive(
  username: string,
  email: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: Prisma.QueryMode.insensitive } },
        { email: { equals: email, mode: Prisma.QueryMode.insensitive } },
      ],
    },
  });
}
