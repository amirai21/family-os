/**
 * auth/storage.ts — Persistence helpers for auth data.
 *
 * Session: stored in expo-secure-store (encrypted on device, falls back
 *   to localStorage on web — acceptable for a dummy auth POC).
 * User registry: stored in AsyncStorage (plain JSON, device-only).
 *
 * TODO: Replace plain-text password storage with proper hashing when
 *       migrating to real backend auth.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession, AuthUser } from "./types";

// ---------------------------------------------------------------------------
// SecureStore (lazy-loaded; web shim uses localStorage)
// ---------------------------------------------------------------------------

const SESSION_KEY = "familyos_auth_session";
const USERS_KEY = "familyos_auth_users";

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

// ---------------------------------------------------------------------------
// Dummy user registry (AsyncStorage)
//
// Shape stored: Record<username, { password: string; user: AuthUser }>
// TODO: Hash passwords when moving to real auth.
// ---------------------------------------------------------------------------

type UserEntry = { password: string; user: AuthUser };
type UsersMap = Record<string, UserEntry>;

async function loadUsersMap(): Promise<UsersMap> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UsersMap;
  } catch {
    return {};
  }
}

async function persistUsersMap(map: UsersMap): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(map));
}

export async function saveUserCredentials(
  username: string,
  password: string,
  user: AuthUser,
): Promise<void> {
  const map = await loadUsersMap();
  map[username.toLowerCase()] = { password, user };
  await persistUsersMap(map);
}

export async function findUserByUsername(
  username: string,
): Promise<UserEntry | null> {
  const map = await loadUsersMap();
  return map[username.toLowerCase()] ?? null;
}
