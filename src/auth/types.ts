/**
 * auth/types.ts — Data models for the auth layer.
 *
 * Kept backend-agnostic so DummyAuthService can be swapped for
 * ApiAuthService without touching consumers.
 */

export type AuthUser = {
  id: string;
  username: string;
  familyId: string;
  createdAt: number;
};

export type AuthSession = {
  /** Opaque token string (dummy for now, JWT later). */
  token: string;
  user: AuthUser;
  issuedAt: number;
};

export type RegisterInput = {
  username: string;
  password: string;
  /** Optional code to join an existing family. */
  familyCode?: string;
};

export type LoginInput = {
  username: string;
  password: string;
};
