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
import { LivingWorld, paintTerrain } from "./environment.js";
const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const input = { left: false, right: false, jump: false, jumpPressed: false };
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
  scene?.touchPointers?.clear();
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
  create() {
    scene = this;
    this.state = "ready";
    this.held = new Set();
    this.touchPointers = new Map();
    this.accumulator = 0;
    this.facing = 1;
    this.zone = -1;
    this.highestZone = 0;
    makeSprites(this);
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-30);
    this.terrain = this.add.graphics().setDepth(-2);
    this.fx = this.add.graphics().setDepth(1);
    this.player = this.add
      .sprite(120, 3240, "pixel-cadet-idle")
      .setOrigin(0.5, 1)
      .setDepth(4);
    this.beloved = this.add
      .sprite(0, 0, "pixel-beloved-idle")
      .setOrigin(0.5, 1)
      .setFlipX(true)
      .setDepth(3);
    this.livingWorld = new LivingWorld(this, reduced);
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
        ? "cima.training.best.v4"
        : campaignBestKey(level.seed);
    this.best = null;
    try {
      this.best = readBest(localStorage, this.bestKey);
    } catch {}
    this.livingWorld.rebuild();
    this.paintTerrain();
    this.paintSky(0);
    this.beloved
      .setVisible(level.kind === "campaign")
      .setPosition(this.goal.x, this.goal.y);
    showSprite(this.beloved, "beloved");
    this.player.setPosition(this.pilot.x, this.pilot.y).setFlipX(false);
    showSprite(
      this.player,
      "idle",
      level.kind === "training" ? "cadet" : "astronaut",
    );
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
    store.remove("cima.run.v4");
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
        : "Elige: ruta ámbar a la izquierda o turquesa a la derecha.",
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
    store.remove("cima.run.v4");
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
      "cima.run.v4",
      JSON.stringify({
        version: 4,
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
      const s = JSON.parse(store.get("cima.run.v4"));
      if (
        !s ||
        s.version !== 4 ||
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
        s.y > 20000 ||
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
    input.jumpPressed = false;
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
      "Los salientes tienen fondo sólido. Busca espacio para despegar.",
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
    this.livingWorld.update(delta);
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
    showSprite(
      this.player,
      frame,
      this.level.kind === "training" ? "cadet" : "astronaut",
    );
    this.player.setFlipX(this.facing < 0);
    const g = this.fx;
    g.clear();
    g.fillStyle(0x0a1228, 0.35);
    g.fillRect(Math.round(p.x) - 10, Math.round(p.y) + 2, 20, 4);
    if (p.charging) {
      g.fillStyle(0x10182b);
      g.fillRect(Math.round(p.x) - 17, Math.round(p.y) - 58, 34, 6);
      g.fillStyle(0xe0ae74);
      g.fillRect(
        Math.round(p.x) - 16,
        Math.round(p.y) - 57,
        Math.floor(p.charge * 16) * 2,
        4,
      );
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
    this.livingWorld.sky(zone);
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
    paintTerrain(this);
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
        : "← Ruta ámbar · Ruta turquesa → · Ambas llegan a la Luna";
  }
  bindControls() {
    const mapping = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      Space: "jump",
    };
    const sync = () => {
      for (const action of ["left", "right", "jump"])
        input[action] =
          [...this.held].some((code) => mapping[code] === action) ||
          [...this.touchPointers.values()].includes(action);
    };
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (mapping[e.code]) {
        if (this.state !== "playing") return;
        e.preventDefault();
        if (mapping[e.code] === "jump" && !e.repeat && !input.jump)
          input.jumpPressed = true;
        this.held.add(e.code);
        sync();
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
        sync();
      }
    });
    document.querySelectorAll("[data-touch]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (this.state !== "playing") return;
        b.setPointerCapture(e.pointerId);
        if (b.dataset.touch === "jump" && !input.jump) input.jumpPressed = true;
        this.touchPointers.set(e.pointerId, b.dataset.touch);
        sync();
        b.classList.add("held");
      });
      const release = (e) => {
        e.preventDefault();
        this.touchPointers.delete(e.pointerId);
        sync();
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
