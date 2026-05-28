ALTER TABLE "families" ADD COLUMN "customizations" jsonb DEFAULT '{}'::jsonb NOT NULL;
