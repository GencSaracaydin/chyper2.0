import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({}),
  moments: defineTable({
    author: v.id("users"),
    text: v.string(),
  }).index("by_author", ["author"]),
  games: defineTable({
    owner: v.id("users"),
    title: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    currentVersion: v.optional(v.id("gameVersions")),
    remixOf: v.optional(v.id("games")),
    publishedAt: v.optional(v.number()),
    plays: v.number(),
    visitors: v.optional(v.number()),
    thumbnail: v.optional(v.id("_storage")),
    thumbnailVersion: v.optional(v.id("gameVersions")),
    job: v.optional(
      v.object({
        prompt: v.string(),
        stage: v.string(),
        error: v.optional(v.string()),
      }),
    ),
  })
    .index("by_owner", ["owner"])
    .index("by_status_publishedAt", ["status", "publishedAt"]),
  gameVersions: defineTable({
    game: v.id("games"),
    number: v.number(),
    code: v.string(),
    prompt: v.string(),
    summary: v.string(),
  }).index("by_game", ["game", "number"]),
  assets: defineTable({
    key: v.string(),
    kind: v.union(v.literal("image"), v.literal("sound")),
    source: v.union(v.literal("kenney"), v.literal("fal")),
    description: v.string(),
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  }).index("by_key", ["key"]),
  plays: defineTable({
    game: v.id("games"),
    deviceId: v.string(),
    score: v.number(),
  }).index("by_game", ["game"]),
  visits: defineTable({
    game: v.id("games"),
    deviceId: v.string(),
  }).index("by_game_device", ["game", "deviceId"]),
});
