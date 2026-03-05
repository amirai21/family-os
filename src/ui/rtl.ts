/**
 * Shared RTL style helpers for a Hebrew-first app.
 *
 * RTL activation depends on context:
 *  - Web: dir="rtl" on <html> takes effect immediately.
 *  - Native: I18nManager.forceRTL(true) persists to UserDefaults but only
 *    takes effect after a FULL app restart. Until then, isRTL remains false.
 *
 * To handle both states, use the exported constants:
 *  - RTL_ROW: flexDirection that flows right-to-left regardless of isRTL.
 *  - RTL_ALIGN_RIGHT: alignSelf value that maps to the right side of a column.
 */

import { I18nManager, Platform, StyleSheet } from "react-native";

/**
 * True when the layout engine is in RTL mode.
 *  - Web: always true (dir="rtl" is set on document root).
 *  - Native: true only after forceRTL has taken effect (post-restart).
 */
export const isRTLActive: boolean = Platform.OS === "web" || I18nManager.isRTL;

/** Runtime RTL flag — true after I18nManager.forceRTL(true) takes effect. */
export const isRTL = I18nManager.isRTL;

/**
 * FlexDirection for a row that should flow right-to-left (Hebrew reading order).
 *  - When RTL is active: "row" (the engine reverses it for us).
 *  - When RTL is NOT active: "row-reverse" (manual simulation).
 */
export const RTL_ROW: "row" | "row-reverse" = isRTLActive ? "row" : "row-reverse";

/**
 * alignSelf value that places an item on the RIGHT side of a column.
 *  - When RTL is active: "flex-start" (start = right in RTL).
 *  - When RTL is NOT active: "flex-end" (end = right in LTR).
 */
export const RTL_ALIGN_RIGHT: "flex-start" | "flex-end" = isRTLActive
  ? "flex-start"
  : "flex-end";

export const rtl = StyleSheet.create({
  /** Right-aligned text with RTL writing direction (use on TextInputs). */
  text: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  /** Semantic RTL row — items flow right-to-left in all modes. */
  row: {
    flexDirection: RTL_ROW,
  },
  /** RTL row with space-between (label ↔ action pattern). */
  rowBetween: {
    flexDirection: RTL_ROW,
    justifyContent: "space-between",
    alignItems: "center",
  },
  /** Push items to the trailing edge (left in Hebrew). */
  rowEnd: {
    flexDirection: RTL_ROW,
    justifyContent: "flex-end",
  },
});
