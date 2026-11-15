import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { GameView } from "./GameView";
import { getDeviceId } from "./secureStorage";
import { colors, ui } from "./ui";

export function Feed({ onRemixed }: { onRemixed: (gameId: Id<"games">) => void }) {
  const games = useQuery(api.games.feed);
  const recordPlay = useMutation(api.plays.record);
  const remix = useMutation(api.games.remix);
  const { isAuthenticated } = useConvexAuth();
  const [height, setHeight] = useState(0);
  const [active, setActive] = useState(0);
  const onViewable = useRef(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    if (viewableItems[0]?.index != null) setActive(viewableItems[0].index);
  }).current;

  if (games === undefined) return <Text style={[ui.muted, styles.center]}>Loading games…</Text>;
  if (games.length === 0) return <Text style={[ui.muted, styles.center]}>No games yet. Make the first one!</Text>;

  return (
    <View style={styles.flex} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          data={games}
          keyExtractor={(game) => game._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          renderItem={({ item, index }) => (
            <View style={{ height, backgroundColor: colors.bg }}>
              {index === active && item.code ? (
                <GameView
                  code={item.code}
                  onMessage={async (message) => {
                    if (message.type === "over") {
                      await recordPlay({ gameId: item._id, deviceId: await getDeviceId(), score: message.score });
                    }
                  }}
                />
              ) : null}
              <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.flex} pointerEvents="none">
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {item.plays} plays{item.remixOfTitle ? " · remix of " + item.remixOfTitle : ""}
                  </Text>
                </View>
                <Pressable
                  style={styles.remix}
                  onPress={async () => {
                    if (!isAuthenticated) {
                      Alert.alert("Sign in to remix", "Open the Create tab to sign in, then remix this game.");
                      return;
                    }
                    onRemixed(await remix({ gameId: item._id }));
                  }}
                >
                  <Text style={ui.chipText}>Remix</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center", marginTop: 120 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  meta: { color: "#ddd", fontSize: 13, marginTop: 2 },
  remix: { backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
});
