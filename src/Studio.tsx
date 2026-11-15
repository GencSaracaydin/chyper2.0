import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Editor } from "./Editor";
import { colors, ui } from "./ui";

const IDEAS = [
  "A frog hopping across a busy road",
  "Drag a basket to catch falling fruit, avoid bombs",
  "Tap to switch gravity and dodge spikes",
  "A snake that grows every time you tap a dot",
];

export function Studio({ openGameId, setOpenGameId }: { openGameId: Id<"games"> | null; setOpenGameId: (id: Id<"games"> | null) => void }) {
  const games = useQuery(api.games.mine);
  const create = useMutation(api.games.create);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (openGameId) return <Editor gameId={openGameId} onBack={() => setOpenGameId(null)} />;

  const start = async (text: string) => {
    if (text.trim() === "") return;
    setError(null);
    try {
      setOpenGameId(await create({ prompt: text.trim() }));
      setPrompt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      data={games ?? []}
      keyExtractor={(game) => game._id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={ui.h1}>Make a game</Text>
          <Text style={ui.muted}>Describe your game idea. The AI writes it, you play it and keep refining it. Tap the mic on your keyboard to dictate.</Text>
          <TextInput
            style={[ui.input, styles.prompt]}
            placeholder="A frog hopping over traffic cones…"
            placeholderTextColor="#666"
            multiline
            value={prompt}
            onChangeText={setPrompt}
          />
          <View style={styles.chips}>
            {IDEAS.map((idea) => (
              <Pressable key={idea} style={ui.chip} onPress={() => setPrompt(idea)}>
                <Text style={ui.chipText}>{idea}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={ui.error}>{error}</Text> : null}
          <Pressable style={[ui.button, prompt.trim() === "" && ui.disabled]} onPress={() => start(prompt)} disabled={prompt.trim() === ""}>
            <Text style={ui.buttonText}>Create game</Text>
          </Pressable>
          {games && games.length > 0 ? <Text style={[ui.h2, styles.mine]}>Your games</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => setOpenGameId(item._id)}>
          <View style={styles.swatch}>
            <Text style={styles.swatchText}>{item.title.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ui.h2}>{item.title}</Text>
            <Text style={ui.muted}>
              {item.job ? (item.job.error ? "Failed" : item.job.stage + "…") : item.status === "published" ? item.plays + " plays · live" : "Draft"}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, gap: 10 },
  header: { gap: 12, marginBottom: 8 },
  prompt: { minHeight: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mine: { marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14 },
  swatch: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  swatchText: { color: colors.text, fontSize: 18, fontWeight: "800" },
});
