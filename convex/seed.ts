import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { defaultConfig, sanitizeConfig } from "./gameConfig";

const SEED_GAMES = [
  { ...defaultConfig("dodger"), title: "Cucumber Panic", player: "🐱", obstacle: "🥒", collectible: "🐟" },
  { ...defaultConfig("flappy"), title: "Rocket Flap", player: "🚀", obstacle: "square", colors: { background: "#0B0B2B", accent: "#FFD166", text: "#FFFFFF", obstacle: "#6C63FF" } },
  { ...defaultConfig("stacker"), title: "Pancake Tower", player: "🥞", colors: { background: "#FFF3D6", accent: "#E9A23B", text: "#5A3A12", obstacle: "#C9772B" } },
  { ...defaultConfig("runner"), title: "Lava Ninja", player: "🥷", obstacle: "🪨", collectible: "🔥", colors: { background: "#2B0F0F", accent: "#FF6B35", text: "#FFFFFF", obstacle: "#FF3B1F" }, speed: 1.2 },
  { ...defaultConfig("timing"), title: "Bullseye", player: "🎯", collectible: "⭐" },
];

export const run = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("games")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "published"))
      .first();
    if (existing !== null) return 0;
    const owner = await ctx.db.insert("users", {});
    const now = Date.now();
    for (const [i, raw] of SEED_GAMES.entries()) {
      const config = sanitizeConfig(raw);
      const gameId = await ctx.db.insert("games", {
        owner,
        title: config.title,
        status: "published",
        publishedAt: now - i * 60_000,
        plays: 0,
      });
      const versionId = await ctx.db.insert("gameVersions", {
        game: gameId,
        number: 1,
        config,
        prompt: "Starter game",
        summary: "Starter game.",
      });
      await ctx.db.patch(gameId, { currentVersion: versionId });
    }
    return SEED_GAMES.length;
  },
});
