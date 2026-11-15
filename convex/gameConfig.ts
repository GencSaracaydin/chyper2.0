import { v } from "convex/values";

export const TEMPLATES = ["runner", "stacker", "dodger", "timing", "flappy"] as const;
export type Template = (typeof TEMPLATES)[number];

export const vGameConfig = v.object({
  template: v.union(...TEMPLATES.map((t) => v.literal(t))),
  title: v.string(),
  colors: v.object({ background: v.string(), accent: v.string(), text: v.string(), obstacle: v.string() }),
  player: v.string(),
  obstacle: v.string(),
  collectible: v.string(),
  speed: v.number(),
  gravity: v.number(),
  jump: v.number(),
  spawnRate: v.number(),
  ramp: v.number(),
  size: v.number(),
  gap: v.number(),
  startText: v.string(),
  overText: v.string(),
});

export const SHAPES = ["circle", "square", "triangle", "diamond", "star"] as const;

export type GameConfig = {
  template: Template;
  title: string;
  colors: { background: string; accent: string; text: string; obstacle: string };
  player: string;
  obstacle: string;
  collectible: string;
  speed: number;
  gravity: number;
  jump: number;
  spawnRate: number;
  ramp: number;
  size: number;
  gap: number;
  startText: string;
  overText: string;
};

export const TEMPLATE_INFO: Record<Template, string> = {
  runner: "Endless runner: the player runs along the ground and taps to jump over obstacles; collectibles float above for bonus points.",
  stacker: "Stacker: a block slides back and forth and the player taps to drop it on the tower; overhang is sliced off and a miss ends the game.",
  dodger: "Dodger: the player slides along the bottom and each tap reverses direction to dodge falling obstacles; collectibles give bonus points.",
  timing: "Timing tap: a needle spins around a ring and the player taps when it is inside the target zone; each hit shrinks the zone and speeds the needle up.",
  flappy: "Flappy: the player falls under gravity and each tap flaps upward through gaps between obstacle pillars.",
};

export const KNOBS = `- speed (0.5-2.5): how fast the world or needle moves
- gravity (0.5-2): how strongly the player falls (runner, flappy)
- jump (0.5-2): jump or flap strength (runner, flappy)
- spawnRate (0.5-2): how often obstacles and collectibles appear (runner, dodger, flappy)
- ramp (0-2): how quickly the game gets harder over time
- size (0.6-1.6): size of the player and the stacker block height
- gap (0.6-1.6): flappy gap height, stacker starting block width, timing target zone width`;

const DEFAULTS: Record<Template, GameConfig> = {
  runner: base("runner", "Dash", "🏃", "🌵", "⭐", { background: "#FFF4E0", accent: "#FF7A00", text: "#2B2B2B", obstacle: "#2E7D32" }),
  stacker: base("stacker", "Stack Up", "square", "square", "", { background: "#1B1F3B", accent: "#4FC3F7", text: "#FFFFFF", obstacle: "#FF4081" }),
  dodger: base("dodger", "Dodge!", "🐱", "☄️", "🐟", { background: "#0D1B2A", accent: "#FFD166", text: "#FFFFFF", obstacle: "#EF476F" }),
  timing: base("timing", "Perfect Tap", "circle", "circle", "", { background: "#111111", accent: "#00E5A0", text: "#FFFFFF", obstacle: "#333333" }),
  flappy: base("flappy", "Flap", "🐤", "square", "", { background: "#87CEEB", accent: "#FFB703", text: "#1D3557", obstacle: "#2A9D8F" }),
};

function base(
  template: Template,
  title: string,
  player: string,
  obstacle: string,
  collectible: string,
  colors: GameConfig["colors"],
): GameConfig {
  return {
    template,
    title,
    colors,
    player,
    obstacle,
    collectible,
    speed: 1,
    gravity: 1,
    jump: 1,
    spawnRate: 1,
    ramp: 1,
    size: 1,
    gap: 1,
    startText: "Tap to start",
    overText: "Game over",
  };
}

export function defaultConfig(template: Template): GameConfig {
  return structuredClone(DEFAULTS[template]);
}

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const color = (value: unknown, fallback: string) =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;

const text = (value: unknown, max: number, fallback: string) =>
  typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : fallback;

const sprite = (value: unknown, fallback: string, allowEmpty = false) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed === "") return allowEmpty ? "" : fallback;
  if ((SHAPES as readonly string[]).includes(trimmed)) return trimmed;
  return [...trimmed].length <= 4 && !/[<>"'`\\]/.test(trimmed) ? trimmed : fallback;
};

export function sanitizeConfig(input: unknown): GameConfig {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const template: Template = TEMPLATES.includes(raw.template) ? raw.template : "runner";
  const d = DEFAULTS[template];
  const colors = (raw.colors && typeof raw.colors === "object" ? raw.colors : {}) as Record<string, unknown>;
  return {
    template,
    title: text(raw.title, 32, d.title),
    colors: {
      background: color(colors.background, d.colors.background),
      accent: color(colors.accent, d.colors.accent),
      text: color(colors.text, d.colors.text),
      obstacle: color(colors.obstacle, d.colors.obstacle),
    },
    player: sprite(raw.player, d.player),
    obstacle: sprite(raw.obstacle, d.obstacle),
    collectible: sprite(raw.collectible, d.collectible, true),
    speed: clamp(raw.speed, 0.5, 2.5, d.speed),
    gravity: clamp(raw.gravity, 0.5, 2, d.gravity),
    jump: clamp(raw.jump, 0.5, 2, d.jump),
    spawnRate: clamp(raw.spawnRate, 0.5, 2, d.spawnRate),
    ramp: clamp(raw.ramp, 0, 2, d.ramp),
    size: clamp(raw.size, 0.6, 1.6, d.size),
    gap: clamp(raw.gap, 0.6, 1.6, d.gap),
    startText: text(raw.startText, 40, d.startText),
    overText: text(raw.overText, 40, d.overText),
  };
}
