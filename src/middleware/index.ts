import { defineMiddleware } from 'astro:middleware';

/**
 * Authentication middleware.
 * Currently passes through all requests.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  return next();
});
