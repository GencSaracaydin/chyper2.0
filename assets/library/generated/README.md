# Generated asset pack (fal)

944 original assets generated with [fal](https://fal.ai) models for this project, in one consistent bold flat cartoon style. They sit next to the Kenney packs and use the same Convex `assets` table, with `source: "fal"`.

| Kind | Count | Model | Format |
|---|---|---|---|
| Sprites | 713 | `openai/gpt-image-2.6/flare/text-to-image` | PNG with a transparent background, trimmed to its content, 512px on the longest side |
| Backgrounds (portrait 9:16 scenes) | 64 | `google/nano-banana-2.1` | JPEG, 576x1024 |
| Sound effects | 145 | `elevenlabs/sound-effects/v3` | MP3, 0.2 to 2.5 s |
| Music loops (instrumental) | 22 | `elevenlabs/music/v2.5` | MP3, 30 s |

## Sets for popular hypercasual mechanics

Most sprites come in matching sets, so a game can be built from a single prefix:

| Mechanic | Keys |
|---|---|
| Flappy | `flappy-bird-up/down/dead`, `pipe-top`, `pipe-bottom`, `ground-strip`, `bg-flappy-city`, `sfx-flap-wing`, `sfx-score-point` |
| Tower stack | `stack-slab-*`, `stack-base`, `building-*`, `burger-*`, `cake-tier`, `sfx-stack-perfect`, `sfx-stack-chop` |
| Helix / bounce | `helix-*`, `bounce-ball-*`, `sfx-helix-bounce`, `sfx-helix-smash` |
| Knife throw | `knife-throw-*`, `target-log*`, `knife-icon-*`, `sfx-knife-*`, `sfx-log-break` |
| Fruit slicing | `fruit-*` with `-half-left`/`-half-right`, `juice-splat-*`, `slice-trail`, `slice-bomb`, `sfx-slice*` |
| Road crossing | `crossy-*`, `tile-grass/road/water/rail/sand/snow`, `sfx-hop`, `sfx-car-pass`, `sfx-train-horn` |
| Lane runner | `subway-*`, `lane-runner-*`, `lane-guard`, `temple-*`, `hoverboard`, `jetpack`, `bg-subway-tracks`, `bg-temple-path` |
| Vertical jumper | `jumper-*`, `bg-jumper-paper` |
| Color switch | `color-*`, `bg-color-dark`, `sfx-color-switch` |
| Bubble shooter | `bubble-*`, `aim-arrow`, `sfx-bubble-*` |
| Match-3 | `candy-*`, `gem-match-*`, `match-tile-board`, `*-blocker`, `sfx-match-3`, `sfx-cascade` |
| Sorting | `sort-tube-empty`, `sort-flask-empty`, `sort-ball-*`, `hexa-tile-*`, `nut-*`, `bolt-post` |
| Screw / pin puzzles | `screw-*`, `*-screw`, `pin-pull*` |
| Tile match | `tm-tile-*`, `tm-tray` |
| Crowd runner / bridge race | `crowd-*`, `bridge-plank-*`, `bg-crowd-track` |
| Archery / stickman | `bow-drawn`, `arrow-flying`, `target-board`, `balloon-*`, `stickman-*` |
| Ball sports | `basket-*`, `goalkeeper`, `soccer-*`, `golf-*`, `pinball-*`, `pool-*`, `air-hockey-*`, `cup-pong`, `bottle-flip` |
| Brick breaker / ball blast | `brick-*`, `breaker-*`, `ball-blast-*` |
| Snake / slither | `snake-*`, `worm-*`, `food-orb` |
| Parking jam / traffic | `parking-*`, `road-tile-*`, `traffic-light` |
| Hill climb | `jeep-*`, `dirt-bike`, `hill-ground`, `stunt-ramp`, `fuel-gauge` |
| Fishing | `fish-*`, `fishing-*`, `bg-ocean-deep`, `sfx-reel` |
| Merge | `merge-*` (numbered chains), `planet-*` |
| Plinko / slots / wheel | `plinko-*`, `slot-*`, `prize-wheel`, `wheel-pointer`, `sfx-slot-spin`, `sfx-jackpot` |
| Idle clicker | `cookie-big`, `coin-pile`, `cash-stack`, `factory`, `upgrade-arrow` |
| Smash / whack / piano | `glass-*`, `smash-hammer`, `mole-hole`, `piano-tile-*`, `sfx-piano-*` |
| Rope swing / cut the rope | `grapple-hook`, `swing-ring`, `rope-segment`, `candy-on-rope`, `cute-monster-mouth` |
| Shooters / survivor | `space-*`, `tank-*`, `turret`, `zombie-topdown`, `soldier-topdown`, `survivor-hero`, `xp-gem-*` |

[manifest.json](manifest.json) lists every asset's `key`, `kind`, `category`, `description`, `file` and `model`, plus `width` and `height` for images. Each media file also has a `.json` sidecar with the same model and size details, which the generator uses to rebuild the manifest. Keys don't collide with the Kenney keys in `scripts/kenneyAssets.json`. Sound keys start with `sfx-` or `music-`, which the asset table requires.

## Regenerating or adding assets

1. Add a line to [scripts/fal/assets.txt](../../../scripts/fal/assets.txt) in the right section: `key | description` (for SFX, `key | description | seconds`).
2. Run `FAL_API_KEY=... python3 scripts/fal/generate.py` (needs Pillow). Files that already exist are skipped. Use `--only key1,key2 --force` to redo specific assets. The fal key is on the dev deployment: `npx convex env get FAL_API_KEY`.
3. Upload with `CONVEX_DEPLOY_KEY=... EXPO_PUBLIC_CONVEX_URL=... bun scripts/importFalAssets.ts`. It replaces assets by key, so rerunning is safe.

Concurrency above about 16 requests hits fal's rate limit (HTTP 429). The generator retries with backoff.

## License

These assets were generated for this project through fal's commercial-use endpoints. They aren't CC0 like the Kenney packs: check each model provider's output terms before redistributing them outside the app.
