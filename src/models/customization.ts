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
 * Items existing in the DB still carry their old English subcategory keys
 * ("Produce", "Dairy", …). They won't match these Hebrew defaults — they
 * land in the "אחר" (Other) group on the grouped list until the user
 * re-categorizes. Acceptable per the product decision (see commit message).
 */
export const DEFAULT_GROCERY_SUBCATEGORIES: Record<ShoppingCategory, string[]> = {
  grocery: [
    "ירקות ופירות",
    "מוצרי חלב",
    "בשר ועוף",
    "דגים",
    "מאפים",
    "קפואים",
    "חטיפים",
    "משקאות",
    "שימורים",
    "תבלינים ורטבים",
    "אחר",
  ],
  health: [
    "תרופות",
    "ויטמינים",
    "טיפוח",
    "תינוקות",
    "עזרה ראשונה",
    "פנים",
    "שיער",
    "אחר",
  ],
  home: [
    "ניקיון",
    "כביסה",
    "מטבח",
    "אמבטיה",
    "נייר",
    "כלים",
    "עיצוב",
    "אחר",
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
