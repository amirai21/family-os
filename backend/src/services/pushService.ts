/**
 * pushService.ts — Check for due event reminders and send push notifications
 *
 * Called by Cloud Scheduler every minute via POST /v1/notifications/check.
 * Uses the Expo Push API (free, no credentials needed).
 */

import { isNotNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { familyEvents } from "../db/schema.js";
import { pushTokensRepo } from "../repos/pushTokensRepo.js";
import { sentNotificationsRepo } from "../repos/sentNotificationsRepo.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const TZ = "Asia/Jerusalem";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: "default";
  channelId?: string;
}

export async function checkAndSendReminders(): Promise<{
  sent: number;
  errors: number;
}> {
  // 1. Get current time in Asia/Jerusalem
  const now = new Date();
  const jerusalemStr = now.toLocaleString("en-US", { timeZone: TZ });
  const jerusalemNow = new Date(jerusalemStr);
  const currentDow = jerusalemNow.getDay(); // 0 = Sun
  const currentMinutes =
    jerusalemNow.getHours() * 60 + jerusalemNow.getMinutes();
  const todayYMD = formatYMD(jerusalemNow);

  console.log(
    `[push] Checking reminders: DOW=${currentDow}, minute=${currentMinutes}, date=${todayYMD}`,
  );

  // 2. Fetch all family events that have reminders set
  const events = await db
    .select()
    .from(familyEvents)
    .where(isNotNull(familyEvents.reminders));

  let sent = 0;
  let errors = 0;

  for (const event of events) {
    if (!event.reminders) continue;

    let reminders: number[];
    try {
      reminders = JSON.parse(event.reminders);
    } catch {
      continue;
    }
    if (!Array.isArray(reminders) || reminders.length === 0) continue;

    // 3. Determine if this event occurs today
    const eventDate = getEventDateForToday(event, currentDow, todayYMD);
    if (!eventDate) continue;

    // 4. For each reminder offset, check if it's due NOW
    for (const offsetMinutes of reminders) {
      const reminderMinute = event.startMinutes - offsetMinutes;

      // Skip if the reminder time is outside today (before midnight or after)
      if (reminderMinute < 0 || reminderMinute > 1439) continue;
      // Only fire if current minute matches
      if (currentMinutes !== reminderMinute) continue;

      // 5. Check if already sent (dedup)
      const alreadySent = await sentNotificationsRepo.exists(
        event.id,
        offsetMinutes,
        eventDate,
      );
      if (alreadySent) continue;

      // 6. Get all push tokens for this family
      const tokens = await pushTokensRepo.listByFamily(event.familyId);
      if (tokens.length === 0) continue;

      // 7. Build notification messages
      const timeLabel = formatReminderLabel(offsetMinutes);
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: event.title,
        body: timeLabel,
        data: { eventId: event.id },
        sound: "default" as const,
        channelId: "reminders",
      }));

      // 8. Send via Expo Push API
      try {
        await sendExpoPush(messages);
        await sentNotificationsRepo.create(event.id, offsetMinutes, eventDate);
        sent += messages.length;
        console.log(
          `[push] Sent ${messages.length} notification(s) for "${event.title}" (${offsetMinutes}min before)`,
        );
      } catch (err) {
        console.error("[push] Failed to send:", err);
        errors++;
      }
    }
  }

  // Periodic cleanup of old sent_notifications
  await sentNotificationsRepo.cleanOld();

  return { sent, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventDateForToday(
  event: { isRecurring: boolean; dayOfWeek: number; date: string | null },
  currentDow: number,
  todayYMD: string,
): string | null {
  if (event.isRecurring) {
    return event.dayOfWeek === currentDow ? todayYMD : null;
  } else {
    return event.date === todayYMD ? todayYMD : null;
  }
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatReminderLabel(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return days === 1 ? "מחר" : `בעוד ${days} ימים`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? "בעוד שעה" : `בעוד ${hours} שעות`;
  }
  return minutes === 1 ? "בעוד דקה" : `בעוד ${minutes} דקות`;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  // Expo push API accepts batches of up to 100 messages
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Expo push API error: ${res.status} ${text}`);
    }

    const result = await res.json();

    // Handle ticket errors (e.g., stale tokens)
    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          console.log("[push] Removing stale token:", chunk[i].to);
          await pushTokensRepo.deleteByToken(chunk[i].to);
        }
      }
    }
  }
}
