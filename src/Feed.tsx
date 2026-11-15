import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { GameView } from "./GameView";
import { getDeviceId } from "./secureStorage";
import { colors, formatCount, ui } from "./ui";

type FeedGame = FunctionReturnType<typeof api.games.feed>[number];

function visitorsLabel(game: FeedGame) {
  return formatCount(game.visitors) + (game.visitors === 1 ? " visitor" : " visitors");
}

export function Feed({ onRemixed }: { onRemixed: (gameId: Id<"games">) => void }) {
  const games = useQuery(api.games.feed);
  const [playing, setPlaying] = useState<number | null>(null);

  if (games === undefined) return <Text style={[ui.muted, styles.center]}>Loading games…</Text>;
  if (games.length === 0) return <Text style={[ui.muted, styles.center]}>No games yet. Make the first one!</Text>;
  if (playing !== null) return <Player games={games} startIndex={playing} onBack={() => setPlaying(null)} onRemixed={onRemixed} />;

  return (
    <FlatList
      data={games}
      keyExtractor={(game) => game._id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={ui.h1}>Discover</Text>
          <Text style={ui.muted}>Trending games made by the community</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <Pressable style={styles.card} onPress={() => setPlaying(index)}>
          <View style={styles.thumb}>
            {item.thumbnailUrl ? (
              <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={styles.initial}>{item.title.slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {visitorsLabel(item)}
            {item.remixOfTitle ? " · remix" : ""}
          </Text>
        </Pressable>
      )}
    />
  );
}

function Player({
  games,
  startIndex,
  onBack,
  onRemixed,
}: {
  games: FeedGame[];
  startIndex: number;
  onBack: () => void;
  onRemixed: (gameId: Id<"games">) => void;
}) {
  const recordPlay = useMutation(api.plays.record);
  const visit = useMutation(api.plays.visit);
  const remix = useMutation(api.games.remix);
  const saveThumbnail = useAction(api.thumbnails.save);
  const { isAuthenticated } = useConvexAuth();
  const [height, setHeight] = useState(0);
  const [active, setActive] = useState(startIndex);
  const onViewable = useRef(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    if (viewableItems[0]?.index != null) setActive(viewableItems[0].index);
  }).current;
  const activeId = games[active]?._id;

  useEffect(() => {
    if (activeId) void getDeviceId().then((deviceId) => visit({ gameId: activeId, deviceId }));
  }, [activeId]);

  return (
    <View style={styles.flex} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          data={games}
          keyExtractor={(game) => game._id}
          pagingEnabled
          initialScrollIndex={startIndex}
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
                    if (message.type === "snapshot" && item.currentVersion && item.thumbnailVersion !== item.currentVersion) {
                      await saveThumbnail({ gameId: item._id, versionId: item.currentVersion, image: message.image });
                    }
                  }}
                />
              ) : null}
              <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.flex} pointerEvents="none">
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {visitorsLabel(item)}
                    {item.remixOfTitle ? " · remix of " + item.remixOfTitle : ""}
                  </Text>
                </View>
                <Pressable
                  style={styles.pill}
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
      <Pressable style={[styles.pill, styles.back]} onPress={onBack}>
        <Text style={ui.chipText}>‹ All games</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center", marginTop: 120 },
  header: { gap: 4, paddingBottom: 4 },
  grid: { padding: 16, gap: 18 },
  row: { gap: 12 },
  card: { flex: 1, maxWidth: "50%" },
  thumb: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: colors.accent, fontSize: 48, fontWeight: "800" },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 8 },
  cardMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
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
  pill: { backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  back: { position: "absolute", top: 12, left: 12 },
});
