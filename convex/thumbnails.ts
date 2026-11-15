import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";

export const save = action({
  args: { gameId: v.id("games"), versionId: v.id("gameVersions"), image: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, versionId, image }) => {
    const base64 = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(image)?.[1];
    if (base64 === undefined || base64.length > 500_000) return null;
    const userId = (await ctx.auth.getUserIdentity())?.subject.split("|")[0] ?? null;
    if (!(await ctx.runQuery(internal.thumbnails.needed, { gameId, versionId, userId }))) return null;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const storageId = await ctx.storage.store(new Blob([bytes], { type: "image/jpeg" }));
    await ctx.runMutation(internal.thumbnails.attach, { gameId, versionId, storageId });
    return null;
  },
});

export const needed = internalQuery({
  args: { gameId: v.id("games"), versionId: v.id("gameVersions"), userId: v.union(v.string(), v.null()) },
  returns: v.boolean(),
  handler: async (ctx, { gameId, versionId, userId }) => {
    const game = await ctx.db.get(gameId);
    if (game === null || game.currentVersion !== versionId || game.thumbnailVersion === versionId) return false;
    return game.status === "published" || game.owner === userId;
  },
});

export const attach = internalMutation({
  args: { gameId: v.id("games"), versionId: v.id("gameVersions"), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, { gameId, versionId, storageId }) => {
    const game = await ctx.db.get(gameId);
    if (game === null || game.currentVersion !== versionId || game.thumbnailVersion === versionId) {
      await ctx.storage.delete(storageId);
      return null;
    }
    if (game.thumbnail) await ctx.storage.delete(game.thumbnail);
    await ctx.db.patch(gameId, { thumbnail: storageId, thumbnailVersion: versionId });
    return null;
  },
});
