# Product context: hypercasual game platform

What we're building for the Convex hackathon (6 hours, 2 people), and the decisions behind it.

## The idea

A mobile app where anyone can **vibecode** a hypercasual game. You describe the game, play it right away, refine it with more prompts, and publish it. Once published, it shows up in everyone's feed.

- **Thesis:** hypercasual games are easy to build but hard to make go viral. If we remove the barrier to making and distributing them, we'll see hundreds of games, and players pick the good ones by playing them.
- **Differentiation:** the whole loop happens on the phone: prompt → play → tweak → publish → others play it seconds later. Competitors only cover parts of it. Websim and Rosebud do prompt-to-game, and Poki and CrazyGames do hosting.
- **"Marketplace"** means a platform where creators publish and players play. There's no buying or selling.

## Decisions

| Topic | Decision |
|---|---|
| Who creates | Average users, not just developers, working inside the mobile app. Dictation (the keyboard mic) plus one-tap tweak chips make typing on a phone bearable. |
| Game scope | Hypercasual only, 2D, portrait, one-tap controls. |
| How games are made | **The AI writes real game code.** Creators vibecode: they describe a game, and the AI writes the complete JavaScript game. Each change request edits that code. "Templates" means a starter **environment**, not finished games: a canvas runtime with touch input, a score HUD, start/game-over/retry screens, physics and collision helpers, particles, screen shake, and an asset library. We do **not** offer sliders or settings knobs. Every change happens through a prompt. |
| Assets | An asset library of emoji plus built-in shapes (circle, square, triangle, diamond, star, heart), drawn by `G.sprite`. Games can also draw anything with the canvas API. No AI-generated art for v1. |
| AI | Convex AI Gateway, `anthropic/claude-sonnet-4.5` by default (override with `AI_MODEL`). Setting `AI_API_KEY` on the deployment switches to any OpenAI-compatible provider (`AI_BASE_URL`, `AI_MODEL`). Responses stream, so the editor shows live progress. Every result is syntax-checked, with one automatic repair round. |
| Iteration loop | One screen: the live game preview on top, a prompt box and suggestion chips below. A Code toggle shows the source. If the game crashes at runtime, the error appears with a one-tap **Fix it** button that sends the error back to the AI. Every change saves a new version, and undo is one tap. |
| Publishing | Goes live instantly. No review step for the hackathon. |
| Remix | In v1. Remixing copies a published game's current version into your own draft, and the feed credits the original game. |
| Accounts | Creating, remixing, and publishing need an account (Convex Auth, username and password). Playing doesn't; anonymous plays are counted with a device ID kept in secure storage. |
| Ranking | Plays decayed by age, so new games still get seen instead of the earliest ones winning forever. |
| Platform | Expo (React Native). Tested on iOS (Revyl's iPhone 16 simulator). Games are untrusted code, so each one runs in a sandboxed WebView whose content security policy blocks all network access. |
| Payments / ad revenue | **Later, not now.** Agreed that ad revenue share won't attract creators early. What attracts them first is an audience and play data. |

## Deliberately out of scope for v1

- Sharing drafts as links.
- Moderation and review before publishing.
- Payments, ad revenue share, and creator payouts.
- AI-generated art, sound, and 3D.
- Better ranking signals: replay rate, session length, next-day return, and guaranteed exposure slots for new games.

## Open risks we discussed

- **Getting players:** a new platform has no audience on day one, the same problem creators have. The pitch has to say why players would open this app.
- **Bot farming:** once plays drive ranking (and later payouts), someone will fake them. Count only verified play time when money gets involved.
- **Graduating hits:** a game that goes viral may leave for the App Store or a publisher. That could become a business, scouting games for publishers, rather than a leak.
- **App Store rules on hosted games** (guideline 4.7) need a read before shipping to the App Store.

## Current state

- **Shipped (PRs #2, #3 and the vibecoding rework):**
  - Convex schema, Convex Auth, the starter environment, and AI-written game code.
  - The create/tweak/undo/publish/remix backend.
  - Swipe feed with play counts.
  - Create tab with the live editor.
  - Five seeded starter games.
- **Blocker:** AI generation fails with "Convex AI gateway is not enabled for your team." Fix it by upgrading the `genc-saracaydin` Convex team to a paid plan, or by setting `AI_API_KEY` on the `diligent-lemur-805` deployment.
- **iOS builds must be code-signed,** even for the simulator (`CODE_SIGN_IDENTITY=-`). Unsigned builds break secure storage, which leaves sign-in stuck on loading.

## Code map

- `convex/gameSdk.ts`: the starter environment (the `G` runtime) and the API docs the AI is given.
- `convex/starterGames.ts`: five example games written against the environment. They seed the feed and serve as the AI's style example.
- `game/buildGameHtml.ts`: wraps a game's code and the environment into one sandboxed HTML page.
- `convex/ai.ts`: the Node action that streams the AI, extracts the code, syntax-checks it, and runs one repair round.
- `convex/games.ts`: create, tweak, undo, publish, remix, feed, and the creator's own games.
- `convex/plays.ts`: play tracking.
- `convex/seed.ts`: seeds the starter games (`npx convex run seed:run`).
- `src/`: the app screens. `Feed` is the Play tab, `Studio` and `Editor` make up the Create tab, plus `AuthForm` and `GameView` (the WebView).

## Running it

1. `npm install`
2. `npx convex dev` writes `EXPO_PUBLIC_CONVEX_URL` to `.env.local`.
3. `npx expo start`

The app uses native modules (secure store, WebView), so run it as a development build or a Revyl build rather than in Expo Go.
