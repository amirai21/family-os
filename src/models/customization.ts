/**
 * Per-family preferences ("התאמה אישית" / Customization in the UI).
 *
 * Mirrored from backend/src/db/schema.ts's `FamilyCustomizations`. The
 * backend stores this as a JSONB blob on `families.customizations` — keep
 * the shape in lockstep when adding keys.
 *
 * Optional everywhere: a missing key means "use the default below". This
 * keeps backward compatibility when we add new knobs without forcing a
 * data migration on every family.
 */

import type { ShoppingCategory } from "@src/models/grocery";

export interface FamilyCustomizations {
  grocerySubcategories?: Partial<Record<ShoppingCategory, string[]>>;
}

/**
 * Hebrew defaults used when a family hasn't set its own subcategories yet.
 *
 * IMPORTANT — names align EXACTLY with the Hebrew labels in
 * `src/i18n/he.ts → groceryCategory`. That table maps the legacy English
 * subcategory keys stored on existing items ("Produce", "Dairy", …) to
 * Hebrew. By keeping the defaults identical to those labels, the grouping
 * logic can bucket old items via `groceryCategoryLabel(item.subcategory)`
 * without a DB migration. If you drift these strings, existing items will
 * silently fall into the "אחר" bucket — keep them in lockstep with the
 * i18n table.
 */
export const DEFAULT_GROCERY_SUBCATEGORIES: Record<ShoppingCategory, string[]> = {
  grocery: [
    "ירקות ופירות", // Produce
    "מוצרי חלב",     // Dairy
    "בשר",           // Meat
    "דגים",          // Fish
    "מאפים",         // Bakery
    "קפואים",        // Frozen
    "חטיפים",        // Snacks
    "משקאות",        // Beverages
    "שימורים",       // Canned
    "תבלינים ורטבים", // Spices
    "אחר",           // Other
  ],
  health: [
    "תרופות",       // Medications
    "ויטמינים",     // Vitamins
    "טיפוח אישי",   // PersonalCare
    "תינוקות",      // BabyCare
    "עזרה ראשונה",  // FirstAid
    "טיפוח עור",    // Skincare
    "טיפוח שיער",   // HairCare
    "אחר",          // Other
  ],
  home: [
    "ניקיון",       // Cleaning
    "כביסה",        // Laundry
    "מטבח",         // Kitchen
    "אמבטיה",       // Bathroom
    "מוצרי נייר",   // PaperGoods
    "כלי עבודה",    // Tools
    "קישוט ועיצוב", // Decor
    "אחר",          // Other
  ],
};

/** Fallback bucket for items whose `subcategory` isn't in the active list. */
export const OTHER_SUBCATEGORY = "אחר";

/**
 * Resolve the effective subcategory list for a main category: the family's
 * customized list if present, otherwise the Hebrew defaults. Always returns
 * a non-empty array (the "אחר" bucket is guaranteed).
 */
export function effectiveSubcategories(
  customizations: FamilyCustomizations | null | undefined,
  category: ShoppingCategory,
): string[] {
  const custom = customizations?.grocerySubcategories?.[category];
  const list =
    custom && custom.length > 0 ? custom : DEFAULT_GROCERY_SUBCATEGORIES[category];
  // Defensive: always end with the Other bucket so unknown values group cleanly.
  return list.includes(OTHER_SUBCATEGORY) ? list : [...list, OTHER_SUBCATEGORY];
}
