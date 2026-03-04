ALTER TABLE "schedule_blocks" ADD COLUMN "date" text;
ALTER TABLE "schedule_blocks" ADD COLUMN "is_recurring" boolean DEFAULT true NOT NULL;
