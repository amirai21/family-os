/**
 * WeekCalendar — 7-column week strip with event lists inside each day.
 *
 * Each day column shows:
 *   - Short day name + day number (circle for today / selected)
 *   - Up to MAX_EVENTS colored event chips (family events + kid blocks)
 *   - "+N" overflow indicator when there are more
 *
 * Event data is pulled directly from the Zustand store.
 *
 * Props mirror MonthCalendar for drop-in usage:
 *   selectedDate  – "YYYY-MM-DD"
 *   onSelectDate  – callback with "YYYY-MM-DD"
 *   markedDates   – kept for API compat but unused (real events shown instead)
 *   accentColor   – tint for selected / today highlight
 */

import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, IconButton } from "react-native-paper";
import he from "@src/i18n/he";
import { LOCALE } from "@src/i18n";
import {
  useFamilyEventRecurringByDay,
  useFamilyEventOneTimeBlocks,
} from "@src/store/familyEventSelectors";
import {
  useAllKidRecurringByDay,
  useAllKidOneTimeBlocks,
} from "@src/store/scheduleSelectors";
import { useFamilyStore } from "@src/store/useFamilyStore";
import { RTL_ROW } from "@src/ui/rtl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkedDate {
  dotColor?: string;
}

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  markedDates?: Record<string, MarkedDate>; // kept for API compat
  accentColor?: string;
}

interface EventItem {
  id: string;
  title: string;
  color: string;
  startMinutes: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = "#6C63FF";
const FAMILY_COLOR = "#4ECDC4";
const KID_COLOR = "#FF6B6B";
const MEMBER_COLOR = "#6C63FF";
const MAX_EVENTS = 5;

const DAY_LABELS = he.calendarDays; // ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"] Sun–Sat

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Return Sunday of the week containing dateStr. */
function startOfWeek(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay()); // back to Sunday
  return date;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeekCalendar({
  selectedDate,
  onSelectDate,
  accentColor = DEFAULT_ACCENT,
}: Props) {
  // ── Week navigation ────────────────────────────────────────────────────────
  const [weekOffset, setWeekOffset] = React.useState(0);

  const baseWeekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  // Reset offset whenever the selected date jumps to a different week
  React.useEffect(() => {
    setWeekOffset(0);
  }, [ymd(baseWeekStart)]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Week range label: "1–7 ביוני 2025" or "30 מאי – 5 יוני 2025"
  const weekLabel = useMemo(() => {
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      const month = end.toLocaleString(LOCALE, { month: "long", year: "numeric" });
      return `${start.getDate()}–${end.getDate()} ${month}`;
    }
    const s = start.toLocaleString(LOCALE, { day: "numeric", month: "short" });
    const e = end.toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  }, [days]);

  // ── Event data (pulled from store) ─────────────────────────────────────────
  const familyRecurringByDow = useFamilyEventRecurringByDay();
  const familyOneTimeEvents = useFamilyEventOneTimeBlocks();
  const kidRecurringByDow = useAllKidRecurringByDay();
  const kidOneTimeBlocks = useAllKidOneTimeBlocks();
  const kids = useFamilyStore((s) => s.kids);

  // Build EventItem[] for every day of the visible week
  const weekEvents = useMemo<Record<string, EventItem[]>>(() => {
    const result: Record<string, EventItem[]> = {};
    for (const day of days) {
      const dow = day.getDay();
      const dateStr = ymd(day);
      const items: EventItem[] = [];

      // Family – recurring
      for (const e of familyRecurringByDow[dow] ?? []) {
        items.push({
          id: e.id,
          title: e.title,
          color:
            e.color ??
            (e.assigneeType === "family"
              ? FAMILY_COLOR
              : e.assigneeType === "member"
                ? MEMBER_COLOR
                : KID_COLOR),
          startMinutes: e.startMinutes,
        });
      }
      // Family – one-time
      for (const e of familyOneTimeEvents) {
        if (e.date === dateStr) {
          items.push({
            id: e.id,
            title: e.title,
            color:
              e.color ??
              (e.assigneeType === "family"
                ? FAMILY_COLOR
                : e.assigneeType === "member"
                  ? MEMBER_COLOR
                  : KID_COLOR),
            startMinutes: e.startMinutes,
          });
        }
      }
      // Kid blocks – recurring
      for (const b of kidRecurringByDow[dow] ?? []) {
        const kid = kids.find((k) => k.id === b.kidId);
        items.push({
          id: b.id,
          title: b.title,
          color: b.color ?? kid?.color ?? KID_COLOR,
          startMinutes: b.startMinutes,
        });
      }
      // Kid blocks – one-time
      for (const b of kidOneTimeBlocks) {
        if (b.date === dateStr) {
          const kid = kids.find((k) => k.id === b.kidId);
          items.push({
            id: b.id,
            title: b.title,
            color: b.color ?? kid?.color ?? KID_COLOR,
            startMinutes: b.startMinutes,
          });
        }
      }

      result[dateStr] = items.sort((a, b) => a.startMinutes - b.startMinutes);
    }
    return result;
  }, [days, familyRecurringByDow, familyOneTimeEvents, kidRecurringByDow, kidOneTimeBlocks, kids]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header: chevron  week-range  chevron ─────────────────────────── */}
      <View style={styles.header}>
        <IconButton icon="chevron-right" size={22} onPress={goForward} />
        <Text variant="titleMedium" style={styles.weekLabel}>
          {weekLabel}
        </Text>
        <IconButton icon="chevron-left" size={22} onPress={goBack} />
      </View>

      {/* ── Day columns ──────────────────────────────────────────────────── */}
      <View style={styles.columnsRow}>
        {days.map((day, i) => {
          const dateStr = ymd(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const events = weekEvents[dateStr] ?? [];
          const visible = events.slice(0, MAX_EVENTS);
          const overflow = events.length - MAX_EVENTS;

          return (
            <Pressable
              key={i}
              style={[
                styles.dayCol,
                isSelected && { backgroundColor: accentColor + "18" },
              ]}
              onPress={() => onSelectDate(dateStr)}
            >
              {/* Day-of-week label */}
              <Text style={styles.dowLabel}>{DAY_LABELS[i]}</Text>

              {/* Day number circle */}
              <View
                style={[
                  styles.dayNumCircle,
                  isSelected && { backgroundColor: accentColor },
                  isToday && !isSelected && {
                    borderColor: accentColor,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                    isToday && !isSelected && { color: accentColor },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>

              {/* Events list */}
              <View style={styles.eventsList}>
                {visible.map((ev) => (
                  <View key={ev.id} style={styles.eventChip}>
                    <View
                      style={[styles.eventStripe, { backgroundColor: ev.color }]}
                    />
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {ev.title}
                    </Text>
                  </View>
                ))}
                {overflow > 0 && (
                  <Text style={styles.overflowText}>+{overflow}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const DAY_NUM_SIZE = 28;

const styles = StyleSheet.create({
  root: { paddingBottom: 4 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekLabel: {
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    flex: 1,
  },

  // 7-column row — flexDirection: "row" so RN Web RTL auto-mirrors it
  // (Sunday renders on the right, Saturday on the left — correct for Hebrew)
  columnsRow: {
    flexDirection: "row",
  },

  dayCol: {
    flex: 1,
    minHeight: 170,
    paddingHorizontal: 2,
    paddingBottom: 8,
    borderRadius: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E8E4FF",
  },

  dowLabel: {
    textAlign: "center",
    fontSize: 10,
    color: "#8E8BA8",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 2,
  },

  dayNumCircle: {
    width: DAY_NUM_SIZE,
    height: DAY_NUM_SIZE,
    borderRadius: DAY_NUM_SIZE / 2,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A2E",
    textAlign: "center",
  },
  dayNumSelected: { color: "#FFFFFF", fontWeight: "700" },

  // Events inside each column
  eventsList: {
    gap: 2,
  },
  eventChip: {
    flexDirection: RTL_ROW,
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderRadius: 3,
    overflow: "hidden",
    minHeight: 17,
  },
  eventStripe: {
    width: 3,
    alignSelf: "stretch",
    minHeight: 17,
  },
  eventTitle: {
    flex: 1,
    fontSize: 9,
    color: "#3A3A5C",
    paddingHorizontal: 3,
    paddingVertical: 2,
    fontWeight: "500",
  },
  overflowText: {
    fontSize: 9,
    color: "#8E8BA8",
    textAlign: "center",
    marginTop: 1,
  },
});
