-- Add shopping_category column and rename category → subcategory
ALTER TABLE "grocery_items" ADD COLUMN "shopping_category" text DEFAULT 'grocery' NOT NULL;--> statement-breakpoint
ALTER TABLE "grocery_items" RENAME COLUMN "category" TO "subcategory";--> statement-breakpoint
ALTER TABLE "grocery_items" ALTER COLUMN "subcategory" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "grocery_items_family_shop_cat_idx" ON "grocery_items" USING btree ("family_id","shopping_category");
