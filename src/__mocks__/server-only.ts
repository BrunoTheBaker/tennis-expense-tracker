// No-op mock for 'server-only' in Vitest.
// The real package throws when imported from a client bundle —
// in Vitest (Node.js) that guard is irrelevant.
export {}
