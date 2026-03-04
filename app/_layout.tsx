import { useEffect, useState, useCallback } from "react";
import { I18nManager, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, Snackbar } from "react-native-paper";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
  Rubik_800ExtraBold,
} from "@expo-google-fonts/rubik";
import { theme } from "@src/theme/theme";
import { pullAll } from "@src/lib/sync/syncEngine";
import { setSyncErrorHandler } from "@src/lib/sync/remoteCrud";
import { seedScheduleIfEmpty } from "@src/store/scheduleSeed";
import { seedFamilyMembersIfEmpty } from "@src/store/familyMemberSeed";
import { seedKidsIfEmpty } from "@src/store/kidSeed";
import { t } from "@src/i18n";

// ── RTL bootstrap (runs once at module load, before any render) ──
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.lang = "he";
  // Note: We do NOT set dir="rtl" or inject direction CSS here.
  // I18nManager.forceRTL(true) handles logical property flipping (marginStart, etc.)
  // and textAlign:"right" is set per-component. Setting CSS direction:rtl would
  // double-reverse flex rows since JSX children are already in RTL visual order.
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik: Rubik_400Regular,
    "Rubik-Medium": Rubik_500Medium,
    "Rubik-Bold": Rubik_700Bold,
    "Rubik-ExtraBold": Rubik_800ExtraBold,
  });

  const [snackMsg, setSnackMsg] = useState("");
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = useCallback((msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  }, []);

  // Register global sync error handler for fire-and-forget CRUD
  useEffect(() => {
    setSyncErrorHandler(showSnack);
  }, [showSnack]);

  // Pull from backend first, then seed only if collections are still empty
  useEffect(() => {
    pullAll()
      .catch((err) => {
        console.warn("[sync] Initial pull failed:", err.message);
      })
      .finally(() => {
        seedFamilyMembersIfEmpty();
        seedKidsIfEmpty();
        seedScheduleIfEmpty();
      });
  }, []);

  // Hide splash once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="kid/[kidId]" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style="dark" />
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
        action={{ label: t("ok"), onPress: () => setSnackVisible(false) }}
      >
        {snackMsg}
      </Snackbar>
    </PaperProvider>
  );
}
