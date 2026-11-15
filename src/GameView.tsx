import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { GameConfig } from "../convex/gameConfig";
import { buildGameHtml } from "../game/buildGameHtml";

type GameMessage = { type: "ready" } | { type: "start" } | { type: "over"; score: number };

export function GameView({ config, onMessage }: { config: GameConfig; onMessage?: (message: GameMessage) => void }) {
  const html = useMemo(() => buildGameHtml(config), [config]);
  return (
    <WebView
      key={html}
      style={styles.game}
      source={{ html }}
      originWhitelist={["about:blank"]}
      onShouldStartLoadWithRequest={(request) => request.url === "about:blank"}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      setSupportMultipleWindows={false}
      onMessage={(event) => {
        try {
          onMessage?.(JSON.parse(event.nativeEvent.data));
        } catch {}
      }}
    />
  );
}

const styles = StyleSheet.create({
  game: { flex: 1, backgroundColor: "transparent" },
});
