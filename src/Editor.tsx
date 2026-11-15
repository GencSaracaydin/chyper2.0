import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { GameView } from "./GameView";
import { colors, ui } from "./ui";

const TWEAKS = ["Make it harder", "Make it easier", "Faster", "New character", "Night mode", "More collectibles", "Bigger jumps"];

export function Editor({ gameId, onBack }: { gameId: Id<"games">; onBack: () => void }) {
  const game = useQuery(api.games.get, { gameId });
  const tweak = useMutation(api.games.tweak);
  const undo = useMutation(api.games.undo);
  const publish = useMutation(api.games.publish);
  const dismissError = useMutation(api.games.dismissError);
  const [prompt, setPrompt] = useState("");

  if (game === undefined) return <ActivityIndicator style={{ marginTop: 120 }} color={colors.accent} />;
  if (game === null) {
    return (
      <Pressable onPress={onBack}>
        <Text style={ui.link}>Game not found. Go back</Text>
      </Pressable>
    );
  }

  const working = game.job !== undefined && !game.job.error;
  const send = async (text: string) => {
    if (text.trim() === "" || working) return;
    setPrompt("");
    await tweak({ gameId, prompt: text.trim() });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.top}>
        <Pressable onPress={onBack}>
          <Text style={ui.link}>‹ Back</Text>
        </Pressable>
        <Text style={[ui.h2, styles.flex]} numberOfLines={1}>
          {game.title}
          {game.versionNumber ? <Text style={ui.muted}>  v{game.versionNumber}</Text> : null}
        </Text>
        <Pressable onPress={() => undo({ gameId })} disabled={working || game.versionNumber <= 1}>
          <Text style={[ui.link, (working || game.versionNumber <= 1) && ui.disabled]}>Undo</Text>
        </Pressable>
        <Pressable
          style={[styles.publish, (working || !game.config) && ui.disabled]}
          onPress={() => publish({ gameId })}
          disabled={working || !game.config || game.status === "published"}
        >
          <Text style={ui.chipText}>{game.status === "published" ? "Live" : "Publish"}</Text>
        </Pressable>
      </View>

      <View style={[styles.preview, { backgroundColor: game.config?.colors.background ?? colors.card }]}>
        {game.config ? <GameView config={game.config} /> : null}
        {working ? (
          <View style={styles.working}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.workingText}>{game.job?.stage}…</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        {game.job?.error ? (
          <Pressable onPress={() => dismissError({ gameId })}>
            <Text style={ui.error} numberOfLines={3}>
              That didn't work: {game.job.error} (tap to dismiss)
            </Text>
          </Pressable>
        ) : game.summary ? (
          <Text style={ui.muted} numberOfLines={2}>
            {game.summary}
          </Text>
        ) : null}
        {game.config ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TWEAKS.map((t) => (
              <Pressable key={t} style={[ui.chip, working && ui.disabled]} onPress={() => send(t)} disabled={working}>
                <Text style={ui.chipText}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            style={[ui.input, styles.flex]}
            placeholder={game.config ? "Change something…" : "Describe your game…"}
            placeholderTextColor="#666"
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={() => send(prompt)}
            returnKeyType="send"
          />
          <Pressable style={[ui.button, (working || prompt.trim() === "") && ui.disabled]} onPress={() => send(prompt)} disabled={working}>
            <Text style={ui.buttonText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingVertical: 6 },
  publish: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  preview: { flex: 1, marginHorizontal: 12, borderRadius: 18, overflow: "hidden" },
  working: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  workingText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  bottom: { padding: 12, gap: 10 },
  chips: { gap: 8 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
});
