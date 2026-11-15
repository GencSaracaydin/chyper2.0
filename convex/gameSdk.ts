export const SDK_SOURCE = String.raw`
(function () {
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var SHAPES = { circle: 1, square: 1, triangle: 1, diamond: 1, star: 1, heart: 1 };
  var ASSET_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  var IMAGES = {}, SOUNDS = {};
  function assetUrl(key) { return (window.ASSET_BASE || "") + "/asset/" + key; }
  function image(key) {
    if (!IMAGES[key]) { IMAGES[key] = new Image(); IMAGES[key].crossOrigin = "anonymous"; IMAGES[key].src = assetUrl(key); }
    return IMAGES[key];
  }
  function sound(key) {
    if (!SOUNDS[key]) { SOUNDS[key] = new Audio(assetUrl(key)); SOUNDS[key].preload = "auto"; }
    return SOUNDS[key];
  }
  function post(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage(s, "*");
  }
  window.onerror = function (message, source, line) {
    post({ type: "error", message: String(message) + (line ? " (line " + line + ")" : "") });
  };
  var G = {
    ctx: ctx, W: 0, H: 0, unit: 0, score: 0, time: 0,
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    circleHit: function (ax, ay, ar, bx, by, br) { var dx = ax - bx, dy = ay - by, r = ar + br; return dx * dx + dy * dy < r * r; },
    rectHit: function (ax, ay, aw, ah, bx, by, bw, bh) { return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; },
    circleRectHit: function (cx, cy, r, x, y, w, h) { var nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h)); var dx = cx - nx, dy = cy - ny; return dx * dx + dy * dy < r * r; },
    sprite: function (name, x, y, size, color, angle) {
      if (!name) return;
      ctx.save(); ctx.translate(x, y); if (angle) ctx.rotate(angle);
      if (!SHAPES[name] && ASSET_KEY.test(name)) {
        var img = image(name);
        if (img.complete && img.naturalWidth) {
          var k = size / Math.max(img.naturalWidth, img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        ctx.restore(); return;
      }
      if (!SHAPES[name]) {
        ctx.font = Math.round(size) + "px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(name, 0, size * 0.05);
        ctx.restore(); return;
      }
      var r = size / 2;
      ctx.fillStyle = color || "#ffffff";
      ctx.beginPath();
      if (name === "circle") ctx.arc(0, 0, r, 0, Math.PI * 2);
      else if (name === "square") ctx.rect(-r, -r, size, size);
      else if (name === "triangle") { ctx.moveTo(0, -r); ctx.lineTo(r, r); ctx.lineTo(-r, r); }
      else if (name === "diamond") { ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); }
      else if (name === "star") { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
      else if (name === "heart") { ctx.moveTo(0, r * 0.9); ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.5, -r * 1.1, 0, -r * 0.35); ctx.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.4, -r * 0.1, 0, r * 0.9); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    },
    sound: function (key, volume) {
      try {
        var base = sound(key), a = base.paused ? base : base.cloneNode();
        a.volume = volume == null ? 1 : volume; a.currentTime = 0;
        var played = a.play(); if (played && played.catch) played.catch(function () {});
      } catch (e) {}
    },
    load: function (keys) {
      for (var i = 0; i < keys.length; i++) { if (/^(sfx|music)-/.test(keys[i])) sound(keys[i]); else image(keys[i]); }
    },
    text: function (str, x, y, size, color, weight) {
      ctx.fillStyle = color || def.textColor;
      ctx.font = (weight || "700") + " " + Math.round(size) + "px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(str), x, y);
    },
    particles: [],
    burst: function (x, y, color, count) {
      for (var i = 0; i < (count || 12); i++) {
        var a = Math.random() * Math.PI * 2, s = G.unit * G.rand(0.3, 1.2);
        G.particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: G.rand(0.4, 0.8), color: color || "#ffffff" });
      }
    },
    shakeTime: 0,
    shake: function (seconds) { G.shakeTime = Math.max(G.shakeTime, seconds || 0.2); },
    end: function () { if (state === "playing") pendingEnd = true; },
    game: function (definition) { def = definition; }
  };
  window.G = G;
  var def = null, state = "ready", best = 0, overAt = 0, last = 0, pendingEnd = false, snapped = false;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    G.W = window.innerWidth; G.H = window.innerHeight; G.unit = Math.min(G.W, G.H * 0.6);
    canvas.width = G.W * dpr; canvas.height = G.H * dpr;
    canvas.style.width = G.W + "px"; canvas.style.height = G.H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function call(name, a, b) {
    try { if (def && def[name]) def[name](a, b); }
    catch (e) { post({ type: "error", message: (e && e.message) || String(e) }); state = "crashed"; }
  }

  function start() {
    G.score = 0; G.time = 0; G.particles = []; G.shakeTime = 0; pendingEnd = false;
    state = "playing";
    call("start");
    post({ type: "start" });
  }

  function point(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    var p = point(e);
    if (state === "playing") call("tap", p[0], p[1]);
    else if (state === "ready" || (state === "over" && performance.now() - overAt > 450)) start();
  });
  canvas.addEventListener("pointermove", function (e) { if (state === "playing" && e.buttons) { var p = point(e); call("drag", p[0], p[1]); } });
  canvas.addEventListener("pointerup", function (e) { if (state === "playing") { var p = point(e); call("release", p[0], p[1]); } });

  function frame(now) {
    var dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;
    if (!def) { requestAnimationFrame(frame); return; }
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    ctx.fillStyle = def.background || "#111111"; ctx.fillRect(0, 0, G.W, G.H);
    if (state === "playing") {
      G.time += dt;
      call("update", dt);
      for (var i = 0; i < G.particles.length; i++) { var p = G.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += G.unit * 1.5 * dt; p.life -= dt; }
      G.particles = G.particles.filter(function (q) { return q.life > 0; });
      G.shakeTime = Math.max(0, G.shakeTime - dt);
      if (pendingEnd) {
        pendingEnd = false; state = "over"; overAt = now;
        G.score = Math.floor(G.score); best = Math.max(best, G.score);
        post({ type: "over", score: G.score });
      }
    }
    ctx.save();
    if (G.shakeTime > 0) ctx.translate(G.rand(-1, 1) * G.unit * 0.02, G.rand(-1, 1) * G.unit * 0.02);
    if (state !== "ready") call("draw", ctx);
    for (var j = 0; j < G.particles.length; j++) { var q = G.particles[j]; ctx.globalAlpha = Math.max(0, q.life * 1.5); G.sprite("circle", q.x, q.y, G.unit * 0.02, q.color); }
    ctx.globalAlpha = 1;
    ctx.restore();
    var u = G.unit;
    if (state === "playing") G.text(Math.floor(G.score), G.W / 2, G.H * 0.1, u * 0.14);
    if (state === "ready") {
      G.sprite(def.icon || "star", G.W / 2, G.H * 0.3, u * 0.3, def.accent || "#ffffff");
      G.text(def.title || "Game", G.W / 2, G.H * 0.48, u * 0.12);
      G.text(def.startText || "Tap to start", G.W / 2, G.H * 0.58, u * 0.06, null, "500");
    }
    if (state === "over") {
      ctx.globalAlpha = 0.55; ctx.fillStyle = def.background || "#111111"; ctx.fillRect(0, 0, G.W, G.H); ctx.globalAlpha = 1;
      G.text(def.overText || "Game over", G.W / 2, G.H * 0.36, u * 0.1);
      G.text(G.score, G.W / 2, G.H * 0.48, u * 0.2);
      G.text("Best " + best, G.W / 2, G.H * 0.58, u * 0.06, null, "500");
      G.text("Tap to retry", G.W / 2, G.H * 0.66, u * 0.055, null, "500");
    }
    if (state === "crashed") G.text("This game crashed", G.W / 2, G.H * 0.5, u * 0.07, "#ff5c7a");
    if (state === "playing" && G.time > 1.5 && !snapped) {
      snapped = true;
      try {
        var shot = document.createElement("canvas");
        shot.width = 300; shot.height = Math.round(300 * G.H / G.W);
        shot.getContext("2d").drawImage(canvas, 0, 0, shot.width, shot.height);
        post({ type: "snapshot", image: shot.toDataURL("image/jpeg", 0.75) });
      } catch (e) {}
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener("DOMContentLoaded", function () { if (!def) post({ type: "error", message: "The game never called G.game({...})" }); else post({ type: "ready" }); });
})();
`;

export const SDK_DOCS = `The environment is a full-screen portrait HTML canvas on a phone. Your code runs after it, as plain browser JavaScript (no imports, no network, no DOM besides the canvas). Everything is on the global \`G\`.

Register exactly one game with \`G.game({...})\`:
- title, icon (library image key, emoji or shape shown on the start screen), background (CSS color), textColor, accent, startText, overText: plain strings (no templates; the score is shown for you)
- start(): reset ALL game state for a new run (called on every start/retry)
- update(dt): advance the game by dt seconds; call G.end() when the player loses
- draw(ctx): draw the world (the background is already cleared to \`background\`)
- tap(x, y): pointer down; drag(x, y): pointer moved while held; release(x, y): pointer up (all optional)

The environment draws the start screen, the live score HUD, the game-over screen with best score, and handles retry. Do not draw those yourself.

Helpers and state on G:
- G.W, G.H: canvas size in CSS pixels (can change on resize; read them every frame). G.unit = min(W, H*0.6): use it to size things so the game looks right on every phone.
- G.score: set or increment it; it is shown and reported. G.time: seconds since this run started.
- G.ctx: the 2D context (also passed to draw).
- G.sprite(name, x, y, size, color?, angle?): draws an asset centered at x,y, scaled so its longest side is size (aspect ratio kept). name is a library image key (see the asset library), any emoji (e.g. "🐸", "🚗", "⭐", "🔥"), or a shape: "circle", "square", "triangle", "diamond", "star", "heart" (shapes use color).
- G.sound(key, volume?): plays a library sound (keys start with "sfx-" or "music-"). Use short sounds for feedback: jump, coin, hit, game over.
- G.load([keys]): preload library images and sounds; call it once at the top level of your code with every key you use.
- G.text(str, x, y, size, color?, weight?)
- G.rand(a, b), G.randInt(a, b), G.pick(list), G.clamp(v, a, b), G.lerp(a, b, t)
- G.circleHit(ax, ay, ar, bx, by, br), G.rectHit(ax, ay, aw, ah, bx, by, bw, bh), G.circleRectHit(cx, cy, r, x, y, w, h)
- G.burst(x, y, color?, count?): particle explosion. G.shake(seconds?): screen shake.
- G.end(): finish the run (game over).`;
