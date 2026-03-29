-- Convert dayOfWeek (integer) to daysOfWeek (jsonb array) for multi-day recurring events

-- schedule_blocks: drop old constraints and index, add new column, migrate data, drop old column
ALTER TABLE "schedule_blocks" DROP CONSTRAINT IF EXISTS "schedule_blocks_dow_range";
DROP INDEX IF EXISTS "schedule_blocks_kid_dow_idx";

ALTER TABLE "schedule_blocks" ADD COLUMN "days_of_week" jsonb;
UPDATE "schedule_blocks" SET "days_of_week" = jsonb_build_array("day_of_week");
ALTER TABLE "schedule_blocks" ALTER COLUMN "days_of_week" SET NOT NULL;
ALTER TABLE "schedule_blocks" DROP COLUMN "day_of_week";

-- family_events: drop old constraints and index, add new column, migrate data, drop old column
ALTER TABLE "family_events" DROP CONSTRAINT IF EXISTS "family_events_dow_range";
DROP INDEX IF EXISTS "family_events_family_dow_idx";

ALTER TABLE "family_events" ADD COLUMN "days_of_week" jsonb;
UPDATE "family_events" SET "days_of_week" = jsonb_build_array("day_of_week");
ALTER TABLE "family_events" ALTER COLUMN "days_of_week" SET NOT NULL;
ALTER TABLE "family_events" DROP COLUMN "day_of_week";
