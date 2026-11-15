# Generated asset pack (fal)

437 original assets generated with [fal](https://fal.ai) models for this project, in one consistent bold flat cartoon style. They sit next to the Kenney packs and use the same Convex `assets` table, with `source: "fal"`.

| Kind | Count | Model | Format |
|---|---|---|---|
| Sprites (characters, enemies, vehicles, collectibles, food, obstacles, platforms, sports, weapons, effects, UI) | 312 | `openai/gpt-image-2.6/flare/text-to-image` | PNG with a transparent background, trimmed to its content, 512px on the longest side |
| Backgrounds (portrait 9:16 scenes) | 34 | `google/nano-banana-2.1` | JPEG, 576x1024 |
| Sound effects | 77 | `elevenlabs/sound-effects/v3` | MP3, 0.2 to 2.5 s |
| Music loops (instrumental) | 14 | `elevenlabs/music/v2.5` | MP3, 30 s |

[manifest.json](manifest.json) lists every asset's `key`, `kind`, `category`, `description`, `file` and `model`, plus `width` and `height` for images. Each media file also has a `.json` sidecar with the same model and size details, which the generator uses to rebuild the manifest. Keys don't collide with the Kenney keys in `scripts/kenneyAssets.json`. Sound keys start with `sfx-` or `music-`, which the asset table requires.

## Regenerating or adding assets

1. Add a line to [scripts/fal/assets.txt](../../../scripts/fal/assets.txt) in the right section: `key | description` (for SFX, `key | description | seconds`).
2. Run `FAL_API_KEY=... python3 scripts/fal/generate.py` (needs Pillow). Files that already exist are skipped. Use `--only key1,key2 --force` to redo specific assets. The fal key is on the dev deployment: `npx convex env get FAL_API_KEY`.
3. Upload with `CONVEX_DEPLOY_KEY=... EXPO_PUBLIC_CONVEX_URL=... bun scripts/importFalAssets.ts`. It replaces assets by key, so rerunning is safe.

Concurrency above about 16 requests hits fal's rate limit (HTTP 429). The generator retries with backoff.

## License

These assets were generated for this project through fal's commercial-use endpoints. They aren't CC0 like the Kenney packs: check each model provider's output terms before redistributing them outside the app.
