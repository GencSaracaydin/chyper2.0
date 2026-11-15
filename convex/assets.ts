import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const assetFields = {
  key: v.string(),
  kind: v.union(v.literal("image"), v.literal("sound")),
  source: v.union(v.literal("kenney"), v.literal("fal")),
  description: v.string(),
  storageId: v.id("_storage"),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
};

export const generateUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const add = internalMutation({
  args: assetFields,
  returns: v.id("assets"),
  handler: async (ctx, asset) => {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(asset.key)) throw new Error("Asset keys are lowercase kebab-case: " + asset.key);
    if ((asset.kind === "sound") !== /^(sfx|music)-/.test(asset.key)) {
      throw new Error("Sound keys start with sfx- or music-, and image keys don't: " + asset.key);
    }
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_key", (q) => q.eq("key", asset.key))
      .unique();
    if (existing === null) return await ctx.db.insert("assets", asset);
    if (existing.storageId !== asset.storageId) await ctx.storage.delete(existing.storageId);
    await ctx.db.replace(existing._id, asset);
    return existing._id;
  },
});

export const byKey = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, { key }) => {
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return asset?.storageId ?? null;
  },
});

export const catalog = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      key: v.string(),
      kind: v.union(v.literal("image"), v.literal("sound")),
      description: v.string(),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const assets = await ctx.db.query("assets").withIndex("by_key").collect();
    return assets.map(({ key, kind, description, width, height }) => ({ key, kind, description, width, height }));
  },
});
