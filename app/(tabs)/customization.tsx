/**
 * Customization screen — per-family preferences.
 *
 * Route: /customization (hidden from the tab bar; reached via the Settings link).
 *
 * For now, the only customization is the per-main-category list of
 * grocery subcategories. New knobs are expected to land on this screen —
 * each one as its own section/card below the existing ones.
 *
 * UX choices:
 *   - Inline edit (TextInput per row). Renames save onBlur.
 *   - Trash icon to delete a row (with confirm).
 *   - "Add" input at the bottom of each section.
 *   - "אחר" (Other) is hardcoded as the catch-all bucket and can't be
 *     removed or renamed — its row shows a lock icon instead of a trash.
 *
 * Every edit is optimistic: we update the local store immediately and
 * fire-and-forget the PUT. Server errors surface via the global snackbar
 * registered in app/_layout.tsx.
 */

import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import {
  Card,
  Text,
  TextInput,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useFamilyStore } from "@src/store/useFamilyStore";
import { updateCustomizationsRemote } from "@src/lib/sync/remoteCrud";
import ConfirmDeleteModal from "@src/components/ConfirmDeleteModal";
import { useConfirmDelete } from "@src/hooks/useConfirmDelete";
import SectionHeader from "@src/components/SectionHeader";
import {
  effectiveSubcategories,
  OTHER_SUBCATEGORY,
  type FamilyCustomizations,
} from "@src/models/customization";
import type { ShoppingCategory } from "@src/models/grocery";
import { SHOPPING_CATEGORIES } from "@src/models/grocery";
import { t, shoppingCategoryLabel } from "@src/i18n";
import { RTL_ROW, TEXT_RIGHT } from "@src/ui/rtl";
import { C, R, S } from "@src/ui/tokens";

const SECTION_LABEL: Record<ShoppingCategory, string> = {
  grocery: "customization.grocerySubcategories",
  health: "customization.healthSubcategories",
  home: "customization.homeSubcategories",
};

// ---------------------------------------------------------------------------
// Row — a single subcategory (existing item) with inline rename + delete
// ---------------------------------------------------------------------------

function SubcategoryRow({
  value,
  isOther,
  siblingNames,
  onRename,
  onDelete,
}: {
  value: string;
  isOther: boolean;
  siblingNames: string[]; // used to block duplicate renames
  onRename: (next: string) => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync when external value changes (e.g., pullAll
  // overwrote customizations).
  React.useEffect(() => {
    setLocal(value);
    setError(null);
  }, [value]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === value) {
      setError(null);
      return;
    }
    if (trimmed.length === 0) {
      setError(t("customization.emptyNameError"));
      setLocal(value); // revert
      return;
    }
    if (siblingNames.includes(trimmed)) {
      setError(t("customization.duplicateError"));
      setLocal(value);
      return;
    }
    setError(null);
    onRename(trimmed);
  };

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          value={local}
          onChangeText={setLocal}
          onBlur={commit}
          onSubmitEditing={commit}
          dense
          disabled={isOther}
          style={styles.rowInput}
          contentStyle={styles.rowInputContent}
        />
        <IconButton
          icon={isOther ? "lock-outline" : "trash-can-outline"}
          size={20}
          onPress={isOther ? undefined : onDelete}
          disabled={isOther}
          accessibilityLabel={
            isOther ? t("customization.otherCategoryLocked") : t("customization.deleteSubcategory")
          }
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AddRow — the bottom-of-section input that adds a new subcategory
// ---------------------------------------------------------------------------

function AddSubcategoryRow({
  siblingNames,
  onAdd,
}: {
  siblingNames: string[];
  onAdd: (name: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      // Pressing add on an empty input is a no-op (not an error — user
      // probably just tapped twice).
      return;
    }
    if (siblingNames.includes(trimmed)) {
      setError(t("customization.duplicateError"));
      return;
    }
    setError(null);
    onAdd(trimmed);
    setValue("");
  };

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={(v) => {
            setValue(v);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          placeholder={t("customization.subcategoryPlaceholder")}
          dense
          style={styles.rowInput}
          contentStyle={styles.rowInputContent}
        />
        <IconButton
          icon="plus"
          size={22}
          mode="contained"
          containerColor={C.purple}
          iconColor="#FFF"
          onPress={submit}
          accessibilityLabel={t("customization.addSubcategory")}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section — one main category (grocery / health / home)
// ---------------------------------------------------------------------------

function SubcategorySection({
  category,
  list,
  onChange,
}: {
  category: ShoppingCategory;
  list: string[];
  onChange: (nextList: string[]) => void;
}) {
  const { confirmVisible, requestDelete, confirmDelete, dismissConfirm } = useConfirmDelete();

  return (
    <>
      <SectionHeader label={`${t(SECTION_LABEL[category])} · ${shoppingCategoryLabel(category)}`} />
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          {list.map((name) => {
            const isOther = name === OTHER_SUBCATEGORY;
            const siblings = list.filter((n) => n !== name);
            return (
              <SubcategoryRow
                key={name}
                value={name}
                isOther={isOther}
                siblingNames={siblings}
                onRename={(next) =>
                  onChange(list.map((n) => (n === name ? next : n)))
                }
                onDelete={() =>
                  requestDelete(() =>
                    onChange(list.filter((n) => n !== name)),
                  )
                }
              />
            );
          })}
          <AddSubcategoryRow
            siblingNames={list}
            onAdd={(name) => {
              // Insert before "אחר" so the Other bucket stays at the end.
              const otherIdx = list.indexOf(OTHER_SUBCATEGORY);
              const next =
                otherIdx >= 0
                  ? [...list.slice(0, otherIdx), name, ...list.slice(otherIdx)]
                  : [...list, name];
              onChange(next);
            }}
          />
        </Card.Content>
      </Card>
      <ConfirmDeleteModal
        visible={confirmVisible}
        onConfirm={confirmDelete}
        onDismiss={dismissConfirm}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CustomizationScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t("customization.title") });
  }, [navigation]);

  const customizations = useFamilyStore((s) => s.customizations);

  // Effective lists derived from store (with defaults filled in). Each
  // section operates on its own list independently; saving builds a new
  // FamilyCustomizations and PUTs it.
  const effective = useMemo(
    () =>
      Object.fromEntries(
        SHOPPING_CATEGORIES.map((cat) => [
          cat,
          effectiveSubcategories(customizations, cat),
        ]),
      ) as Record<ShoppingCategory, string[]>,
    [customizations],
  );

  const setListFor = useCallback(
    (cat: ShoppingCategory, nextList: string[]) => {
      const next: FamilyCustomizations = {
        ...customizations,
        grocerySubcategories: {
          ...(customizations.grocerySubcategories ?? {}),
          [cat]: nextList,
        },
      };
      updateCustomizationsRemote(next);
    },
    [customizations],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("customization.title")}</Text>
        <Text style={styles.subtitle}>{t("customization.subtitle")}</Text>
        <Text style={styles.hint}>{t("customization.subcategoriesHint")}</Text>

        {SHOPPING_CATEGORIES.map((cat) => (
          <SubcategorySection
            key={cat}
            category={cat}
            list={effective[cat]}
            onChange={(next) => setListFor(cat, next)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: S.lg, paddingBottom: S.xxl + S.xxl },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    textAlign: TEXT_RIGHT,
    writingDirection: "rtl",
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: TEXT_RIGHT,
    writingDirection: "rtl",
    marginTop: S.xs,
    marginBottom: S.md,
  },
  hint: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: TEXT_RIGHT,
    writingDirection: "rtl",
    marginBottom: S.md,
  },

  card: { borderRadius: R.lg, backgroundColor: C.surface, marginBottom: S.lg },

  row: {
    flexDirection: RTL_ROW,
    alignItems: "center",
    gap: S.sm,
  },
  rowInput: {
    flex: 1,
    backgroundColor: C.surface,
  },
  rowInputContent: {
    textAlign: TEXT_RIGHT,
    writingDirection: "rtl",
    ...(Platform.OS === "web" ? ({ direction: "rtl" } as any) : {}),
  },

  errorText: {
    color: C.red,
    fontSize: 12,
    textAlign: TEXT_RIGHT,
    writingDirection: "rtl",
    marginTop: -S.xs,
    marginBottom: S.xs,
    paddingHorizontal: S.sm,
  },
});
