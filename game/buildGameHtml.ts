import { SDK_SOURCE } from "../convex/gameSdk";

export function buildGameHtml(code: string): string {
  const safeCode = code.replace(/<\/script/gi, "<\\/script");
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">',
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'">',
    "<style>html,body{margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}canvas{display:block}</style>",
    '</head><body><canvas id="c"></canvas>',
    "<script>" + SDK_SOURCE + "</script>",
    "<script>\n" + safeCode + "\n</script>",
    "</body></html>",
  ].join("");
}
