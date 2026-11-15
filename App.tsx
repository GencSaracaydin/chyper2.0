import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { api } from "./convex/_generated/api";
import type { Id } from "./convex/_generated/dataModel";
import { AuthForm } from "./src/AuthForm";
import { Feed } from "./src/Feed";
import { secureStorage } from "./src/secureStorage";
import { Studio } from "./src/Studio";
import { colors } from "./src/ui";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function App() {
  return (
    <ConvexAuthProvider
      client={convex}
      storage={secureStorage}
      api={{
        refreshSession: api.auth.refreshSession,
        signOut: api.auth.signOut,
        isAuthenticated: api.auth.isAuthenticated,
      }}
    >
      <Main />
    </ConvexAuthProvider>
  );
}

function Main() {
  const [tab, setTab] = useState<"play" | "create">("play");
  const [openGameId, setOpenGameId] = useState<Id<"games"> | null>(null);
  const { signOut } = useAuthActions();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.flex}>
        {tab === "play" ? (
          <Feed
            onRemixed={(gameId) => {
              setOpenGameId(gameId);
              setTab("create");
            }}
          />
        ) : (
          <>
            <AuthLoading>
              <ActivityIndicator style={{ marginTop: 120 }} color={colors.accent} />
            </AuthLoading>
            <Unauthenticated>
              <AuthForm />
            </Unauthenticated>
            <Authenticated>
              <Studio openGameId={openGameId} setOpenGameId={setOpenGameId} />
            </Authenticated>
          </>
        )}
      </View>
      <View style={styles.tabs}>
        {(["play", "create"] as const).map((t) => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabActive]}>{t === "play" ? "Play" : "Create"}</Text>
          </Pressable>
        ))}
        <Authenticated>
          {tab === "create" ? (
            <Pressable style={styles.tab} onPress={() => void signOut()}>
              <Text style={styles.tabText}>Sign out</Text>
            </Pressable>
          ) : null}
        </Authenticated>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  tabs: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#333" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { color: colors.muted, fontSize: 16, fontWeight: "700" },
  tabActive: { color: colors.text },
});
