/**
 * Safe to import from client components.
 * Does NOT re-export auth/client/api — those use node:fs and
 * must only be imported in server components or route handlers.
 * For server-only exports, import from '@/lib/reckon/server'.
 */

export { isReckonConfigured } from './config'
export type * from './types'
