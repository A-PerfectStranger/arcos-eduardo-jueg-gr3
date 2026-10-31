import {
  WORLD,
  Astronaut,
  trainingLevel,
  generateCampaign,
  newSeed,
  zoneFor,
  formatTime,
  readBest,
  writeBest,
  campaignBestKey,
  readUnlock,
  writeUnlock,
} from "./model.js";
import { makeSprites, showSprite } from "./sprites.js";
const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const input = { left: false, right: false, jump: false };
let scene,
  audio,
  soundOn = false,
  unlocked = false;
try {
  unlocked = readUnlock(localStorage);
} catch {}
const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
function tone(freq, length = 0.07, type = "sine") {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.7,
      audio.currentTime + length,
    );
    g.gain.setValueAtTime(0.025, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + length);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + length);
  } catch {}
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").classList.remove("show"), 4200);
}
function clearInput() {
  Object.keys(input).forEach((k) => (input[k] = false));
  scene?.held?.clear();
  scene?.pilot?.cancelCharge();
  document
    .querySelectorAll("[data-touch]")
    .forEach((b) => b.classList.remove("held"));
}
function showModal(title, copy, primary, action, secondary, other) {
  clearInput();
  $("overlay").hidden = false;
  $("modal-title").textContent = title;
  $("modal-copy").textContent = copy;
  $("primary").textContent = primary;
  $("primary").onclick = action;
  $("secondary").hidden = !secondary;
  $("secondary").textContent = secondary || "";
  $("secondary").onclick = other;
  $("mission-options").hidden = true;
  $("training-choice").hidden = true;
  $("menu-choice").hidden = true;
  requestAnimationFrame(() => $("primary").focus({ preventScroll: true }));
}
const viewportHeight = () =>
  Math.round((WORLD.width * $("game").clientHeight) / $("game").clientWidth);
class Moonbound extends Phaser.Scene {
  constructor() {
    super("Moonbound");
  }
  preload() {
    this.load.image("astronaut-art", "./assets/astronaut-concepts.png");
  }
  create() {
    scene = this;
    this.state = "ready";
    this.held = new Set();
    this.accumulator = 0;
    this.facing = 1;
    this.zone = -1;
    this.highestZone = 0;
    makeSprites(this);
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-30);
    this.decor = this.add.graphics().setScrollFactor(0.18).setDepth(-20);
    this.terrain = this.add.graphics().setDepth(-2);
    this.fx = this.add.graphics().setDepth(1);
    this.player = this.add
      .sprite(120, 3240, "astronaut-art", "idle")
      .setOrigin(0.5, 1)
      .setDepth(4);
    this.beloved = this.add
      .sprite(0, 0, "astronaut-art", "beloved")
      .setOrigin(0.5, 1)
      .setFlipX(false)
      .setDepth(3);
    this.loadLevel(trainingLevel());
    this.bindControls();
    this.resizeView();
    const observer = new ResizeObserver(() => this.resizeView());
    observer.observe($("game"));
    this.events.once("shutdown", () => observer.disconnect());
    this.saved = this.readSaved();
    this.menu();
    if (new URLSearchParams(location.search).has("qa"))
      window.__CIMA__ = {
        game: this.game,
        scene: this,
        input,
        WORLD,
        get level() {
          return scene.level;
        },
        Astronaut,
        generateCampaign,
      };
  }
  loadLevel(level) {
    this.level = level;
    this.pilot = new Astronaut(level);
    this.goal = level.goal;
    this.zone = -1;
    this.highestZone = 0;
    this.facing = 1;
    this.accumulator = 0;
    this.saveClock = 0;
    this.landUntil = 0;
    this.bestKey =
      level.kind === "training"
        ? "cima.training.best.v2"
        : campaignBestKey(level.seed);
    this.best = null;
    try {
      this.best = readBest(localStorage, this.bestKey);
    } catch {}
    this.paintTerrain();
    this.paintSky(0);
    this.beloved
      .setVisible(level.kind === "campaign")
      .setPosition(this.goal.x, this.goal.y);
    showSprite(this.beloved, "beloved");
    this.player.setPosition(this.pilot.x, this.pilot.y).setFlipX(false);
    showSprite(this.player, "idle");
    this.cameras.main.setBounds(0, 0, 800, level.ground + this.bottomReserve());
    this.resetCamera();
    this.renderUI();
  }
  menu() {
    this.state = "ready";
    $("pause").disabled = true;
    showModal(
      "Hasta la Luna",
      "Ella te espera al otro lado de las estrellas. Aprende a saltar. Después, emprende un viaje que solo tú puedes completar.",
      this.saved ? "Continuar viaje" : "Entrenar",
      () => (this.saved ? this.continueSaved() : this.startRun("training")),
      unlocked ? "Nueva expedición" : null,
      () => this.startCampaign(),
    );
    $("mission-options").hidden = false;
    $("seed").value = this.saved?.kind === "campaign" ? this.saved.seed : "";
    $("seed").disabled = !unlocked;
    $("training-choice").hidden = !unlocked;
    $("training-choice").onclick = () => this.startRun("training");
    $("unlock-note").textContent = unlocked
      ? "Sin checkpoints · Un mundo por semilla"
      : "Completa el entrenamiento para abrir la expedición.";
  }
  startRun(kind = this.level.kind, seed) {
    clearInput();
    clearTimeout(toast.timer);
    $("toast").classList.remove("show");
    if (kind === "campaign" && !unlocked && this.state !== "training-complete")
      return;
    let level;
    try {
      level =
        kind === "campaign"
          ? generateCampaign(seed || newSeed())
          : trainingLevel();
    } catch (error) {
      console.error(error);
      toast("No se pudo generar la expedición. Prueba otra semilla.");
      return;
    }
    this.loadLevel(level);
    this.state = "playing";
    this.highestZone = 0;
    this.newRecord = false;
    this.saved = null;
    store.remove("cima.run.v2");
    $("overlay").hidden = true;
    $("pause").disabled = false;
    $("pause").textContent = "Pausa";
    $("primary").blur();
    $("mission-status").textContent =
      kind === "training"
        ? "ENTRENAMIENTO · 25 SALTOS"
        : "EXPEDICIÓN · " + level.seed;
    toast(
      kind === "training"
        ? "← → / A D: dirección · Mantén ESPACIO y suelta para saltar"
        : "«Guardé un sitio para ti en la Luna.» — L",
    );
    tone(440, 0.12);
    this.saveRun();
  }
  startCampaign() {
    this.startRun("campaign", $("seed").value.trim() || undefined);
  }
  pauseRun() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.saveRun();
    this.accumulator = 0;
    showModal(
      "Un respiro",
      this.level.kind === "training"
        ? "Estás entrenando para llegar a la Luna."
        : `Semilla ${this.level.seed} · ${this.level.zones[this.zone].hint}`,
      "Continuar",
      () => this.resume(),
      "Volver al inicio",
      () => this.confirmReset(),
    );
    $("pause").textContent = "Seguir";
    $("menu-choice").hidden = false;
    $("menu-choice").onclick = () => {
      this.saved = this.readSaved();
      $("menu-choice").hidden = true;
      this.menu();
    };
  }
  resume() {
    if (this.state !== "paused") return;
    clearInput();
    this.state = "playing";
    this.accumulator = 0;
    $("overlay").hidden = true;
    $("menu-choice").hidden = true;
    $("primary").blur();
    $("pause").textContent = "Pausa";
  }
  confirmReset() {
    this.state = "paused";
    $("menu-choice").hidden = true;
    showModal(
      "¿Volver a empezar?",
      this.level.kind === "campaign"
        ? "Se perderá este ascenso y se generará una semilla nueva."
        : "El entrenamiento volverá al primer salto.",
      "Reiniciar",
      () => this.startRun(this.level.kind),
      "Cancelar",
      () => this.resume(),
    );
  }
  complete() {
    if (this.state !== "playing") return;
    this.newRecord = !this.best || this.pilot.elapsed < this.best;
    if (this.newRecord) {
      this.best = this.pilot.elapsed;
      try {
        writeBest(localStorage, this.best, this.bestKey);
      } catch {}
    }
    this.renderUI();
    store.remove("cima.run.v2");
    tone(880, 0.4, "triangle");
    const stats = `${formatTime(this.pilot.elapsed)} · ${this.pilot.jumps} saltos · ${this.pilot.falls} caídas`;
    if (this.level.kind === "training") {
      unlocked = true;
      try {
        writeUnlock(localStorage);
      } catch {}
      this.state = "training-complete";
      showModal(
        "Listo para las estrellas",
        `Entrenamiento completado. ${stats}. Tu viaje empieza ahora.`,
        "Partir hacia la Luna",
        () => this.startRun("campaign"),
        "Repetir entrenamiento",
        () => this.startRun("training"),
      );
    } else {
      this.state = "won";
      this.player.setPosition(this.goal.x - 14, this.goal.y);
      this.beloved.setX(this.goal.x + 14);
      showModal(
        "Por fin, contigo",
        "«Miraba la Tierra cada noche, esperando tu luz.»\n" +
          stats +
          (this.newRecord ? " · Récord de esta semilla" : ""),
        "Otra expedición",
        () => this.startRun("campaign"),
        "Volver al entrenamiento",
        () => this.startRun("training"),
      );
    }
    $("pause").disabled = true;
  }
  saveRun() {
    if (!["playing", "paused"].includes(this.state)) return;
    const p = this.pilot;
    store.set(
      "cima.run.v2",
      JSON.stringify({
        version: 2,
        kind: this.level.kind,
        seed: this.level.seed,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        grounded: p.grounded,
        platformId: p.platformId,
        jumps: p.jumps,
        falls: p.falls,
        elapsed: p.elapsed,
        peak: p.peak,
        fallCounted: p.fallCounted,
        highestZone: this.highestZone,
      }),
    );
  }
  readSaved() {
    try {
      const s = JSON.parse(store.get("cima.run.v2"));
      if (
        !s ||
        s.version !== 2 ||
        !["training", "campaign"].includes(s.kind) ||
        typeof s.seed !== "string" ||
        (s.kind === "campaign" && !unlocked)
      )
        return null;
      if (
        ![
          "x",
          "y",
          "vx",
          "vy",
          "jumps",
          "falls",
          "elapsed",
          "peak",
          "platformId",
          "highestZone",
        ].every((k) => Number.isFinite(s[k]))
      )
        return null;
      if (
        s.x < 11 ||
        s.x > 789 ||
        s.y < 0 ||
        s.y > 5800 ||
        Math.abs(s.vx) > 500 ||
        Math.abs(s.vy) > 1100 ||
        s.elapsed < 0 ||
        s.jumps < 0 ||
        s.falls < 0
      )
        return null;
      return s;
    } catch {
      return null;
    }
  }
  continueSaved() {
    const s = this.saved;
    if (!s) return;
    this.startRun(s.kind, s.seed);
    Object.assign(
      this.pilot,
      ...[
        "x",
        "y",
        "vx",
        "vy",
        "grounded",
        "platformId",
        "jumps",
        "falls",
        "elapsed",
        "peak",
        "fallCounted",
      ].map((k) => ({ [k]: s[k] })),
    );
    this.highestZone = Math.max(0, Math.min(4, s.highestZone));
    this.paintSky(zoneFor(this.level, s.y));
    this.resetCamera();
    this.renderUI();
    this.saveRun();
  }
  tick() {
    if (this.state !== "playing") return;
    const p = this.pilot,
      oldJumps = p.jumps;
    p.step(input);
    if (p.grounded && !p.charging && input.left !== input.right)
      this.facing = input.left ? -1 : 1;
    if (p.jumps !== oldJumps) {
      if (input.left !== input.right) this.facing = input.left ? -1 : 1;
      tone(340 + p.charge * 220, 0.1, "triangle");
    }
    if (p.landed) {
      this.landUntil = p.elapsed + 110;
      tone(170, 0.05);
    }
    if (p.bounced) tone(110, 0.05);
    const z = zoneFor(this.level, p.y);
    if (z !== this.zone) {
      this.paintSky(z);
      if (z > this.highestZone) {
        this.highestZone = z;
        toast(
          this.level.kind === "campaign"
            ? this.level.zones[z].message
            : this.trainingHint(z),
        );
      }
    }
    if (p.grounded && p.platformId === this.goal.id) {
      this.complete();
      return;
    }
    this.saveClock += WORLD.step;
    if (this.saveClock >= 1) {
      this.saveClock = 0;
      this.saveRun();
    }
  }
  trainingHint(z) {
    return [
      "",
      "La carga decide la altura. No puedes corregir en el aire.",
      "Los techos detienen el salto; las paredes te hacen rebotar.",
      "Al caer, puedes volver a plataformas anteriores.",
      "Últimos saltos. En la cima comienza tu viaje.",
    ][z];
  }
  update(_time, delta) {
    if (this.state === "playing") {
      this.accumulator += Math.min(delta, 250) / 1000;
      while (this.accumulator + 1e-9 >= WORLD.step) {
        this.tick();
        this.accumulator = Math.max(0, this.accumulator - WORLD.step);
        if (this.state !== "playing") break;
      }
    }
    this.drawPlayer();
    this.followCamera(Math.min(delta, 100) / 1000);
    this.renderUI();
  }
  drawPlayer() {
    const p = this.pilot;
    let frame = p.state;
    if (p.grounded && !p.charging && p.elapsed < this.landUntil) frame = "land";
    if (this.state === "won") {
      frame = "reunion";
      this.player.setPosition(this.goal.x, this.goal.y);
      this.beloved.setVisible(false);
    }
    if (frame === "walk")
      frame = Math.floor(p.elapsed / 120) % 2 ? "walk1" : "walk2";
    if (this.state !== "won") this.player.setPosition(p.x, p.y);
    showSprite(this.player, frame);
    this.player.setFlipX(this.facing < 0);
    const g = this.fx;
    g.clear();
    g.fillStyle(0x0a1228, 0.35);
    g.fillEllipse(p.x, p.y + 2, 28, 6);
    if (p.charging) {
      g.lineStyle(2, 0xf4c99a, 0.7);
      g.beginPath();
      g.arc(
        p.x,
        p.y - 18,
        28,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * p.charge,
        false,
      );
      g.strokePath();
    }
    if (this.state === "won")
      this.heart(g, this.goal.x, this.goal.y - 60, 0xe8a7b7, 2);
  }
  resizeView() {
    const h = viewportHeight();
    if (this.scale.gameSize.height !== h) this.scale.setGameSize(800, h);
    this.cameras.main.setSize(800, h);
    this.cameras.main.setBounds(
      0,
      0,
      800,
      this.level.ground + this.bottomReserve(),
    );
    this.paintSky(Math.max(0, this.zone));
    this.resetCamera();
  }
  bottomReserve() {
    return (
      ((matchMedia("(pointer: coarse), (max-width: 950px)").matches
        ? 220
        : 110) *
        800) /
      $("game").clientWidth
    );
  }
  resetCamera() {
    const h = this.scale.gameSize.height;
    this.cameras.main.scrollY = Math.max(
      0,
      Math.min(
        this.level.ground + this.bottomReserve() - h,
        this.pilot.y - h * 0.62,
      ),
    );
  }
  followCamera(dt) {
    if (this.state === "ready") return;
    const c = this.cameras.main,
      h = this.scale.gameSize.height,
      y = this.player.y;
    const bottom = Math.max(h * 0.54, h - this.bottomReserve() - 85);
    let target = c.scrollY;
    if (y - c.scrollY < h * 0.38) target = y - h * 0.38;
    else if (y - c.scrollY > bottom) target = y - bottom;
    c.scrollY += (target - c.scrollY) * (reduced ? 1 : 1 - Math.exp(-12 * dt));
    c.scrollY = Math.max(
      y - h + Math.min(48, h * 0.18),
      Math.min(y - 38, c.scrollY),
    );
    c.scrollY = Math.max(
      0,
      Math.min(
        Math.max(0, this.level.ground + this.bottomReserve() - h),
        c.scrollY,
      ),
    );
  }
  paintSky(zone) {
    this.zone = zone;
    const z = this.level.zones[zone],
      g = this.sky,
      h = this.scale.gameSize.height;
    g.clear();
    g.fillStyle(z.sky);
    g.fillRect(0, 0, 800, h);
    for (let i = 0; i < 110; i++) {
      const x = (i * 173 + 41) % 800,
        y = (i * 127 + 19) % Math.ceil(h);
      g.fillStyle(i % 7 === 0 ? 0xf1c8b4 : 0xc5dce7, i % 4 === 0 ? 0.7 : 0.3);
      g.fillRect(x, y, i % 7 === 0 ? 3 : 2, 2);
    }
    const mx = 650,
      my = Math.min(170, h * 0.23),
      rad = 40 + zone * 4;
    g.fillStyle(0xf2d3bf, 0.04);
    g.fillCircle(mx, my, rad + 32);
    g.fillStyle(0xf2d3bf, 0.08);
    g.fillCircle(mx, my, rad + 13);
    g.fillStyle(0xe6d8d0);
    g.fillCircle(mx, my, rad);
    g.fillStyle(0xbebbc7, 0.65);
    g.fillCircle(mx - 13, my + 5, 9);
    g.fillCircle(mx + 17, my - 9, 7);
    g.fillCircle(mx + 7, my + 21, 5);
    this.heart(g, mx + rad - 1, my - rad + 4, 0xeaabbc, 1);
    g.fillStyle(z.far, 0.65);
    g.fillPoints(
      [
        { x: 0, y: h },
        { x: 0, y: h * 0.82 },
        { x: 90, y: h * 0.68 },
        { x: 180, y: h * 0.82 },
        { x: 370, y: h * 0.7 },
        { x: 560, y: h * 0.89 },
        { x: 700, y: h * 0.7 },
        { x: 800, y: h * 0.82 },
        { x: 800, y: h },
      ],
      true,
    );
    if (zone < 2) {
      g.fillStyle(0xd4dae6, 0.08);
      for (let i = 0; i < 7; i++) {
        g.fillRect(i * 150 - 70, h * 0.55 + (i % 3) * 35, 150, 10);
        g.fillRect(i * 150 - 42, h * 0.55 + (i % 3) * 35 - 8, 87, 9);
      }
    }
    const d = this.decor;
    d.clear();
    d.fillStyle(z.near, 0.8);
    for (let i = 0; i < 10; i++) {
      const x = (i * 193) % 800,
        yy = 120 + i * 90;
      d.fillRect(x, yy, 12, 150);
      d.fillRect(x - 16, yy + 16, 44, 5);
      if (zone === 2) {
        d.fillStyle(0x476888, 0.35);
        d.fillRect(x - 35, yy + 22, 82, 36);
        d.fillStyle(z.near, 0.8);
      }
    }
    $("stage").classList.add("night");
  }
  heart(g, x, y, color, scale = 1) {
    g.fillStyle(color);
    g.fillRect(x - 4 * scale, y, 3 * scale, 3 * scale);
    g.fillRect(x + scale, y, 3 * scale, 3 * scale);
    g.fillRect(x - 3 * scale, y + 2 * scale, 6 * scale, 3 * scale);
    g.fillRect(x - 2 * scale, y + 5 * scale, 4 * scale, 2 * scale);
    g.fillRect(x - scale, y + 7 * scale, 2 * scale, scale);
  }
  paintTerrain() {
    const g = this.terrain;
    g.clear();
    for (const p of this.level.platforms) {
      const c = this.level.zones[p.zone],
        left = p.x - p.width / 2;
      g.fillStyle(0x070f23, 0.4);
      g.fillRect(left + 4, p.y + 7, p.width, 24);
      g.fillStyle(c.stone);
      g.fillRect(left, p.y, p.width, 24);
      g.fillStyle(c.top);
      g.fillRect(left, p.y, p.width, 4);
      g.fillStyle(0x132239, 0.7);
      g.fillRect(left, p.y + 20, p.width, 4);
      for (let j = 8; j < p.width - 6; j += 22) {
        g.fillStyle(0x1d2f49, 0.5);
        g.fillRect(left + j, p.y + 8, 14, 7);
        g.fillStyle(c.top, 0.6);
        g.fillRect(left + j, p.y + 9, 2, 2);
      }
      if (this.level.kind === "campaign" && p.zone === 3) {
        g.fillStyle(c.stone);
        g.fillTriangle(
          left,
          p.y + 20,
          left + p.width,
          p.y + 20,
          p.x + 8,
          p.y + 47,
        );
      } else if (this.level.kind === "campaign" && p.zone === 4) {
        g.fillStyle(c.top, 0.4);
        g.fillRect(left + 3, p.y + 4, p.width - 6, 3);
      } else {
        g.fillStyle(c.stone, 0.65);
        g.fillTriangle(
          left + 8,
          p.y + 24,
          left + 18,
          p.y + 24,
          left + 12,
          p.y + 38,
        );
        g.fillTriangle(
          left + p.width - 18,
          p.y + 24,
          left + p.width - 8,
          p.y + 24,
          left + p.width - 12,
          p.y + 38,
        );
      }
      if (p.id === 0) {
        g.fillStyle(0x263e57);
        g.fillRect(26, p.y - 120, 28, 120);
        g.fillRect(20, p.y - 96, 40, 4);
        g.fillStyle(0xe2b292);
        g.fillRect(35, p.y - 115, 5, 5);
        g.lineStyle(2, 0x728e9f);
        g.lineBetween(40, p.y - 120, 70, p.y - 146);
        g.lineBetween(40, p.y - 120, 15, p.y - 143);
      }
      if (p.id === this.goal.id) {
        g.fillStyle(0xf4c99a, 0.12);
        g.fillCircle(p.x, p.y - 18, 38);
        g.fillStyle(0xaac6d2);
        g.fillRect(left + 5, p.y - 50, 3, 50);
        g.fillStyle(0xd99bad);
        g.fillRect(left + 8, p.y - 50, 25, 14);
        this.heart(g, left + 19, p.y - 47, 0xf2ded0, 0.65);
      }
    }
    // Decorative edges are visibly recessed; only the bright platforms are solid.
    g.fillStyle(0x091225, 0.7);
    g.fillRect(0, 0, 7, this.level.height);
    g.fillRect(793, 0, 7, this.level.height);
  }
  renderUI() {
    const p = this.pilot;
    if (!p) return;
    $("time").textContent = formatTime(p.elapsed);
    $("jumps").textContent = p.jumps;
    $("falls").textContent = p.falls;
    $("best").textContent = this.best ? formatTime(this.best) : "—";
    $("altitude").textContent = String(
      Math.max(0, Math.round((this.level.ground - p.y) / 10)),
    ).padStart(3, "0");
    $("charge-fill").style.width = `${p.charging ? p.charge * 100 : 0}%`;
    $("charge-label").textContent = p.charging
      ? `${Math.round(p.charge * 100)}%`
      : "LISTO";
    $("zone-title").textContent =
      `${this.level.kind === "training" ? "T" : "0" + (this.zone + 1)} · ${this.level.zones[Math.max(0, this.zone)].tag}`;
    $("progress-fill").style.height =
      `${Math.min(100, Math.max(0, ((this.level.ground - p.y) / (this.level.ground - this.goal.y)) * 100))}%`;
    $("help").textContent =
      this.level.kind === "training"
        ? "← → / A D · Mantén ESPACIO y suelta · Sin control en el aire"
        : this.level.zones[Math.max(0, this.zone)].hint;
  }
  bindControls() {
    const mapping = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      Space: "jump",
    };
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (mapping[e.code]) {
        if (this.state !== "playing") return;
        e.preventDefault();
        this.held.add(e.code);
        input[mapping[e.code]] = true;
      }
      if (e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        if (this.state === "playing") this.pauseRun();
        else if (this.state === "paused") this.resume();
      }
      if (e.code === "KeyR" && ["playing", "paused"].includes(this.state)) {
        e.preventDefault();
        this.pauseRun();
        this.confirmReset();
      }
      if (e.code === "KeyM") $("sound").click();
    });
    window.addEventListener("keyup", (e) => {
      if (mapping[e.code]) {
        this.held.delete(e.code);
        input[mapping[e.code]] = [...this.held].some(
          (k) => mapping[k] === mapping[e.code],
        );
      }
    });
    document.querySelectorAll("[data-touch]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (this.state !== "playing") return;
        b.setPointerCapture(e.pointerId);
        input[b.dataset.touch] = true;
        b.classList.add("held");
      });
      const release = (e) => {
        e.preventDefault();
        input[b.dataset.touch] = false;
        b.classList.remove("held");
      };
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((k) =>
        b.addEventListener(k, release),
      );
    });
    window.addEventListener("blur", () => this.pauseRun());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseRun();
    });
    window.addEventListener("pagehide", () => this.saveRun());
    $("pause").onclick = () =>
      this.state === "playing" ? this.pauseRun() : this.resume();
    $("sound").onclick = () => {
      soundOn = !soundOn;
      $("sound").textContent = soundOn ? "Sonido ON" : "Sonido OFF";
      $("sound").setAttribute("aria-pressed", String(soundOn));
      $("sound").setAttribute(
        "aria-label",
        soundOn ? "Silenciar sonido" : "Activar sonido",
      );
      if (soundOn) tone(440);
    };
    $("fullscreen").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.querySelector(".play-area").requestFullscreen();
      } catch {
        toast("Este navegador no permite pantalla completa.");
      }
    };
    // Keep modal keyboard focus inside the active dialog.
    $("overlay").addEventListener("keydown", (e) => {
      if (e.code !== "Tab") return;
      const nodes = [...$("overlay").querySelectorAll("button,input")].filter(
        (n) => !n.disabled && n.getClientRects().length,
      );
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: viewportHeight(),
  backgroundColor: "#192c48",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
  scene: [Moonbound],
  callbacks: {
    postBoot: (game) => game.canvas.setAttribute("aria-hidden", "true"),
  },
});
