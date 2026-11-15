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
| How games are made | **Templates, not generated code.** Five hand-built templates: runner, stacker, dodger, timing tap, flappy. The AI only writes a JSON config: template, title, colors, sprites, and tuning knobs (speed, gravity, jump, spawn rate, difficulty ramp, size, gap). This is more reliable, faster to iterate on, and safe, because no user-written code ever runs on players' phones. |
| Assets | A library of emoji sprites, simple shapes, and color palettes, drawn in code. No AI-generated art for v1. |
| AI | Convex AI Gateway (`openai/gpt-4o-mini` by default). Setting `AI_API_KEY` on the deployment switches to any OpenAI-compatible provider (`AI_BASE_URL`, `AI_MODEL`). |
| Iteration loop | One screen: live preview on top, prompt bar and tweak chips below. Every change saves a new version, and undo is one tap. Generation progress shows live through a Convex reactive query. |
| Publishing | Goes live instantly. No review step for the hackathon. |
| Remix | In v1. Remixing copies a published game's current version into your own draft, and the feed credits the original game. |
| Accounts | Creating, remixing, and publishing need an account (Convex Auth, username and password). Playing doesn't; anonymous plays are counted with a device ID kept in secure storage. |
| Ranking | Plays decayed by age, so new games still get seen instead of the earliest ones winning forever. |
| Platform | Expo (React Native). Tested on iOS (Revyl's iPhone 16 simulator). Games run in a sandboxed WebView with a no-network content security policy. |
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

- **Shipped (PRs #2 and #3):**
  - Convex schema, Convex Auth, and the five templates.
  - The create/tweak/undo/publish/remix backend.
  - Swipe feed with play counts.
  - Create tab with the live editor.
  - Five seeded starter games.
- **Blocker:** AI generation fails with "Convex AI gateway is not enabled for your team." Fix it by upgrading the `genc-saracaydin` Convex team to a paid plan, or by setting `AI_API_KEY` on the `diligent-lemur-805` deployment.
- **iOS builds must be code-signed,** even for the simulator (`CODE_SIGN_IDENTITY=-`). Unsigned builds break secure storage, which leaves sign-in stuck on loading.

## Code map

- `game/buildGameHtml.ts`: the canvas runtime and all five templates, turned into one self-contained HTML page.
- `convex/gameConfig.ts`: the config schema, template defaults, and the sanitizer that clamps whatever the AI returns.
- `convex/ai.ts`: the prompt-to-config generation action.
- `convex/games.ts`: create, tweak, undo, publish, remix, feed, and the creator's own games.
- `convex/plays.ts`: play tracking.
- `convex/seed.ts`: seeds the starter games (`npx convex run seed:run`).
- `src/`: the app screens. `Feed` is the Play tab, `Studio` and `Editor` make up the Create tab, plus `AuthForm` and `GameView` (the WebView).

## Running it

1. `npm install`
2. `npx convex dev` writes `EXPO_PUBLIC_CONVEX_URL` to `.env.local`.
3. `npx expo start`

The app uses native modules (secure store, WebView), so run it as a development build or a Revyl build rather than in Expo Go.
