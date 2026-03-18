/**
 * SummaryCard — a clean stat tile for overview grids.
 *
 * Usage:
 *   <SummaryCard value={8} label="פריטים בקניות" accentColor={C.red} onPress={...} />
 */

import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { Text } from "react-native-paper";
import { C, S } from "@src/ui/tokens";

interface Props {
  value: number | string;
  label: string;
  accentColor: string;
  onPress?: () => void;
  /** Render ▲/▼ after label for expandable sections */
  expanded?: boolean;
}

export default function SummaryCard({
  value,
  label,
  accentColor,
  onPress,
  expanded,
}: Props) {
  const suffix =
    expanded === undefined ? "" : expanded ? "  ▲" : "  ▼";

  return (
    <Pressable
      style={({ pressed, hovered }: any) => [
        styles.cell,
        hovered && styles.hovered,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessible={!!onPress}
    >
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}{suffix}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.lg,
    paddingHorizontal: S.md,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  hovered: { backgroundColor: C.hoverBg },
  pressed: { backgroundColor: C.pressedBg },
  value: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: C.textMuted,
    marginTop: S.xs,
    textAlign: "center",
  },
});
