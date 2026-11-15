import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
