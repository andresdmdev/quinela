import { defineMiddleware } from 'astro:middleware';

/**
 * Authentication has been disabled.
 * All routes are now public.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  return next();
});
