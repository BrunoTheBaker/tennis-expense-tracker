export type AuthErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'INACTIVITY_TIMEOUT'

export class ReckonAuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code)
    this.name = 'ReckonAuthError'
  }
}
