import { randomUUID } from "expo-crypto";

export function makeId(): string {
  return randomUUID();
}
