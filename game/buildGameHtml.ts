import type { GameConfig } from "../convex/gameConfig";

const RUNTIME = String.raw`
(function () {
  var C = window.__GAME_CONFIG__;
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1;
  var SHAPES = { circle: 1, square: 1, triangle: 1, diamond: 1, star: 1 };

  function resize() {
    DPR = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function post(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage(s, "*");
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function drawSprite(sprite, x, y, size, color) {
    if (!sprite) return;
    if (!SHAPES[sprite]) {
      ctx.font = Math.round(size) + "px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(sprite, x, y + size * 0.05);
      return;
    }
    var r = size / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (sprite === "circle") ctx.arc(x, y, r, 0, Math.PI * 2);
    else if (sprite === "square") ctx.rect(x - r, y - r, size, size);
    else if (sprite === "triangle") { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); }
    else if (sprite === "diamond") { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); }
    else if (sprite === "star") {
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
    }
    ctx.closePath(); ctx.fill();
  }

  function hit(ax, ay, ar, bx, by, br) {
    var dx = ax - bx, dy = ay - by, r = (ar + br) * 0.8;
    return dx * dx + dy * dy < r * r;
  }

  function rectHit(cx, cy, r, x, y, w, h) {
    var nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r * 0.7;
  }

  var unit = function () { return Math.min(W, H * 0.6); };

  var games = {};

  games.flappy = function () {
    var p = { x: W * 0.3, y: H * 0.45, vy: 0, r: unit() * 0.06 * C.size };
    var pillars = [], timer = 0, t = 0, score = 0;
    return {
      tap: function () { p.vy = -H * 0.95 * C.jump; },
      update: function (dt) {
        t += dt;
        var speed = W * 0.38 * C.speed * (1 + t * 0.02 * C.ramp);
        p.vy += H * 2.6 * C.gravity * dt; p.y += p.vy * dt;
        timer -= dt;
        if (timer <= 0) {
          timer = 1.6 / C.spawnRate;
          var gap = H * 0.27 * C.gap;
          pillars.push({ x: W + 40, top: rand(H * 0.12, H * 0.88 - gap), gap: gap, w: unit() * 0.16, passed: false });
        }
        for (var i = 0; i < pillars.length; i++) {
          var q = pillars[i]; q.x -= speed * dt;
          if (!q.passed && q.x + q.w < p.x) { q.passed = true; score++; }
          if (rectHit(p.x, p.y, p.r, q.x, 0, q.w, q.top) || rectHit(p.x, p.y, p.r, q.x, q.top + q.gap, q.w, H)) return false;
        }
        pillars = pillars.filter(function (q) { return q.x > -q.w; });
        if (p.y > H - p.r || p.y < -p.r * 4) return false;
        return true;
      },
      draw: function () {
        for (var i = 0; i < pillars.length; i++) {
          var q = pillars[i];
          ctx.fillStyle = C.colors.obstacle;
          ctx.fillRect(q.x, 0, q.w, q.top);
          ctx.fillRect(q.x, q.top + q.gap, q.w, H);
          if (C.obstacle !== "square") {
            drawSprite(C.obstacle, q.x + q.w / 2, q.top - q.w / 2, q.w * 0.9, C.colors.accent);
            drawSprite(C.obstacle, q.x + q.w / 2, q.top + q.gap + q.w / 2, q.w * 0.9, C.colors.accent);
          }
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.max(-0.5, Math.min(1, p.vy / H)));
        drawSprite(C.player, 0, 0, p.r * 2.2, C.colors.accent); ctx.restore();
      },
      score: function () { return score; }
    };
  };

  games.runner = function () {
    var ground = H * 0.72;
    var p = { x: W * 0.22, r: unit() * 0.065 * C.size, y: 0, vy: 0 };
    p.y = ground - p.r;
    var things = [], timer = 0.8, t = 0, dist = 0, bonus = 0;
    return {
      tap: function () { if (p.y >= ground - p.r - 1) p.vy = -H * 1.15 * C.jump; },
      update: function (dt) {
        t += dt;
        var speed = W * 0.55 * C.speed * (1 + t * 0.03 * C.ramp);
        dist += speed * dt;
        p.vy += H * 3.2 * C.gravity * dt; p.y += p.vy * dt;
        if (p.y > ground - p.r) { p.y = ground - p.r; p.vy = 0; }
        timer -= dt;
        if (timer <= 0) {
          timer = rand(0.9, 1.8) / C.spawnRate;
          var s = unit() * rand(0.09, 0.14);
          things.push({ kind: "obstacle", x: W + s, y: ground - s / 2, r: s / 2 });
          if (C.collectible && Math.random() < 0.6) things.push({ kind: "coin", x: W + s + rand(W * 0.2, W * 0.4), y: ground - rand(H * 0.12, H * 0.25), r: unit() * 0.045 });
        }
        for (var i = 0; i < things.length; i++) {
          var o = things[i]; o.x -= speed * dt;
          if (hit(p.x, p.y, p.r, o.x, o.y, o.r)) {
            if (o.kind === "obstacle") return false;
            o.dead = true; bonus += 5;
          }
        }
        things = things.filter(function (o) { return !o.dead && o.x > -o.r * 2; });
        return true;
      },
      draw: function () {
        ctx.fillStyle = C.colors.obstacle; ctx.globalAlpha = 0.25;
        ctx.fillRect(0, ground, W, H - ground); ctx.globalAlpha = 1;
        for (var i = 0; i < things.length; i++) {
          var o = things[i];
          drawSprite(o.kind === "obstacle" ? C.obstacle : C.collectible, o.x, o.y, o.r * 2.2, o.kind === "obstacle" ? C.colors.obstacle : C.colors.accent);
        }
        drawSprite(C.player, p.x, p.y, p.r * 2.2, C.colors.accent);
      },
      score: function () { return Math.floor(dist / unit()) + bonus; }
    };
  };

  games.dodger = function () {
    var p = { x: W / 2, y: H * 0.85, r: unit() * 0.06 * C.size, dir: 1 };
    var things = [], timer = 0, t = 0, bonus = 0;
    return {
      tap: function () { p.dir = -p.dir; },
      update: function (dt) {
        t += dt;
        var k = 1 + t * 0.04 * C.ramp;
        p.x += p.dir * W * 0.6 * C.speed * dt;
        if (p.x < p.r) { p.x = p.r; p.dir = 1; }
        if (p.x > W - p.r) { p.x = W - p.r; p.dir = -1; }
        timer -= dt;
        if (timer <= 0) {
          timer = 0.55 / (C.spawnRate * Math.sqrt(k));
          var coin = C.collectible && Math.random() < 0.18;
          var r = unit() * (coin ? 0.045 : rand(0.045, 0.08));
          things.push({ kind: coin ? "coin" : "obstacle", x: rand(r, W - r), y: -r, r: r, vy: H * rand(0.3, 0.5) * C.speed * k });
        }
        for (var i = 0; i < things.length; i++) {
          var o = things[i]; o.y += o.vy * dt;
          if (hit(p.x, p.y, p.r, o.x, o.y, o.r)) {
            if (o.kind === "obstacle") return false;
            o.dead = true; bonus += 5;
          }
        }
        things = things.filter(function (o) { return !o.dead && o.y < H + o.r; });
        return true;
      },
      draw: function () {
        for (var i = 0; i < things.length; i++) {
          var o = things[i];
          drawSprite(o.kind === "obstacle" ? C.obstacle : C.collectible, o.x, o.y, o.r * 2.2, o.kind === "obstacle" ? C.colors.obstacle : C.colors.accent);
        }
        drawSprite(C.player, p.x, p.y, p.r * 2.2, C.colors.accent);
      },
      score: function () { return Math.floor(t) + bonus; }
    };
  };

  games.stacker = function () {
    var bh = unit() * 0.07 * C.size;
    var startW = W * 0.5 * C.gap;
    var tower = [{ x: (W - startW) / 2, w: startW }];
    var cur = { x: 0, w: startW, dir: 1 };
    var cam = 0, falling = [];
    function speed() { return W * 0.5 * C.speed * (1 + tower.length * 0.04 * C.ramp); }
    function rowY(i) { return H * 0.8 - i * bh + cam; }
    return {
      tap: function () {
        var top = tower[tower.length - 1];
        var left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w);
        if (right - left <= 2) { cur.dead = true; return; }
        if (cur.x < left) falling.push({ x: cur.x, w: left - cur.x, y: rowY(tower.length), vy: 0 });
        if (cur.x + cur.w > right) falling.push({ x: right, w: cur.x + cur.w - right, y: rowY(tower.length), vy: 0 });
        tower.push({ x: left, w: right - left });
        cur = { x: tower.length % 2 ? -right + left : W, w: right - left, dir: tower.length % 2 ? 1 : -1 };
      },
      update: function (dt) {
        if (cur.dead) return false;
        cur.x += cur.dir * speed() * dt;
        if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; }
        if (cur.x < 0) { cur.x = 0; cur.dir = 1; }
        var target = Math.max(0, (tower.length - 6) * bh);
        cam += (target - cam) * Math.min(1, dt * 6);
        for (var i = 0; i < falling.length; i++) { falling[i].vy += H * 2 * dt; falling[i].y += falling[i].vy * dt; }
        falling = falling.filter(function (f) { return f.y < H + 50; });
        return true;
      },
      draw: function () {
        function hue(i) { return i % 2 ? C.colors.accent : C.colors.obstacle; }
        for (var i = 0; i < tower.length; i++) {
          ctx.fillStyle = hue(i); ctx.fillRect(tower[i].x, rowY(i), tower[i].w, bh - 2);
        }
        for (var j = 0; j < falling.length; j++) {
          ctx.globalAlpha = 0.6; ctx.fillStyle = C.colors.obstacle;
          ctx.fillRect(falling[j].x, falling[j].y, falling[j].w, bh - 2); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = hue(tower.length); ctx.fillRect(cur.x, rowY(tower.length), cur.w, bh - 2);
        if (C.player !== "square") drawSprite(C.player, cur.x + cur.w / 2, rowY(tower.length) + bh / 2, bh * 0.9, C.colors.text);
      },
      score: function () { return tower.length - 1; }
    };
  };

  games.timing = function () {
    var cx = W / 2, cy = H * 0.48, R = unit() * 0.32;
    var angle = -Math.PI / 2, zone = 0, width = 0.9 * C.gap, score = 0, missed = false, flash = 0, wasIn = false;
    function newZone() { zone = angle + rand(Math.PI * 0.6, Math.PI * 1.6); }
    newZone();
    function norm(a) { a = a % (Math.PI * 2); return a < 0 ? a + Math.PI * 2 : a; }
    return {
      tap: function () {
        var d = Math.abs(norm(angle - zone + Math.PI) - Math.PI);
        if (d <= width / 2) {
          score++; flash = 0.15;
          width = Math.max(0.18, width * (1 - 0.05 * C.ramp));
          newZone();
          wasIn = false;
        } else missed = true;
      },
      update: function (dt) {
        if (missed) return false;
        flash = Math.max(0, flash - dt);
        angle += (2.2 + score * 0.12 * C.ramp) * C.speed * dt;
        var diff = norm(angle - zone + Math.PI) - Math.PI;
        if (wasIn && diff > width / 2) missed = true;
        wasIn = Math.abs(diff) <= width / 2;
        return true;
      },
      draw: function () {
        ctx.lineWidth = unit() * 0.06 * C.size; ctx.lineCap = "round";
        ctx.strokeStyle = C.colors.obstacle; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.colors.accent; ctx.beginPath(); ctx.arc(cx, cy, R, zone - width / 2, zone + width / 2); ctx.stroke();
        drawSprite(C.player, cx + Math.cos(angle) * R, cy + Math.sin(angle) * R, unit() * 0.1 * C.size, C.colors.text);
        if (flash > 0) { ctx.globalAlpha = flash * 3; drawSprite(C.collectible || "star", cx, cy, R * 0.6, C.colors.accent); ctx.globalAlpha = 1; }
      },
      score: function () { return score; }
    };
  };

  var state = "ready", game = null, last = 0, best = 0, lastScore = 0;

  function start() {
    game = games[C.template]();
    state = "playing";
    post({ type: "start" });
  }

  function onTap(e) {
    if (e) e.preventDefault();
    if (state === "playing") game.tap();
    else if (state === "ready" || performance.now() - overAt > 400) start();
  }
  var overAt = 0;
  canvas.addEventListener("pointerdown", onTap);

  function text(str, y, size, weight) {
    ctx.fillStyle = C.colors.text;
    ctx.font = (weight || "700") + " " + Math.round(size) + "px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(str, W / 2, y);
  }

  function frame(now) {
    var dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;
    ctx.fillStyle = C.colors.background; ctx.fillRect(0, 0, W, H);
    if (state === "playing") {
      if (!game.update(dt)) {
        state = "over"; overAt = now; lastScore = game.score();
        best = Math.max(best, lastScore);
        post({ type: "over", score: lastScore });
      }
    }
    if (game) game.draw();
    var u = unit();
    if (state === "playing") text(String(game.score()), H * 0.1, u * 0.14);
    if (state === "ready") {
      drawSprite(C.player, W / 2, H * 0.3, u * 0.3, C.colors.accent);
      text(C.title, H * 0.48, u * 0.12);
      text(C.startText, H * 0.58, u * 0.06, "500");
    }
    if (state === "over") {
      ctx.globalAlpha = 0.55; ctx.fillStyle = C.colors.background; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      text(C.overText, H * 0.36, u * 0.1);
      text(String(lastScore), H * 0.48, u * 0.2);
      text("Best " + best, H * 0.58, u * 0.06, "500");
      text("Tap to retry", H * 0.66, u * 0.055, "500");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  post({ type: "ready" });
})();
`;

export function buildGameHtml(config: GameConfig): string {
  const json = JSON.stringify(config).replace(/</g, "\u003c");
  return [
    "<!doctype html><html><head><meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">",
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'\">",
    "<style>html,body{margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}canvas{display:block}</style>",
    "</head><body><canvas id=\"c\"></canvas><script>window.__GAME_CONFIG__=" + json + ";" + RUNTIME + "</script></body></html>",
  ].join("");
}
