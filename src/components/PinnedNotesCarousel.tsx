/**
 * PinnedNotesCarousel — Horizontal swipeable carousel of pinned notes.
 *
 * Uses a native horizontal ScrollView with snap-to-interval for cross-platform
 * compatibility (web + iOS). RTL-aware via I18nManager.
 */

import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  I18nManager,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import type { Note } from "@src/models/note";
import { t } from "@src/i18n";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  notes: Note[];
  onNotePress: (note: Note) => void;
  onAddPress: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_WIDTH_RATIO = 0.65;
const GAP = 12;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PinnedNotesCarousel({
  notes,
  onNotePress,
  onAddPress,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const CARD_W = screenWidth * CARD_WIDTH_RATIO;
  const SNAP_INTERVAL = CARD_W + GAP;
  const sideInset = (screenWidth - CARD_W) / 2;
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: sideInset - GAP / 2,
        }}
        // Flip scroll direction for RTL on web
        style={I18nManager.isRTL && Platform.OS === "web" ? { direction: "rtl" } : undefined}
      >
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            cardWidth={CARD_W}
            onPress={() => onNotePress(note)}
          />
        ))}
        {/* Add card */}
        <AddCard cardWidth={CARD_W} onPress={onAddPress} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Note Card
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  cardWidth,
  onPress,
}: {
  note: Note;
  cardWidth: number;
  onPress: () => void;
}) {
  return (
    <View style={{ width: cardWidth, marginHorizontal: GAP / 2 }}>
      <Pressable onPress={onPress} style={styles.noteCard}>
        <Text style={styles.pinIcon}>📌</Text>
        <Text
          variant="titleSmall"
          style={styles.noteTitle}
          numberOfLines={1}
        >
          {note.title || note.body.slice(0, 40)}
        </Text>
        <Text
          variant="bodySmall"
          style={styles.noteBody}
          numberOfLines={2}
        >
          {note.body}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add Card
// ---------------------------------------------------------------------------

function AddCard({
  cardWidth,
  onPress,
}: {
  cardWidth: number;
  onPress: () => void;
}) {
  return (
    <View style={{ width: cardWidth, marginHorizontal: GAP / 2 }}>
      <Pressable onPress={onPress} style={styles.addCard}>
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addLabel}>{t("today.addNote")}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    overflow: "visible",
  },

  // Note card
  noteCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pinIcon: {
    position: "absolute",
    top: 10,
    left: I18nManager.isRTL ? 12 : undefined,
    right: I18nManager.isRTL ? undefined : 12,
    fontSize: 14,
  },
  noteTitle: {
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "right",
    marginBottom: 6,
    marginTop: 4,
  },
  noteBody: {
    color: "#6B6B8D",
    textAlign: "right",
    lineHeight: 18,
  },

  // Add card
  addCard: {
    borderWidth: 2,
    borderColor: "#FFA72644",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    fontSize: 32,
    color: "#FFA726",
    fontWeight: "300",
    marginBottom: 4,
  },
  addLabel: {
    fontSize: 13,
    color: "#FFA726",
    fontWeight: "600",
  },
});
