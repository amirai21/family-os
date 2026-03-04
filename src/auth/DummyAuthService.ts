/**
 * auth/DummyAuthService.ts — Client-side-only auth backed by
 * AsyncStorage (user registry) + SecureStore (session).
 *
 * Replace with ApiAuthService when backend auth is ready.
 */

import type { AuthService } from "./AuthService";
import type { AuthSession, RegisterInput, LoginInput } from "./types";
import {
  saveSession,
  loadSession,
  clearSession,
  saveUserCredentials,
  findUserByUsername,
} from "./storage";
import { familyApi } from "@src/lib/api/endpoints";
import { makeId } from "@src/utils/id";

class DummyAuthServiceImpl implements AuthService {
  async register(input: RegisterInput): Promise<AuthSession> {
    const { username, password } = input;

    // Check if user already exists
    const existing = await findUserByUsername(username);
    if (existing) {
      throw new Error("USERNAME_TAKEN");
    }

    const userId = makeId();
    const now = Date.now();

    // Create a new family in DB (name defaults to username, can be changed later)
    let familyId: string;
    try {
      const newFamily = await familyApi.create({ name: username });
      familyId = newFamily.id;
    } catch {
      // Backend unreachable — fall back to client-side ID
      familyId = makeId();
    }

    const user = { id: userId, username, familyId, createdAt: now };
    const token = `dummy_${userId}_${now}`;
    const session: AuthSession = { token, user, issuedAt: now };

    await saveUserCredentials(username, password, user);
    await saveSession(session);

    return session;
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const { username, password } = input;

    // 1. Try local lookup first (same device that registered)
    const entry = await findUserByUsername(username);
    if (entry) {
      if (entry.password !== password) {
        throw new Error("WRONG_PASSWORD");
      }
      const now = Date.now();
      const token = `dummy_${entry.user.id}_${now}`;
      const session: AuthSession = { token, user: entry.user, issuedAt: now };
      await saveSession(session);
      return session;
    }

    // 2. No local user — check backend for an existing family with this name.
    //    This enables cross-device login (e.g. registered on web, logging in
    //    from iOS simulator). Password check is skipped since we use dummy auth.
    try {
      const family = await familyApi.getByName(username);
      const now = Date.now();
      const userId = makeId();
      const user = { id: userId, username, familyId: family.id, createdAt: now };
      const token = `dummy_${userId}_${now}`;
      const session: AuthSession = { token, user, issuedAt: now };

      // Cache credentials locally so future logins on this device are instant
      await saveUserCredentials(username, password, user);
      await saveSession(session);
      return session;
    } catch {
      // Backend unreachable or family not found → user truly doesn't exist
      throw new Error("USER_NOT_FOUND");
    }
  }

  async logout(): Promise<void> {
    await clearSession();
  }

  async getSession(): Promise<AuthSession | null> {
    return loadSession();
  }
}

/** Singleton instance — swap this export when backend auth is ready. */
export const authService: AuthService = new DummyAuthServiceImpl();
