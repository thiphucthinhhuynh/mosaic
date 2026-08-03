import { NotFoundError } from '@/lib/errors';
import { findPublicProfileById, type PublicUser } from '@/modules/users/users.repository';

export async function getPublicUserById(id: string): Promise<PublicUser> {
  const user = await findPublicProfileById(id);
  if (!user) {
    throw new NotFoundError(`No user found with id "${id}".`);
  }
  return user;
}
