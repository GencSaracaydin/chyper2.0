import { getServiceToken } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { KNOBS, SHAPES, TEMPLATE_INFO, TEMPLATES, sanitizeConfig, type GameConfig } from "./gameConfig";

const SYSTEM_PROMPT = `You design hypercasual mobile games by writing a JSON config for one of five ready-made game templates. You never write code.

Templates:
${TEMPLATES.map((t) => `- ${t}: ${TEMPLATE_INFO[t]}`).join("\n")}

Config fields:
- template: one of ${TEMPLATES.join(", ")}
- title: short catchy game name (max 32 chars)
- colors: { background, accent, text, obstacle } as #RRGGBB hex; keep text readable on background
- player, obstacle, collectible: each a single emoji, or one of the shapes ${SHAPES.join(", ")}; collectible may be "" for none
- numeric knobs, 1 is the default:
${KNOBS}
- startText, overText: short screen texts (max 40 chars)

Reply with only a JSON object: {"config": {...full config...}, "summary": "one short sentence telling the player what you made or changed"}.`;

async function complete(messages: { role: string; content: string }[]) {
  const ownKey = process.env.AI_API_KEY;
  const baseUrl = ownKey ? (process.env.AI_BASE_URL ?? "https://api.openai.com/v1") : "https://ai-gateway.convex.dev/v1";
  const token = ownKey ?? (await getServiceToken("ai-gateway"));
  const model = process.env.AI_MODEL ?? (ownKey ? "gpt-4o-mini" : "openai/gpt-4o-mini");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.8 }),
  });
  if (!response.ok) throw new Error(`AI request failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const body = await response.json();
  return String(body.choices?.[0]?.message?.content ?? "");
}

function parseReply(text: string): { config: GameConfig; summary: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The AI did not return a game config");
  const parsed = JSON.parse(text.slice(start, end + 1));
  return {
    config: sanitizeConfig(parsed.config ?? parsed),
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "Updated your game.",
  };
}

export const generate = internalAction({
  args: { gameId: v.id("games"), prompt: v.string() },
  returns: v.null(),
  handler: async (ctx, { gameId, prompt }) => {
    try {
      const loaded = await ctx.runQuery(internal.games.loadForGeneration, { gameId });
      if (loaded === null) return null;
      const request = loaded.config
        ? `Current game config:\n${JSON.stringify(loaded.config)}\n\nChange request: ${prompt}\n\nApply the change and keep everything else the same. Only switch template if the request clearly asks for a different kind of game.`
        : `Game idea: ${prompt}\n\nPick the template that fits best and design the full config.`;
      await ctx.runMutation(internal.games.setStage, { gameId, stage: loaded.config ? "Applying your change" : "Designing your game" });
      const { config, summary } = parseReply(
        await complete([
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: request },
        ]),
      );
      await ctx.runMutation(internal.games.saveVersion, { gameId, config, prompt, summary });
    } catch (error) {
      await ctx.runMutation(internal.games.setStage, {
        gameId,
        stage: "Failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  },
});
