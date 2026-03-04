import { Hono } from "hono";
import { checkAndSendReminders } from "../services/pushService.js";

export const notificationRoutes = new Hono();

// POST /v1/notifications/check — called by Cloud Scheduler every minute
notificationRoutes.post("/check", async (c) => {
  // Optional: verify a shared secret header for security
  const expectedSecret = process.env.SCHEDULER_SECRET;
  if (expectedSecret) {
    const authHeader = c.req.header("X-Scheduler-Secret");
    if (authHeader !== expectedSecret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  const result = await checkAndSendReminders();
  return c.json({ ok: true, ...result });
});
