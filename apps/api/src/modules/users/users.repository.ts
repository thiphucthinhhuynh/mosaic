import { prisma } from '@/lib/prisma';

export type PublicUser = {
  id: string;
  username: string;
  profilePic: string | null;
};

// Selects only the public-safe columns — passwordHash and email never leave
// the database for this query, rather than being fetched and filtered out
// afterward. See docs/architecture.md §19.
export async function findPublicProfileById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, profilePic: true },
  });
}
