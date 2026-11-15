import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query, type QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in to make games");
  return userId;
}

async function requireOwnGame(ctx: QueryCtx, gameId: Id<"games">) {
  const userId = await requireUser(ctx);
  const game = await ctx.db.get(gameId);
  if (game === null || game.owner !== userId) throw new Error("Game not found");
  return game;
}

async function withCode(ctx: QueryCtx, game: Doc<"games">) {
  const version = game.currentVersion ? await ctx.db.get(game.currentVersion) : null;
  return {
    ...game,
    code: version?.code ?? null,
    versionNumber: version?.number ?? 0,
    summary: version?.summary ?? null,
  };
}

export const create = mutation({
  args: { prompt: v.string() },
  returns: v.id("games"),
  handler: async (ctx, { prompt }) => {
    const owner = await requireUser(ctx);
    const gameId = await ctx.db.insert("games", {
      owner,
      title: "New game",
      status: "draft",
      plays: 0,
      job: { prompt, stage: "Reading your idea" },
    });
    await ctx.scheduler.runAfter(0, internal.ai.generate, { gameId, prompt });
    return gameId;
  },
});

export const tweak = mutation({
  args: { gameId: v.id("games"), prompt: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, prompt }) => {
    const game = await requireOwnGame(ctx, gameId);
    if (game.job && !game.job.error) throw new Error("Still working on the last change");
    await ctx.db.patch(gameId, { job: { prompt, stage: "Reading your change" } });
    await ctx.scheduler.runAfter(0, internal.ai.generate, { gameId, prompt });
    return null;
  },
});

export const dismissError = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, { gameId }) => {
    const game = await requireOwnGame(ctx, gameId);
    if (game.job?.error) await ctx.db.patch(gameId, { job: undefined });
    return null;
  },
});

export const undo = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, { gameId }) => {
    const game = await requireOwnGame(ctx, gameId);
    const current = game.currentVersion ? await ctx.db.get(game.currentVersion) : null;
    if (current === null) return null;
    const previous = await ctx.db
      .query("gameVersions")
      .withIndex("by_game", (q) => q.eq("game", gameId).lt("number", current.number))
      .order("desc")
      .first();
    if (previous === null) return null;
    await ctx.db.patch(gameId, { currentVersion: previous._id });
    return null;
  },
});

export const publish = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, { gameId }) => {
    const game = await requireOwnGame(ctx, gameId);
    if (!game.currentVersion) throw new Error("Nothing to publish yet");
    await ctx.db.patch(gameId, { status: "published", publishedAt: game.publishedAt ?? Date.now() });
    return null;
  },
});

export const remix = mutation({
  args: { gameId: v.id("games") },
  returns: v.id("games"),
  handler: async (ctx, { gameId }) => {
    const owner = await requireUser(ctx);
    const source = await ctx.db.get(gameId);
    if (source === null || source.status !== "published" || !source.currentVersion) throw new Error("Game not found");
    const version = await ctx.db.get(source.currentVersion);
    if (version === null) throw new Error("Game not found");
    const newGameId = await ctx.db.insert("games", {
      owner,
      title: source.title,
      status: "draft",
      plays: 0,
      remixOf: source._id,
    });
    const versionId = await ctx.db.insert("gameVersions", {
      game: newGameId,
      number: 1,
      code: version.code,
      prompt: "Remix of " + source.title,
      summary: "Remixed from " + source.title + ". Describe what to change.",
    });
    await ctx.db.patch(newGameId, { currentVersion: versionId });
    return newGameId;
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const games = await ctx.db
      .query("games")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .order("desc")
      .collect();
    return await Promise.all(games.map((game) => withCode(ctx, game)));
  },
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (game === null) return null;
    if (game.status !== "published" && game.owner !== (await getAuthUserId(ctx))) return null;
    const remixOf = game.remixOf ? await ctx.db.get(game.remixOf) : null;
    return { ...(await withCode(ctx, game)), remixOfTitle: remixOf?.title ?? null };
  },
});

export const feed = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "published"))
      .order("desc")
      .take(200);
    const now = Date.now();
    const ranked = games
      .map((game) => {
        const hours = (now - (game.publishedAt ?? now)) / 3_600_000;
        return { game, rank: (game.plays + 1) / Math.pow(hours + 2, 1.5) };
      })
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 50);
    return await Promise.all(
      ranked.map(async ({ game }) => {
        const remixOf = game.remixOf ? await ctx.db.get(game.remixOf) : null;
        return { ...(await withCode(ctx, game)), remixOfTitle: remixOf?.title ?? null };
      }),
    );
  },
});

export const loadForGeneration = internalQuery({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (game === null) return null;
    const version = game.currentVersion ? await ctx.db.get(game.currentVersion) : null;
    return { code: version?.code ?? null };
  },
});

export const setStage = internalMutation({
  args: { gameId: v.id("games"), stage: v.string(), error: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { gameId, stage, error }) => {
    const game = await ctx.db.get(gameId);
    if (game?.job) await ctx.db.patch(gameId, { job: { ...game.job, stage, error } });
    return null;
  },
});

export const saveVersion = internalMutation({
  args: { gameId: v.id("games"), title: v.string(), code: v.string(), prompt: v.string(), summary: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, title, code, prompt, summary }) => {
    const latest = await ctx.db
      .query("gameVersions")
      .withIndex("by_game", (q) => q.eq("game", gameId))
      .order("desc")
      .first();
    const versionId = await ctx.db.insert("gameVersions", {
      game: gameId,
      number: (latest?.number ?? 0) + 1,
      code,
      prompt,
      summary,
    });
    await ctx.db.patch(gameId, { currentVersion: versionId, title, job: undefined });
    return null;
  },
});
