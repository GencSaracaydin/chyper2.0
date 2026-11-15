import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";

export const record = mutation({
  args: { gameId: v.id("games"), deviceId: v.string(), score: v.number() },
  returns: v.null(),
  handler: async (ctx, { gameId, deviceId, score }) => {
    const game = await ctx.db.get(gameId);
    if (game === null || game.status !== "published") return null;
    await ctx.db.insert("plays", { game: gameId, deviceId: deviceId.slice(0, 64), score });
    await ctx.db.patch(gameId, { plays: game.plays + 1 });
    return null;
  },
});

export const visit = mutation({
  args: { gameId: v.id("games"), deviceId: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, deviceId }) => {
    const game = await ctx.db.get(gameId);
    if (game === null || game.status !== "published") return null;
    const device = deviceId.slice(0, 64);
    const seen = await ctx.db
      .query("visits")
      .withIndex("by_game_device", (q) => q.eq("game", gameId).eq("deviceId", device))
      .first();
    if (seen !== null) return null;
    await ctx.db.insert("visits", { game: gameId, deviceId: device });
    await ctx.db.patch(gameId, { visitors: (game.visitors ?? 0) + 1 });
    return null;
  },
});

export const backfillVisitors = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();
    for (const game of games) {
      const plays = await ctx.db
        .query("plays")
        .withIndex("by_game", (q) => q.eq("game", game._id))
        .collect();
      let visitors = game.visitors ?? 0;
      for (const device of new Set(plays.map((play) => play.deviceId))) {
        const seen = await ctx.db
          .query("visits")
          .withIndex("by_game_device", (q) => q.eq("game", game._id).eq("deviceId", device))
          .first();
        if (seen !== null) continue;
        await ctx.db.insert("visits", { game: game._id, deviceId: device });
        visitors += 1;
      }
      await ctx.db.patch(game._id, { visitors });
    }
    return games.length;
  },
});
