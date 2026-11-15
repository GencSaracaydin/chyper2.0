/// <reference types="node" />
"use node";

import { getServiceToken } from "convex/server";
import { v } from "convex/values";
import { Script } from "node:vm";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";
import { SDK_DOCS } from "./gameSdk";
import { STARTER_GAMES } from "./starterGames";

type CatalogEntry = { key: string; kind: "image" | "sound"; description: string; width?: number; height?: number };

const ALWAYS_RELEVANT = ["coin", "jump", "hit", "hurt", "score", "win", "lose", "over", "pop", "music", "background", "powerup"];
const STOP_WORDS = new Set(["the", "and", "with", "that", "this", "for", "you", "your", "make", "game", "add", "when", "into", "from", "more", "less", "every", "each", "tap", "can", "get", "have", "has", "its", "are", "but", "not", "all", "out", "one", "two"]);
const stem = (word: string) => word.replace(/(ies|es|s|ing|ed)$/, "");
const words = (text: string) => (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length > 2 && !STOP_WORDS.has(w)).map(stem);

function relevantAssets(catalog: CatalogEntry[], request: string, code: string | null) {
  const used = new Set((code?.match(/["'][a-z0-9]+(?:-[a-z0-9]+)+["']|["'][a-z0-9]+["']/g) ?? []).map((s) => s.slice(1, -1)));
  const wanted = new Set([...words(request), ...ALWAYS_RELEVANT.map(stem), ...[...used].flatMap((key) => words(key.replace(/-/g, " ")))]);
  const score = (a: CatalogEntry) => (used.has(a.key) ? 1000 : words(a.key.replace(/-/g, " ") + " " + a.description).filter((w) => wanted.has(w)).length);
  const top = (kind: CatalogEntry["kind"], limit: number) =>
    catalog
      .filter((a) => a.kind === kind)
      .map((a) => ({ a, s: score(a) }))
      .filter(({ s }) => s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, limit)
      .map(({ a }) => a);
  return [...top("image", 150), ...top("sound", 40)];
}

function assetLibrary(catalog: CatalogEntry[]) {
  if (catalog.length === 0) return "";
  const line = (a: CatalogEntry) => `- ${a.key}: ${a.description}${a.width && a.height ? ` (${a.width}x${a.height})` : ""}`;
  return `

Asset library (the entries most relevant to this game, picked from a larger library; prefer them over emoji when they fit the theme, and use only keys from this list):
Images, drawn with G.sprite(key, x, y, size):
${catalog.filter((a) => a.kind === "image").map(line).join("\n")}
Sounds, played with G.sound(key):
${catalog.filter((a) => a.kind === "sound").map(line).join("\n")}`;
}

const systemPrompt = (catalog: CatalogEntry[]) => `You are the game engine behind a mobile app where anyone vibecodes hypercasual games by describing them. You write complete, polished, fun hypercasual games in JavaScript for our environment.

${SDK_DOCS}${assetLibrary(catalog)}

Design rules:
- Hypercasual: one-thumb controls (tap, hold, or drag), instantly understandable, 10-60 second runs, difficulty that ramps over time, satisfying feedback (G.burst, G.shake, score pops).
- Portrait phone. Size everything from G.W, G.H and G.unit, never fixed pixels.
- The score is drawn at the top center (around y = G.H * 0.1): don't draw your own text there. Keep title under 20 characters and startText and overText under 30.
- Use library images, emoji and shapes as art, and library sounds for feedback; pick a cohesive color palette.
- Keep all state in variables that start() fully resets.
- The code must run without errors. No fetch, no new Image(), no new Audio(), no DOM access beyond drawing: load assets only through G.sprite, G.sound and G.load.

Example of a complete game in this environment:
\`\`\`javascript
${STARTER_GAMES[1].code}
\`\`\`

Reply in exactly this format and nothing else:
TITLE: <short catchy game name>
SUMMARY: <one short sentence telling the creator what you built or changed>
\`\`\`javascript
<the complete game code>
\`\`\``;

type Message = { role: "system" | "user" | "assistant"; content: string };

async function stream(messages: Message[], onProgress: (chars: number) => Promise<void>) {
  const ownKey = process.env.AI_API_KEY;
  const baseUrl = ownKey ? (process.env.AI_BASE_URL ?? "https://api.openai.com/v1") : "https://ai-gateway.convex.dev/v1";
  const token = ownKey ?? (await getServiceToken("ai-gateway"));
  const model = process.env.AI_MODEL ?? (ownKey ? "gpt-4.1" : "anthropic/claude-sonnet-4.5");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: 12000, stream: true }),
  });
  if (!response.ok || !response.body) {
    throw new Error(`AI request failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let lastReport = Date.now();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "" || data === "[DONE]") continue;
      try {
        text += JSON.parse(data).choices?.[0]?.delta?.content ?? "";
      } catch {}
    }
    if (Date.now() - lastReport > 1500) {
      lastReport = Date.now();
      await onProgress(text.length);
    }
  }
  return text;
}

function parseReply(text: string) {
  const code = text.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/)?.[1]?.trim();
  if (!code) throw new Error("The AI did not return any game code");
  const title = text.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim().slice(0, 40) || "Untitled game";
  const summary = text.match(/^SUMMARY:\s*(.+)$/m)?.[1]?.trim().slice(0, 240) || "Updated your game.";
  return { code, title, summary };
}

function syntaxError(code: string): string | null {
  try {
    new Script(code);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function setStage(ctx: ActionCtx, gameId: Id<"games">, stage: string, error?: string) {
  await ctx.runMutation(internal.games.setStage, { gameId, stage, error });
}

export const generate = internalAction({
  args: { gameId: v.id("games"), prompt: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, prompt }) => {
    try {
      const loaded = await ctx.runQuery(internal.games.loadForGeneration, { gameId });
      if (loaded === null) return null;
      const messages: Message[] = [
        { role: "system", content: systemPrompt(relevantAssets(await ctx.runQuery(internal.assets.catalog, {}), prompt, loaded.code)) },
        {
          role: "user",
          content: loaded.code
            ? `Here is the current game:\n\`\`\`javascript\n${loaded.code}\n\`\`\`\n\nChange request: ${prompt}\n\nReturn the complete updated game. Keep everything the creator didn't ask to change.`
            : `Build this game: ${prompt}`,
        },
      ];
      const verb = loaded.code ? "Updating your game" : "Building your game";
      await setStage(ctx, gameId, verb);
      let reply = await stream(messages, (chars) => setStage(ctx, gameId, `${verb} · ${Math.round(chars / 40)} lines`));
      let result = parseReply(reply);
      const error = syntaxError(result.code);
      if (error !== null) {
        await setStage(ctx, gameId, "Fixing a bug");
        messages.push(
          { role: "assistant", content: reply },
          { role: "user", content: `That code has a syntax error: ${error}. Return the complete fixed game in the same format.` },
        );
        reply = await stream(messages, (chars) => setStage(ctx, gameId, `Fixing a bug · ${Math.round(chars / 40)} lines`));
        result = parseReply(reply);
        const stillBroken = syntaxError(result.code);
        if (stillBroken !== null) throw new Error("The generated code has a syntax error: " + stillBroken);
      }
      await ctx.runMutation(internal.games.saveVersion, { gameId, prompt, ...result });
    } catch (error) {
      await setStage(ctx, gameId, "Failed", error instanceof Error ? error.message : String(error));
    }
    return null;
  },
});
