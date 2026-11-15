import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { STARTER_GAMES } from "./starterGames";

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
    for (const [i, { title, code }] of STARTER_GAMES.entries()) {
      const gameId = await ctx.db.insert("games", {
        owner,
        title,
        status: "published",
        publishedAt: now - i * 60_000,
        plays: 0,
      });
      const versionId = await ctx.db.insert("gameVersions", {
        game: gameId,
        number: 1,
        code,
        prompt: "Starter game",
        summary: "Starter game.",
      });
      await ctx.db.patch(gameId, { currentVersion: versionId });
    }
    return STARTER_GAMES.length;
  },
});
