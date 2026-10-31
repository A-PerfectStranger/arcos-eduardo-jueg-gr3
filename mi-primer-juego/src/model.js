// One simulation shared by the player, the generator and the tests. Units: px, s.
export const WORLD = Object.freeze({
  width: 800,
  height: 3300,
  ground: 3240,
  gravity: 1300,
  chargeMs: 800,
  walk: 150,
  jumpX: 250,
  minJump: 250,
  maxJump: 690,
  playerW: 22,
  playerH: 34,
  step: 1 / 120,
  rebound: 0.7,
  terminal: 1100,
});
export const TRAINING_ZONES = [
  {
    name: "El primer paso",
    tag: "PRADERA",
    sky: 0x223a53,
    far: 0x29495b,
    near: 0x213646,
    stone: 0x526e71,
    top: 0xa6c69c,
  },
  {
    name: "Raíces antiguas",
    tag: "BOSQUE",
    sky: 0x20384b,
    far: 0x234550,
    near: 0x1d3540,
    stone: 0x4d7068,
    top: 0x96c6a6,
  },
  {
    name: "Lo que queda",
    tag: "RUINAS",
    sky: 0x2c334f,
    far: 0x363f61,
    near: 0x232c46,
    stone: 0x6f7694,
    top: 0xb8b8da,
  },
  {
    name: "Sobre las nubes",
    tag: "CIELO",
    sky: 0x333b60,
    far: 0x455177,
    near: 0x303e60,
    stone: 0x6c86a0,
    top: 0xc4d8dc,
  },
  {
    name: "Listo para partir",
    tag: "DESPEGUE",
    sky: 0x101a33,
    far: 0x233657,
    near: 0x182842,
    stone: 0x617590,
    top: 0xf1c589,
  },
];
const centers = [
  300, 490, 660, 470, 270, 100, 290, 480, 670, 490, 300, 110, 290, 480, 660,
  470, 280, 110, 300, 490, 670, 480, 290, 120, 310,
];
export const PLATFORMS = [
  { id: 0, x: 400, y: WORLD.ground, width: 800, height: 24, zone: 0 },
  ...centers.map((x, i) => ({
    id: i + 1,
    x,
    y: WORLD.ground - (i + 1) * 120,
    width: 158 - Math.floor(i / 5) * 12,
    height: 24,
    zone: Math.min(4, Math.floor(i / 5)),
  })),
];
export const GOAL = PLATFORMS.at(-1);
export const ZONES = TRAINING_ZONES;
export const CAMPAIGN_ZONES = [
  {
    name: "La última noche en casa",
    tag: "COSMÓDROMO",
    sky: 0x192c48,
    far: 0x243c55,
    near: 0x17283d,
    stone: 0x4d6a7a,
    top: 0x9bd8cc,
    width: 158,
    rise: [112, 120],
    charge: [0.9, 1],
    hint: "Carga, apunta y confía. Ella te espera.",
    message: "Veo tu luz desde aquí. Sigue subiendo. — L",
  },
  {
    name: "Donde termina el cielo",
    tag: "ESTRATOSFERA",
    sky: 0x262e50,
    far: 0x343e63,
    near: 0x252e4d,
    stone: 0x627493,
    top: 0xb8c6ed,
    width: 130,
    rise: [120, 130],
    charge: [0.9, 1],
    hint: "Las nubes no detienen una caída.",
    message: "Las nubes parecen un océano entre nosotros. — L",
  },
  {
    name: "Cartas en órbita",
    tag: "ESTACIÓN ORBITAL",
    sky: 0x151e37,
    far: 0x263653,
    near: 0x1c2841,
    stone: 0x4c6683,
    top: 0x8edcd8,
    width: 102,
    rise: [126, 140],
    charge: [0.9, 1],
    shortRise: [104, 116],
    shortCharge: [0.82, 0.92],
    hint: "Paneles más pequeños. Elige dónde despegar.",
    message: "He dejado la radio encendida para ti. — L",
  },
  {
    name: "El silencio entre estrellas",
    tag: "CAMPO DE ASTEROIDES",
    sky: 0x19172e,
    far: 0x342a48,
    near: 0x241f37,
    stone: 0x777080,
    top: 0xd4aeae,
    width: 74,
    rise: [134, 148],
    charge: [0.94, 1],
    shortRise: [98, 110],
    shortCharge: [0.78, 0.9],
    hint: "Ajusta la carga. Cada borde cuenta.",
    message: "No oigo tus pasos, pero sé que estás cerca. — L",
  },
  {
    name: "A un salto de ti",
    tag: "LUNA",
    sky: 0x0c1327,
    far: 0x27314d,
    near: 0x19223a,
    stone: 0x8589a5,
    top: 0xf2c9a3,
    width: 46,
    rise: [140, 154],
    charge: [0.98, 1],
    shortRise: [92, 104],
    shortCharge: [0.76, 0.88],
    hint: "Respira. El último tramo pide precisión.",
    message: "No necesitaba un héroe. Solo que llegaras. — L",
  },
];
export const jumpSpeed = (charge) =>
  WORLD.minJump +
  (WORLD.maxJump - WORLD.minJump) * Math.max(0, Math.min(1, charge));
export const formatTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
export const heightAt = (y, ground = WORLD.ground) =>
  Math.max(0, Math.round((ground - y - WORLD.playerH / 2) / 10));
export const zoneAt = (y) =>
  Math.max(0, Math.min(4, Math.floor((WORLD.ground - y) / 600)));
export function zoneFor(level, y) {
  let zone = 0;
  for (const p of level.platforms)
    if (p.y >= y - 1) zone = Math.max(zone, p.zone);
  return zone;
}
export function trainingLevel() {
  return {
    kind: "training",
    seed: "ENTRENAMIENTO",
    height: WORLD.height,
    ground: WORLD.ground,
    spawn: 120,
    zones: TRAINING_ZONES,
    platforms: PLATFORMS,
    goal: GOAL,
  };
}
export function seededRandom(seed) {
  let h = 2166136261;
  for (const c of String(seed)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function newSeed() {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues)
    globalThis.crypto.getRandomValues(values);
  else values[0] = Math.floor(Math.random() * 4294967296);
  return values[0].toString(36).toUpperCase().padStart(7, "0");
}
const EPS = 1e-7;
// Continuous swept AABB: find the first surface crossed, including thin ledges.
function sweep(x, y, dx, dy, r) {
  const minX = r.x - r.width / 2 - WORLD.playerW / 2,
    maxX = r.x + r.width / 2 + WORLD.playerW / 2;
  const minY = r.y,
    maxY = r.y + (r.height ?? 24) + WORLD.playerH;
  if (!dx && (x <= minX + EPS || x >= maxX - EPS)) return null;
  if (!dy && (y <= minY + EPS || y >= maxY - EPS)) return null;
  const tx1 = dx ? (minX - x) / dx : -Infinity,
    tx2 = dx ? (maxX - x) / dx : Infinity;
  const ty1 = dy ? (minY - y) / dy : -Infinity,
    ty2 = dy ? (maxY - y) / dy : Infinity;
  const tx = Math.min(tx1, tx2),
    ty = Math.min(ty1, ty2),
    entry = Math.max(tx, ty),
    end = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
  if (entry < -EPS || entry > 1 + EPS || entry > end + EPS || end < 0)
    return null;
  return {
    t: Math.max(0, entry),
    nx: tx > ty ? -Math.sign(dx) : 0,
    ny: tx > ty ? 0 : -Math.sign(dy),
    id: r.id,
  };
}
export class Astronaut {
  constructor(level, x = level.spawn, y = level.ground) {
    Object.assign(this, {
      level,
      x,
      y,
      vx: 0,
      vy: 0,
      grounded: true,
      platformId: 0,
      charging: false,
      charge: 0,
      wasJump: false,
      jumps: 0,
      falls: 0,
      peak: y,
      fallCounted: false,
      landed: false,
      bounced: false,
      state: "idle",
      elapsed: 0,
    });
    this.solids = [
      ...level.platforms,
      { id: -1, x: -20, y: -1000, width: 40, height: level.height + 3000 },
      {
        id: -2,
        x: WORLD.width + 20,
        y: -1000,
        width: 40,
        height: level.height + 3000,
      },
    ];
  }
  cancelCharge() {
    this.charging = false;
    this.charge = 0;
    this.wasJump = false;
  }
  step(input, dt = WORLD.step) {
    this.elapsed += dt * 1000;
    this.landed = false;
    this.bounced = false;
    const dir = Number(!!input.right) - Number(!!input.left);
    if (this.grounded) {
      if (input.jump && !this.wasJump) {
        this.charging = true;
        this.charge = 0;
      }
      if (this.charging) {
        this.vx = 0;
        if (input.jump)
          this.charge = Math.min(1, this.charge + (dt * 1000) / WORLD.chargeMs);
        else {
          this.vx = dir * WORLD.jumpX;
          this.vy = -jumpSpeed(this.charge);
          this.grounded = false;
          this.jumps++;
          this.charging = false;
          this.peak = this.y;
          this.fallCounted = false;
        }
      } else this.vx = dir * WORLD.walk;
    }
    this.wasJump = !!input.jump;
    if (!this.grounded)
      this.vy = Math.min(WORLD.terminal, this.vy + WORLD.gravity * dt);
    let remaining = dt;
    for (let pass = 0; pass < 5 && remaining > EPS; pass++) {
      const dx = this.vx * remaining,
        dy = this.vy * remaining;
      let first = null;
      for (const solid of this.solids) {
        const hit = sweep(this.x, this.y, dx, dy, solid);
        if (
          hit &&
          (!first ||
            hit.t < first.t - EPS ||
            (Math.abs(hit.t - first.t) < EPS && hit.ny))
        )
          first = hit;
      }
      if (!first) {
        this.x += dx;
        this.y += dy;
        break;
      }
      this.x += dx * first.t;
      this.y += dy * first.t;
      remaining *= 1 - first.t;
      if (first.nx) {
        this.vx = this.grounded ? 0 : -this.vx * WORLD.rebound;
        this.bounced = !this.grounded;
      } else {
        this.vy = 0;
        if (first.ny === -1) {
          this.landed = !this.grounded;
          this.grounded = true;
          this.platformId = first.id;
          this.vx = 0;
          this.peak = this.y;
          this.fallCounted = false;
        }
      }
    }
    if (this.grounded) {
      this.grounded = this.level.platforms.some(
        (p) =>
          Math.abs(this.y - p.y) < 0.001 &&
          this.x + WORLD.playerW / 2 > p.x - p.width / 2 + EPS &&
          this.x - WORLD.playerW / 2 < p.x + p.width / 2 - EPS,
      );
      if (!this.grounded) {
        this.charging = false;
        this.charge = 0;
        this.peak = this.y;
        this.fallCounted = false;
      }
    }
    this.peak = Math.min(this.peak, this.y);
    if (!this.grounded && !this.fallCounted && this.y - this.peak > 190) {
      this.falls++;
      this.fallCounted = true;
    }
    this.state = this.charging
      ? "charge"
      : this.grounded
        ? this.vx
          ? "walk"
          : "idle"
        : this.vy < 0
          ? "jump"
          : "fall";
  }
}
// The generator constructs a landing witness, then tests the whole solid route.
// Charge ticks are private design metadata, never shown during the campaign.
export function generateCampaign(seed) {
  seed = String(seed).trim().slice(0, 40) || newSeed();
  const random = seededRandom(seed),
    ground = 5800,
    platforms = [{ id: 0, x: 400, y: ground, width: 800, height: 24, zone: 0 }];
  let x = 120,
    y = ground,
    direction = 1;
  for (let zone = 0; zone < 5; zone++) {
    const rules = CAMPAIGN_ZONES[zone];
    for (let j = 0; j < 8; j++) {
      const short = rules.shortRise && j % 3 === 1;
      const riseRange = short ? rules.shortRise : rules.rise,
        chargeRange = short ? rules.shortCharge : rules.charge;
      const rise = Math.round(
        riseRange[0] + random() * (riseRange[1] - riseRange[0]),
      );
      const ticks = Math.ceil(
        ((chargeRange[0] + random() * (chargeRange[1] - chargeRange[0])) *
          WORLD.chargeMs) /
          (WORLD.step * 1000),
      );
      const launchSpeed = jumpSpeed(
        Math.min(1, (ticks * WORLD.step * 1000) / WORLD.chargeMs),
      );
      let yy = y,
        v = -launchSpeed,
        travel = 0;
      for (let t = 0; t < 180; t++) {
        v += WORLD.gravity * WORLD.step;
        const next = yy + v * WORLD.step;
        if (v > 0 && next >= y - rise) {
          travel += WORLD.jumpX * WORLD.step * ((y - rise - yy) / (next - yy));
          break;
        }
        yy = next;
        travel += WORLD.jumpX * WORLD.step;
      }
      if (x + direction * travel > 710 || x + direction * travel < 90)
        direction *= -1;
      const nextX = Math.round(x + direction * travel);
      const width = rules.width - Math.floor(random() * 7);
      platforms.push({
        id: platforms.length,
        x: nextX,
        y: y - rise,
        width,
        height: 24,
        zone,
        challenge: short ? "measured" : "ascent",
        witness: { x, y, dir: direction, ticks },
      });
      x = nextX;
      y -= rise;
    }
  }
  const level = {
    kind: "campaign",
    seed,
    height: ground + 60,
    ground,
    spawn: 120,
    zones: CAMPAIGN_ZONES,
    platforms,
    goal: platforms.at(-1),
  };
  // Catch regressions when designers change gravity, geometry or charge rules.
  for (let i = 1; i < platforms.length; i++) {
    const p = platforms[i],
      a = new Astronaut(level, p.witness.x, p.witness.y);
    for (let n = 0; n < p.witness.ticks; n++) a.step({ jump: true });
    a.step({ left: p.witness.dir < 0, right: p.witness.dir > 0, jump: false });
    for (let n = 0; n < 240 && !a.grounded; n++) a.step({});
    if (!a.grounded || a.platformId !== p.id)
      throw new Error(`Invalid route: ${seed}/${p.id}`);
  }
  return level;
}
export function readBest(storage, key = "cima.training.best.v2") {
  try {
    const n = Number(storage.getItem(key));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
export function writeBest(storage, ms, key = "cima.training.best.v2") {
  try {
    storage.setItem(key, String(ms));
  } catch {
    /* Optional storage. */
  }
}
export function campaignBestKey(seed) {
  return `cima.moon.best.v2.${seed}`;
}
export function readUnlock(storage) {
  try {
    return storage.getItem("cima.training.complete.v2") === "yes";
  } catch {
    return false;
  }
}
export function writeUnlock(storage) {
  try {
    storage.setItem("cima.training.complete.v2", "yes");
  } catch {
    /* This session stays unlocked. */
  }
}
