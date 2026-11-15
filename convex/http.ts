import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  pathPrefix: "/asset/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const key = decodeURIComponent(new URL(request.url).pathname.slice("/asset/".length));
    const storageId = await ctx.runQuery(internal.assets.byKey, { key });
    const blob = storageId === null ? null : await ctx.storage.get(storageId);
    if (blob === null) return new Response("Unknown asset", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
    return new Response(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
