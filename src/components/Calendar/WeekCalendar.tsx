/**
 * WeekCalendar — Horizontal 7-day week strip.
 *
 * Props mirror MonthCalendar for drop-in usage:
 *   selectedDate  – "YYYY-MM-DD"
 *   onSelectDate  – callback with "YYYY-MM-DD"
 *   markedDates   – optional record { "YYYY-MM-DD": { dotColor?: string } }
 *   accentColor   – tint for selected day (defaults to purple)
 */

import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, IconButton } from "react-native-paper";
import he from "@src/i18n/he";
import { LOCALE } from "@src/i18n";

interface MarkedDate {
  dotColor?: string;
}

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  markedDates?: Record<string, MarkedDate>;
  accentColor?: string;
}

const DAY_LABELS = he.calendarDays; // ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"]

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Return Sunday of the week containing `dateStr`. */
function startOfWeek(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay()); // back to Sunday
  return date;
}

/** Add `days` days to a Date (returns new Date). */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function WeekCalendar({
  selectedDate,
  onSelectDate,
  markedDates,
  accentColor = "#6C63FF",
}: Props) {
  // Week offset (in weeks) from the week of selectedDate
  const [weekOffset, setWeekOffset] = React.useState(0);

  // Reset offset when selected date changes externally to a different week
  const baseWeekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  React.useEffect(() => {
    setWeekOffset(0);
  }, [ymd(baseWeekStart)]);

  const weekStart = useMemo(() => {
    const d = new Date(baseWeekStart);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [baseWeekStart, weekOffset]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const today = useMemo(() => ymd(new Date()), []);

  const goBack = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goForward = useCallback(() => setWeekOffset((o) => o + 1), []);

  // Week range label: e.g. "1–7 ביוני 2025"
  const weekLabel = useMemo(() => {
    const start = days[0];
    const end = days[6];
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (start.getMonth() === end.getMonth()) {
      // Same month
      const month = end.toLocaleString(LOCALE, { month: "long", year: "numeric" });
      return `${startDay}–${endDay} ${month}`;
    }
    // Spans two months
    const startStr = start.toLocaleString(LOCALE, { day: "numeric", month: "short" });
    const endStr = end.toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} – ${endStr}`;
  }, [days]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="chevron-right" size={22} onPress={goForward} />
        <Text variant="titleMedium" style={styles.weekLabel}>
          {weekLabel}
        </Text>
        <IconButton icon="chevron-left" size={22} onPress={goBack} />
      </View>

      {/* Day-of-week labels */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text variant="labelSmall" style={styles.dayLabel}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.row}>
        {days.map((day, i) => {
          const dateStr = ymd(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const mark = markedDates?.[dateStr];

          return (
            <Pressable
              key={i}
              style={[
                styles.cell,
                styles.dayCell,
                isSelected && { backgroundColor: accentColor },
                isToday && !isSelected && styles.todayCell,
              ]}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.selectedText,
                  isToday && !isSelected && { color: accentColor },
                ]}
              >
                {day.getDate()}
              </Text>
              {mark && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: mark.dotColor ?? accentColor },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  root: { paddingHorizontal: 4, paddingBottom: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  weekLabel: { fontWeight: "700", color: "#1A1A2E", textAlign: "center", flex: 1 },
  row: { flexDirection: "row" },
  cell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { color: "#8E8BA8", fontWeight: "600", textAlign: "center" },
  dayCell: { borderRadius: CELL_SIZE / 2, marginVertical: 1 },
  todayCell: {
    borderWidth: 1.5,
    borderColor: "#6C63FF",
  },
  dayNum: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", textAlign: "center" },
  selectedText: { color: "#FFFFFF", fontWeight: "700" },
  dot: {
    position: "absolute",
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
