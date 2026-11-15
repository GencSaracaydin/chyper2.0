import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { GameView } from "./GameView";
import { colors, ui } from "./ui";

const SUGGESTIONS = ["Add a power-up", "Add a combo multiplier", "Add a boss every 20 points", "More juice: particles and screen shake", "Add a second enemy type", "Make it get harder faster"];

export function Editor({ gameId, onBack }: { gameId: Id<"games">; onBack: () => void }) {
  const game = useQuery(api.games.get, { gameId });
  const tweak = useMutation(api.games.tweak);
  const undo = useMutation(api.games.undo);
  const publish = useMutation(api.games.publish);
  const dismissError = useMutation(api.games.dismissError);
  const saveThumbnail = useAction(api.thumbnails.save);
  const [prompt, setPrompt] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [crash, setCrash] = useState<string | null>(null);

  useEffect(() => setCrash(null), [game?.code]);

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
    <View style={styles.flex}>
      <View style={styles.top}>
        <Pressable onPress={onBack}>
          <Text style={ui.link}>‹ Back</Text>
        </Pressable>
        <Text style={[ui.h2, styles.flex]} numberOfLines={1}>
          {game.title}
          {game.versionNumber ? <Text style={ui.muted}>  v{game.versionNumber}</Text> : null}
        </Text>
        <Pressable onPress={() => setShowCode(!showCode)} disabled={!game.code}>
          <Text style={[ui.link, !game.code && ui.disabled]}>{showCode ? "Game" : "Code"}</Text>
        </Pressable>
        <Pressable onPress={() => undo({ gameId })} disabled={working || game.versionNumber <= 1}>
          <Text style={[ui.link, (working || game.versionNumber <= 1) && ui.disabled]}>Undo</Text>
        </Pressable>
        <Pressable
          style={[styles.publish, (working || !game.code || game.status === "published") && ui.disabled]}
          onPress={() => publish({ gameId })}
          disabled={working || !game.code || game.status === "published"}
        >
          <Text style={ui.chipText}>{game.status === "published" ? "Live" : "Publish"}</Text>
        </Pressable>
      </View>

      <View style={styles.preview}>
        {game.code && showCode ? (
          <ScrollView style={styles.code} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.codeText} selectable>
              {game.code}
            </Text>
          </ScrollView>
        ) : game.code ? (
          <GameView
            code={game.code}
            onMessage={(message) => {
              if (message.type === "error") setCrash(message.message);
              if (message.type === "snapshot" && game.currentVersion && game.thumbnailVersion !== game.currentVersion) {
                void saveThumbnail({ gameId, versionId: game.currentVersion, image: message.image });
              }
            }}
          />
        ) : null}
        {working ? (
          <View style={styles.working}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.workingText}>{game.job?.stage}…</Text>
            <Text style={styles.workingPrompt} numberOfLines={3}>
              “{game.job?.prompt}”
            </Text>
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
        ) : crash && !working ? (
          <View style={styles.crash}>
            <Text style={[ui.error, styles.flex]} numberOfLines={2}>
              The game crashed: {crash}
            </Text>
            <Pressable style={ui.chip} onPress={() => send(`The game crashes with this error: ${crash}. Fix it.`)}>
              <Text style={ui.chipText}>Fix it</Text>
            </Pressable>
          </View>
        ) : game.summary ? (
          <Text style={ui.muted} numberOfLines={2}>
            {game.summary}
          </Text>
        ) : null}
        {game.code ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={[ui.chip, working && ui.disabled]} onPress={() => setPrompt(s)} disabled={working}>
                <Text style={ui.chipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            style={[ui.input, styles.flex, styles.prompt]}
            placeholder={game.code ? "Describe what to change or add…" : "Describe your game…"}
            placeholderTextColor="#666"
            multiline
            value={prompt}
            onChangeText={setPrompt}
          />
          <Pressable style={[ui.button, (working || prompt.trim() === "") && ui.disabled]} onPress={() => send(prompt)} disabled={working}>
            <Text style={ui.buttonText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  publish: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  preview: { flex: 1, marginHorizontal: 12, borderRadius: 18, overflow: "hidden", backgroundColor: colors.card },
  code: { flex: 1, backgroundColor: "#0A0A0E" },
  codeText: { color: "#C9D1D9", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, lineHeight: 15 },
  working: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  workingText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  workingPrompt: { color: "#bbb", fontSize: 14, textAlign: "center" },
  bottom: { padding: 12, gap: 10 },
  crash: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { gap: 8 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  prompt: { maxHeight: 110 },
});
