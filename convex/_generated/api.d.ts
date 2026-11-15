/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as gameSdk from "../gameSdk.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as moments from "../moments.js";
import type * as plays from "../plays.js";
import type * as seed from "../seed.js";
import type * as starterGames from "../starterGames.js";
import type * as thumbnails from "../thumbnails.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  assets: typeof assets;
  auth: typeof auth;
  gameSdk: typeof gameSdk;
  games: typeof games;
  http: typeof http;
  moments: typeof moments;
  plays: typeof plays;
  seed: typeof seed;
  starterGames: typeof starterGames;
  thumbnails: typeof thumbnails;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
