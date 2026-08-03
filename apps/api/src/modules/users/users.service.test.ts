import { describe, it, expect, vi } from 'vitest';
import { NotFoundError } from '@/lib/errors';

vi.mock('@/modules/users/users.repository', () => ({
  findPublicProfileById: vi.fn(),
}));

const { findPublicProfileById } = await import('@/modules/users/users.repository');
const { getPublicUserById } = await import('@/modules/users/users.service');

describe('getPublicUserById', () => {
  it('returns the user when the repository finds one', async () => {
    vi.mocked(findPublicProfileById).mockResolvedValue({
      id: 'abc-123',
      username: 'someone',
      profilePic: null,
    });

    const result = await getPublicUserById('abc-123');

    expect(result).toEqual({ id: 'abc-123', username: 'someone', profilePic: null });
  });

  it('throws NotFoundError when the repository finds no user', async () => {
    vi.mocked(findPublicProfileById).mockResolvedValue(null);

    await expect(getPublicUserById('missing-id')).rejects.toThrow(NotFoundError);
  });
});
