export const STARTER_GAMES: { title: string; code: string }[] = [
  {
    title: "Cucumber Panic",
    code: String.raw`// Dodger: tap to reverse direction and dodge falling cucumbers. Fish are bonus points.
var cat, things, spawnTimer;

G.game({
  title: "Cucumber Panic",
  icon: "🐱",
  background: "#0D1B2A",
  textColor: "#FFFFFF",
  accent: "#FFD166",
  start: function () {
    cat = { x: G.W / 2, y: G.H * 0.85, r: G.unit * 0.06, dir: 1 };
    things = [];
    spawnTimer = 0;
  },
  tap: function () {
    cat.dir = -cat.dir;
  },
  update: function (dt) {
    var difficulty = 1 + G.time * 0.04;
    G.score += dt;
    cat.x += cat.dir * G.W * 0.6 * dt;
    if (cat.x < cat.r) { cat.x = cat.r; cat.dir = 1; }
    if (cat.x > G.W - cat.r) { cat.x = G.W - cat.r; cat.dir = -1; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 0.55 / Math.sqrt(difficulty);
      var fish = Math.random() < 0.18;
      var r = G.unit * (fish ? 0.045 : G.rand(0.045, 0.08));
      things.push({ fish: fish, x: G.rand(r, G.W - r), y: -r, r: r, vy: G.H * G.rand(0.3, 0.5) * difficulty });
    }
    for (var i = 0; i < things.length; i++) {
      var t = things[i];
      t.y += t.vy * dt;
      if (G.circleHit(cat.x, cat.y, cat.r * 0.8, t.x, t.y, t.r * 0.8)) {
        if (!t.fish) { G.burst(cat.x, cat.y, "#7BC67B", 20); G.shake(0.3); G.end(); return; }
        t.dead = true;
        G.score += 5;
        G.burst(t.x, t.y, "#4FC3F7", 10);
      }
    }
    things = things.filter(function (t) { return !t.dead && t.y < G.H + t.r; });
  },
  draw: function () {
    for (var i = 0; i < things.length; i++) {
      var t = things[i];
      G.sprite(t.fish ? "🐟" : "🥒", t.x, t.y, t.r * 2.2);
    }
    G.sprite("🐱", cat.x, cat.y, cat.r * 2.2);
  }
});
`,
  },
  {
    title: "Rocket Flap",
    code: String.raw`// Flappy: tap to thrust up through gaps between space pillars.
var rocket, pillars, spawnTimer;

G.game({
  title: "Rocket Flap",
  icon: "🚀",
  background: "#0B0B2B",
  textColor: "#FFFFFF",
  accent: "#FFD166",
  start: function () {
    rocket = { x: G.W * 0.3, y: G.H * 0.45, vy: 0, r: G.unit * 0.06 };
    pillars = [];
    spawnTimer = 0;
  },
  tap: function () {
    rocket.vy = -G.H * 0.95;
    G.burst(rocket.x - rocket.r, rocket.y + rocket.r * 0.5, "#FF9F1C", 4);
  },
  update: function (dt) {
    var speed = G.W * 0.38 * (1 + G.time * 0.02);
    rocket.vy += G.H * 2.6 * dt;
    rocket.y += rocket.vy * dt;
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 1.6;
      var gap = G.H * 0.27;
      pillars.push({ x: G.W + 40, top: G.rand(G.H * 0.12, G.H * 0.88 - gap), gap: gap, w: G.unit * 0.16, passed: false });
    }
    for (var i = 0; i < pillars.length; i++) {
      var p = pillars[i];
      p.x -= speed * dt;
      if (!p.passed && p.x + p.w < rocket.x) { p.passed = true; G.score += 1; }
      if (G.circleRectHit(rocket.x, rocket.y, rocket.r * 0.8, p.x, 0, p.w, p.top) ||
          G.circleRectHit(rocket.x, rocket.y, rocket.r * 0.8, p.x, p.top + p.gap, p.w, G.H)) {
        G.burst(rocket.x, rocket.y, "#FF6B35", 24); G.shake(0.3); G.end(); return;
      }
    }
    pillars = pillars.filter(function (p) { return p.x > -p.w; });
    if (rocket.y > G.H - rocket.r || rocket.y < -rocket.r * 4) { G.burst(rocket.x, rocket.y, "#FF6B35", 24); G.end(); }
  },
  draw: function (ctx) {
    ctx.fillStyle = "#6C63FF";
    for (var i = 0; i < pillars.length; i++) {
      var p = pillars[i];
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.top + p.gap, p.w, G.H);
    }
    G.sprite("🚀", rocket.x, rocket.y, rocket.r * 2.2, null, Math.PI / 4 + G.clamp(rocket.vy / G.H, -0.5, 1));
  }
});
`,
  },
  {
    title: "Pancake Tower",
    code: String.raw`// Stacker: tap to drop the sliding pancake. Overhang gets sliced off; miss and it's over.
var tower, current, camera, falling, blockH;

function rowY(i) { return G.H * 0.8 - i * blockH + camera; }

G.game({
  title: "Pancake Tower",
  icon: "🥞",
  background: "#FFF3D6",
  textColor: "#5A3A12",
  accent: "#E9A23B",
  start: function () {
    blockH = G.unit * 0.07;
    var w = G.W * 0.5;
    tower = [{ x: (G.W - w) / 2, w: w }];
    current = { x: 0, w: w, dir: 1 };
    camera = 0;
    falling = [];
  },
  tap: function () {
    var top = tower[tower.length - 1];
    var left = Math.max(current.x, top.x), right = Math.min(current.x + current.w, top.x + top.w);
    if (right - left <= 2) { G.shake(0.3); G.end(); return; }
    if (current.x < left) falling.push({ x: current.x, w: left - current.x, y: rowY(tower.length), vy: 0 });
    if (current.x + current.w > right) falling.push({ x: right, w: current.x + current.w - right, y: rowY(tower.length), vy: 0 });
    tower.push({ x: left, w: right - left });
    G.score = tower.length - 1;
    G.burst((left + right) / 2, rowY(tower.length - 1), "#E9A23B", 8);
    var fromLeft = tower.length % 2 === 1;
    current = { x: fromLeft ? 0 : G.W - (right - left), w: right - left, dir: fromLeft ? 1 : -1 };
  },
  update: function (dt) {
    var speed = G.W * 0.5 * (1 + tower.length * 0.04);
    current.x += current.dir * speed * dt;
    if (current.x + current.w > G.W) { current.x = G.W - current.w; current.dir = -1; }
    if (current.x < 0) { current.x = 0; current.dir = 1; }
    var target = Math.max(0, (tower.length - 6) * blockH);
    camera += (target - camera) * Math.min(1, dt * 6);
    for (var i = 0; i < falling.length; i++) { falling[i].vy += G.H * 2 * dt; falling[i].y += falling[i].vy * dt; }
    falling = falling.filter(function (f) { return f.y < G.H + 50; });
  },
  draw: function (ctx) {
    function layer(x, y, w, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, blockH - 3, blockH * 0.4);
      ctx.fill();
    }
    for (var i = 0; i < tower.length; i++) layer(tower[i].x, rowY(i), tower[i].w, i % 2 ? "#E9A23B" : "#C9772B");
    ctx.globalAlpha = 0.6;
    for (var j = 0; j < falling.length; j++) layer(falling[j].x, falling[j].y, falling[j].w, "#C9772B");
    ctx.globalAlpha = 1;
    layer(current.x, rowY(tower.length), current.w, tower.length % 2 ? "#E9A23B" : "#C9772B");
  }
});
`,
  },
  {
    title: "Lava Ninja",
    code: String.raw`// Runner: tap to jump over lava rocks, grab flames for bonus points.
var ninja, things, spawnTimer, ground, distance;

G.game({
  title: "Lava Ninja",
  icon: "🥷",
  background: "#2B0F0F",
  textColor: "#FFFFFF",
  accent: "#FF6B35",
  start: function () {
    ground = G.H * 0.72;
    ninja = { x: G.W * 0.22, r: G.unit * 0.065, y: 0, vy: 0 };
    ninja.y = ground - ninja.r;
    things = [];
    spawnTimer = 0.8;
    distance = 0;
  },
  tap: function () {
    if (ninja.y >= ground - ninja.r - 1) ninja.vy = -G.H * 1.15;
  },
  update: function (dt) {
    var speed = G.W * 0.66 * (1 + G.time * 0.03);
    distance += speed * dt;
    G.score += speed * dt / G.unit;
    ninja.vy += G.H * 3.2 * dt;
    ninja.y += ninja.vy * dt;
    if (ninja.y > ground - ninja.r) { ninja.y = ground - ninja.r; ninja.vy = 0; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = G.rand(0.9, 1.8);
      var s = G.unit * G.rand(0.09, 0.14);
      things.push({ rock: true, x: G.W + s, y: ground - s / 2, r: s / 2 });
      if (Math.random() < 0.6) things.push({ rock: false, x: G.W + s + G.rand(G.W * 0.2, G.W * 0.4), y: ground - G.rand(G.H * 0.12, G.H * 0.25), r: G.unit * 0.045 });
    }
    for (var i = 0; i < things.length; i++) {
      var t = things[i];
      t.x -= speed * dt;
      if (G.circleHit(ninja.x, ninja.y, ninja.r * 0.8, t.x, t.y, t.r * 0.8)) {
        if (t.rock) { G.burst(ninja.x, ninja.y, "#FF3B1F", 24); G.shake(0.3); G.end(); return; }
        t.dead = true; G.score += 5; G.burst(t.x, t.y, "#FFD166", 10);
      }
    }
    things = things.filter(function (t) { return !t.dead && t.x > -t.r * 2; });
  },
  draw: function (ctx) {
    ctx.fillStyle = "#FF3B1F";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, ground, G.W, G.H - ground);
    ctx.globalAlpha = 1;
    for (var i = 0; i < things.length; i++) G.sprite(things[i].rock ? "🪨" : "🔥", things[i].x, things[i].y, things[i].r * 2.2);
    G.sprite("🥷", ninja.x, ninja.y, ninja.r * 2.2);
  }
});
`,
  },
  {
    title: "Bullseye",
    code: String.raw`// Timing tap: tap when the dart is inside the green zone. Each hit shrinks the zone and speeds it up.
var angle, zone, width, wasInside, flash, cx, cy, radius;

function norm(a) { a = a % (Math.PI * 2); return a < 0 ? a + Math.PI * 2 : a; }
function offset() { return norm(angle - zone + Math.PI) - Math.PI; }
function newZone() { zone = angle + G.rand(Math.PI * 0.6, Math.PI * 1.6); wasInside = false; }

G.game({
  title: "Bullseye",
  icon: "🎯",
  background: "#111111",
  textColor: "#FFFFFF",
  accent: "#00E5A0",
  start: function () {
    angle = -Math.PI / 2;
    width = 0.9;
    flash = 0;
    newZone();
  },
  tap: function () {
    if (Math.abs(offset()) <= width / 2) {
      G.score += 1;
      flash = 0.2;
      G.burst(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, "#00E5A0", 14);
      width = Math.max(0.18, width * 0.95);
      newZone();
    } else {
      G.shake(0.3);
      G.end();
    }
  },
  update: function (dt) {
    cx = G.W / 2; cy = G.H * 0.48; radius = G.unit * 0.32;
    flash = Math.max(0, flash - dt);
    angle += (2.2 + G.score * 0.12) * dt;
    var d = offset();
    if (wasInside && d > width / 2) { G.shake(0.3); G.end(); return; }
    wasInside = Math.abs(d) <= width / 2;
  },
  draw: function (ctx) {
    ctx.lineWidth = G.unit * 0.06;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#333333";
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#00E5A0";
    ctx.beginPath(); ctx.arc(cx, cy, radius, zone - width / 2, zone + width / 2); ctx.stroke();
    G.sprite("🎯", cx, cy, radius * (0.8 + flash));
    G.sprite("circle", cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, G.unit * 0.1, "#FFFFFF");
  }
});
`,
  },
];
