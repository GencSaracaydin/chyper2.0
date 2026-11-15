import { SDK_SOURCE } from "../convex/gameSdk";

export function buildGameHtml(code: string, assetBase: string): string {
  const safeCode = code.replace(/<\/script/gi, "<\\/script");
  const csp = `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src ${assetBase}; media-src ${assetBase}`;
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    "<style>html,body{margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}canvas{display:block}</style>",
    '</head><body><canvas id="c"></canvas>',
    "<script>window.ASSET_BASE = " + JSON.stringify(assetBase) + ";" + SDK_SOURCE + "</script>",
    "<script>\n" + safeCode + "\n</script>",
    "</body></html>",
  ].join("");
}
