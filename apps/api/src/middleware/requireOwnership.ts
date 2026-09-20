import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

type OwnedResource = { ownerId: string };

// Generic resource-loader ownership middleware (docs/architecture.md §7):
// loads the resource identified by req.params.id via `loadResource`, then
// compares its ownerId to the authenticated user. 404s if the resource
// doesn't exist, 403s if it exists but belongs to someone else. Must run
// after requireAuth — req.user is assumed to already be set.
//
// `loadResource` only needs to resolve to `{ ownerId }`, so the same
// middleware works for resources owned indirectly through a relation (e.g. an
// item whose owner is its store's owner), not just a direct ownerId column.
export function requireOwnership(loadResource: (id: string) => Promise<OwnedResource | null>) {
  return (req: Request<{ id: string }>, _res: Response, next: NextFunction) => {
    loadResource(req.params.id)
      .then((resource) => {
        if (!resource) {
          next(new NotFoundError(`No resource found with id "${req.params.id}".`));
          return;
        }
        if (resource.ownerId !== req.user!.id) {
          next(new ForbiddenError('You do not have permission to modify this resource.'));
          return;
        }
        next();
      })
      .catch(next);
  };
}
