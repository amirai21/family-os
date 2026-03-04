/**
 * auth/AuthService.ts — Interface for auth operations.
 *
 * Consumers depend on this interface only. Swap DummyAuthService for
 * ApiAuthService later without changing UI code.
 */

import type { AuthSession, RegisterInput, LoginInput } from "./types";

export interface AuthService {
  register(input: RegisterInput): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
}
