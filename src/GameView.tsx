import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { buildGameHtml } from "../game/buildGameHtml";

export type GameMessage =
  | { type: "ready" }
  | { type: "start" }
  | { type: "over"; score: number }
  | { type: "error"; message: string };

export function GameView({ code, onMessage }: { code: string; onMessage?: (message: GameMessage) => void }) {
  const html = useMemo(() => buildGameHtml(code), [code]);
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
  game: { flex: 1, backgroundColor: "#000" },
});
