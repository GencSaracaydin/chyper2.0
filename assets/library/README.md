# Asset library

Building blocks for the hypercasual games: characters, genre kits, icons, backgrounds, particles, UI, fonts, and sound effects. Every pack is from [Kenney](https://kenney.nl) and licensed **CC0 1.0** (public domain): free for commercial use, no attribution required. Each pack folder keeps its original `License.txt`.

## Layout

```
assets/library/
  manifest.json          every pack with source, license, and each file's path (PNG width/height included)
  <category>/<pack>/     curated files; Preview.png shows the whole pack at a glance
```

To keep the library small, only one resolution of each image is kept (Kenney's "Default" size, not the Double/Retina/HD copies), and vector sources, packed spritesheets, and engine project files are left out. The originals are one download away at each pack's source URL.

## Packs

| Category | Pack | Files | Contents |
|---|---|---|---|
| audio | [casino-audio](audio/casino-audio) | 54 | Cards, chips, and dice sounds |
| audio | [digital-audio](audio/digital-audio) | 62 | Retro synth sounds: lasers, power-ups, jumps, zaps, phasers |
| audio | [impact-sounds](audio/impact-sounds) | 130 | Hits and footsteps on wood, metal, glass, plates, and more |
| audio | [interface-sounds](audio/interface-sounds) | 100 | Clicks, confirms, errors, toggles, and switches for menus |
| audio | [music-jingles](audio/music-jingles) | 85 | Short win/lose/level jingles in 8-bit, steel, pizzicato, and sax styles |
| audio | [sci-fi-sounds](audio/sci-fi-sounds) | 73 | Lasers, engines, force fields, explosions, and computer noises |
| characters | [animal-pack-redux](characters/animal-pack-redux) | 240 | 30 cute animal heads, round and square, with and without outlines |
| characters | [shape-characters](characters/shape-characters) | 105 | Simple geometric characters with faces and limbs, in several colors |
| characters | [toon-characters-1](characters/toon-characters-1) | 332 | Five cartoon characters (people, adventurers, robot, zombie) in many poses, plus body parts |
| effects | [particle-pack](effects/particle-pack) | 80 | Grayscale particle textures (fire, smoke, sparks, stars, magic, light) on transparent backgrounds; tint at runtime |
| environment | [background-elements](environment/background-elements) | 111 | Clouds, hills, trees, mountains, and sky pieces for layered backgrounds |
| environment | [foliage-sprites](environment/foliage-sprites) | 101 | Grass, bushes, flowers, and trees, flat and shaded |
| icons | [board-game-icons](icons/board-game-icons) | 255 | 250+ icons for cards, dice, pawns, resources, and arrows |
| icons | [emotes-pack](icons/emotes-pack) | 240 | Speech-bubble emotes (hearts, exclamation, faces) in vector and pixel styles |
| icons | [game-icons](icons/game-icons) | 211 | 106 UI glyphs (play, pause, settings, sound, arrows, trophy) in black and white |
| icons | [generic-items](icons/generic-items) | 326 | 165 everyday items (weapons, tools, food, gems), colored and white silhouettes |
| kits | [abstract-platformer](kits/abstract-platformer) | 372 | Clean colored tiles, players, enemies, and items for platformers |
| kits | [jumper-pack](kits/jumper-pack) | 122 | Doodle-jump style players, platforms, enemies, items, and backgrounds |
| kits | [new-platformer-pack](kits/new-platformer-pack) | 445 | Full platformer kit: tiles, characters, enemies, backgrounds |
| kits | [physics-assets](kits/physics-assets) | 336 | Wood, metal, glass, stone, and explosive blocks plus aliens for physics puzzlers |
| kits | [pixel-platformer](kits/pixel-platformer) | 239 | Tiny 18px pixel-art platformer tiles, characters, and backgrounds |
| kits | [pixel-shmup](kits/pixel-shmup) | 149 | Pixel-art ships and tiles for vertical shoot-em-ups |
| kits | [puzzle-pack-2](kits/puzzle-pack-2) | 799 | Tiles, balls, paddles, pipes, coins, and particles for breakout and match games |
| kits | [rolling-ball-assets](kits/rolling-ball-assets) | 60 | Balls, blocks, and holes for tilt or rolling-ball games |
| kits | [simple-space](kits/simple-space) | 49 | Flat ships, meteors, effects, and UI for space shooters |
| kits | [tappy-plane](kits/tappy-plane) | 80 | Flappy-style planes, rocks, ground, and UI with letters and numbers |
| ui | [kenney-fonts](ui/kenney-fonts) | 12 | 12 game fonts (pixel, blocks, future, rocket, mini) |
| ui | [ui-pack](ui/ui-pack) | 443 | Buttons, panels, sliders, checkboxes, and arrows in five colors, plus click sounds and a font |

## Using these in games

Games run in a sandboxed WebView whose content security policy blocks all network access, so a game can't load these files by URL. To use one, inline it into the game HTML as a `data:` URI (base64) and decode it into an `Image` or `AudioBuffer`; the environment doesn't do that yet.

Audio is Ogg Vorbis as shipped by Kenney. Check playback in the iOS WebView before relying on it, and convert to AAC/M4A or MP3 if it doesn't play.

## Refreshing

Packs were downloaded from kenney.nl on 2026-11-15. To add a pack, download it from `https://kenney.nl/assets/<pack>`, copy the default-resolution PNGs or OGGs plus `License.txt` into `<category>/<pack>/`, and add it to `manifest.json`.
