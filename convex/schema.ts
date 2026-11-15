import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vGameConfig } from "./gameConfig";

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
    config: vGameConfig,
    prompt: v.string(),
    summary: v.string(),
  }).index("by_game", ["game", "number"]),
  plays: defineTable({
    game: v.id("games"),
    deviceId: v.string(),
    score: v.number(),
  }).index("by_game", ["game"]),
});
