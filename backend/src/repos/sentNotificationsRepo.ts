import { eq, and, lt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sentNotifications } from "../db/schema.js";

export const sentNotificationsRepo = {
  async exists(
    familyEventId: string,
    reminderMinutes: number,
    eventDate: string,
  ): Promise<boolean> {
    const rows = await db
      .select({ id: sentNotifications.id })
      .from(sentNotifications)
      .where(
        and(
          eq(sentNotifications.familyEventId, familyEventId),
          eq(sentNotifications.reminderMinutes, reminderMinutes),
          eq(sentNotifications.eventDate, eventDate),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  async create(
    familyEventId: string,
    reminderMinutes: number,
    eventDate: string,
  ) {
    await db
      .insert(sentNotifications)
      .values({ familyEventId, reminderMinutes, eventDate })
      .onConflictDoNothing();
  },

  /** Clean up old records (older than 7 days) to prevent table bloat. */
  async cleanOld() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db
      .delete(sentNotifications)
      .where(lt(sentNotifications.sentAt, cutoff));
  },
};
