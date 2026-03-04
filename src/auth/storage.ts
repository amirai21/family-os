/**
 * auth/storage.ts — Persistence helpers for auth session.
 *
 * Session is stored in expo-secure-store (encrypted on device, falls back
 * to localStorage on web).
 */

import { Platform } from "react-native";
import type { AuthSession } from "./types";

// ---------------------------------------------------------------------------
// SecureStore (lazy-loaded; web shim uses localStorage)
// ---------------------------------------------------------------------------

const SESSION_KEY = "familyos_auth_session";

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(key, value);
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(key);
}

// ---------------------------------------------------------------------------
// Session (SecureStore)
// ---------------------------------------------------------------------------

export async function saveSession(session: AuthSession): Promise<void> {
  await secureSet(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await secureGet(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await secureDelete(SESSION_KEY);
}
