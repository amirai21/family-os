ALTER TABLE "family_events" ADD COLUMN "reminders" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "push_tokens_family_id_idx" ON "push_tokens" ("family_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "push_tokens_family_token_uniq" ON "push_tokens" ("family_id", "token");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sent_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_event_id" uuid NOT NULL REFERENCES "family_events"("id") ON DELETE CASCADE,
  "reminder_minutes" integer NOT NULL,
  "event_date" text NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sent_notifications_event_idx" ON "sent_notifications" ("family_event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "sent_notifications_dedup_uniq" ON "sent_notifications" ("family_event_id", "reminder_minutes", "event_date");
