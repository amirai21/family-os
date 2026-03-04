import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { pushTokens } from "../db/schema.js";

export const pushTokensRepo = {
  async register(familyId: string, token: string) {
    const [row] = await db
      .insert(pushTokens)
      .values({ familyId, token })
      .onConflictDoUpdate({
        target: [pushTokens.familyId, pushTokens.token],
        set: { updatedAt: new Date() },
      })
      .returning();
    return row;
  },

  async listByFamily(familyId: string) {
    return db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.familyId, familyId));
  },

  async deleteByToken(token: string) {
    await db.delete(pushTokens).where(eq(pushTokens.token, token));
  },
};
