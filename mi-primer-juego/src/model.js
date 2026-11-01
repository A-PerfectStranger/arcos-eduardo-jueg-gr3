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
  playerH: 42,
  feetHalf: 6,
  minFootOverlap: 2,
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
// Hand-composed training: broad shelves, narrow boughs and alternating rests.
const trainingSteps = [
  [300, 112, 192, "shelf"],
  [490, 136, 152, "branch"],
  [665, 92, 192, "cliff"],
  [470, 148, 174, "shelf"],
  [270, 112, 218, "terrace"],
  [105, 128, 160, "branch"],
  [295, 96, 174, "bough"],
  [480, 152, 146, "branch"],
  [675, 104, 190, "cliff"],
  [490, 120, 210, "terrace"],
  [300, 144, 160, "ruin"],
  [110, 88, 172, "arch"],
  [295, 156, 140, "ruin"],
  [480, 108, 166, "shelf"],
  [665, 104, 196, "terrace"],
  [470, 132, 152, "shard"],
  [280, 112, 140, "branch"],
  [110, 148, 154, "cliff"],
  [300, 96, 128, "shard"],
  [490, 112, 190, "terrace"],
  [675, 140, 130, "ruin"],
  [480, 100, 146, "shard"],
  [290, 152, 124, "shelf"],
  [120, 108, 154, "cliff"],
  [310, 104, 200, "terrace"],
];
let trainingY = WORLD.ground;
export const PLATFORMS = [
  {
    id: 0,
    x: 400,
    y: WORLD.ground,
    width: 800,
    height: 60,
    zone: 0,
    kind: "ground",
    shape: "cliff",
  },
  ...trainingSteps.map(([x, rise, width, shape], i) => ({
    id: i + 1,
    x,
    y: (trainingY -= rise),
    width,
    height:
      shape === "branch" || shape === "bough"
        ? 12
        : shape === "terrace"
          ? 26
          : 20,
    zone: Math.min(4, Math.floor(i / 5)),
    kind: "ledge",
    shape,
  })),
];
export const GOAL = PLATFORMS.at(-1);
let training;
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
  for (const boundary of level.zoneStarts ?? level.platforms)
    if (boundary.y >= y - 1) zone = Math.max(zone, boundary.zone);
  return zone;
}
export function trainingLevel() {
  if (training) return training;
  const level = {
    kind: "training",
    seed: "ENTRENAMIENTO",
    height: WORLD.height,
    ground: WORLD.ground,
    spawn: 120,
    zones: TRAINING_ZONES,
    platforms: PLATFORMS,
    walls: terrainMasses(PLATFORMS),
    revision: 4,
    goal: GOAL,
    routePlans: { left: [], right: [] },
  };
  for (let i = 1; i < PLATFORMS.length; i++)
    level.routePlans.left.push(
      planJump(
        level,
        i === 1 ? { ...PLATFORMS[0], x: level.spawn } : PLATFORMS[i - 1],
        PLATFORMS[i],
        "left",
      ),
    );
  level.routePlans.right = level.routePlans.left;
  training = level;
  return level;
}
// Solid stepped undersides share the exact geometry used by the renderer.
// Tops stay flat and readable; roots, broken masonry and crags taper below.
function terrainMasses(platforms) {
  const solids = [];
  for (const p of platforms) {
    if (!p.id || ["branch", "bough", "panel"].includes(p.shape)) continue;
    const depth = p.shape === "cliff" ? 28 : p.shape === "terrace" ? 24 : 16;
    for (let tier = 0; tier < 2; tier++) {
      const width = Math.floor((p.width * (tier ? 0.28 : 0.55)) / 2) * 2;
      solids.push({
        id: 10000 + solids.length,
        x: p.x + (p.id % 2 ? 4 : -4),
        y: p.y + p.height + (tier * depth) / 2,
        width,
        height: depth / 2,
        zone: p.zone,
        kind: "mass",
        parent: p.id,
        shape: p.shape,
      });
    }
  }
  return solids;
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
const indexes = new WeakMap();
const CELL = 128;
export function footOverlap(x, platform) {
  return (
    Math.min(x + WORLD.feetHalf, platform.x + platform.width / 2) -
    Math.max(x - WORLD.feetHalf, platform.x - platform.width / 2)
  );
}
// Geometry is immutable after generation. Cache a vertical broad phase per map.
function geometryIndex(level) {
  if (indexes.has(level)) return indexes.get(level);
  const solids = [
    ...level.platforms,
    ...(level.walls ?? []),
    { id: -1, x: -20, y: -1000, width: 40, height: level.height + 3000 },
    { id: -2, x: 820, y: -1000, width: 40, height: level.height + 3000 },
  ];
  const bins = new Map();
  for (const solid of solids) {
    for (
      let row = Math.floor(solid.y / CELL);
      row <= Math.floor((solid.y + (solid.height ?? 24)) / CELL);
      row++
    ) {
      if (!bins.has(row)) bins.set(row, []);
      bins.get(row).push(solid);
    }
  }
  const index = {
    solids,
    query(top, bottom) {
      const first = Math.floor(top / CELL),
        last = Math.floor(bottom / CELL);
      if (first === last) return bins.get(first) ?? [];
      const found = new Set();
      for (let row = first; row <= last; row++)
        for (const p of bins.get(row) ?? []) found.add(p);
      return found;
    },
  };
  indexes.set(level, index);
  return index;
}
// Swept AABB in feet coordinates. Top contacts require actual boot support.
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
    exit = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
  if (entry < -EPS || entry > 1 + EPS || entry > exit + EPS || exit < 0)
    return null;
  const nx = tx > ty ? -Math.sign(dx) : 0,
    ny = tx > ty ? 0 : -Math.sign(dy),
    t = Math.max(0, entry);
  if (ny === -1 && footOverlap(x + dx * t, r) < WORLD.minFootOverlap - EPS)
    return null;
  return { t, nx, ny, id: r.id };
}
export class Astronaut {
  constructor(level, x = level.spawn, y = level.ground) {
    Object.assign(this, {
      level,
      x,
      y,
      vx: 0,
      vy: 0,
      grounded: false,
      platformId: null,
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
    this.geometry = geometryIndex(level);
    this.solids = this.geometry.solids;
    const support = this.supportAt();
    if (support) {
      this.grounded = true;
      this.platformId = support.id;
      this.y = support.y;
    }
  }
  supportAt() {
    for (const p of this.geometry.query(this.y - 0.001, this.y + 0.001))
      if (
        p.id >= 0 &&
        Math.abs(this.y - p.y) < 0.001 &&
        footOverlap(this.x, p) >= WORLD.minFootOverlap - EPS
      )
        return p;
    return null;
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
    // Recheck support before input; stale grounded flags cannot swallow a jump.
    if (this.grounded) {
      const support = this.supportAt();
      this.grounded = !!support;
      if (support) {
        this.y = support.y;
        this.platformId = support.id;
      } else {
        this.cancelCharge();
        this.peak = this.y;
      }
    }
    const dir = Number(!!input.right) - Number(!!input.left);
    if (this.grounded) {
      // A held press can begin charging on landing. Air time never adds charge.
      if ((input.jump || input.jumpPressed) && !this.charging) {
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
      for (const solid of this.geometry.query(
        Math.min(this.y, this.y + dy) - WORLD.playerH,
        Math.max(this.y, this.y + dy),
      )) {
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
    if (this.grounded && !this.supportAt()) {
      this.grounded = false;
      this.cancelCharge();
      this.peak = this.y;
      this.fallCounted = false;
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
export const ROOMS_PER_ZONE = 6;
export const CAMPAIGN_ASCENTS = ROOMS_PER_ZONE * 4 * 5;
const flights = new Map();
function flight(rise, ticks) {
  const key = rise + ":" + ticks;
  if (flights.has(key)) return flights.get(key);
  let y = 0,
    v = -jumpSpeed((ticks * WORLD.step * 1000) / WORLD.chargeMs),
    x = 0,
    result = null;
  for (let n = 0; n < 180; n++) {
    v += WORLD.gravity * WORLD.step;
    const next = y + v * WORLD.step;
    if (v > 0 && next >= -rise) {
      if (y <= -rise)
        result = x + WORLD.jumpX * WORLD.step * ((-rise - y) / (next - y));
      break;
    }
    y = next;
    x += WORLD.jumpX * WORLD.step;
  }
  flights.set(key, result);
  return result;
}
function planJump(level, source, target, route) {
  const dir = Math.sign(target.x - source.x),
    rise = source.y - target.y,
    candidates = [];
  const step = Math.min(60, source.width * 0.38);
  for (const offset of [0, -step / 2, step / 2, -step, step]) {
    const launchX = source.x + offset;
    for (let ticks = 52; ticks <= 96; ticks++) {
      const travel = flight(rise, ticks);
      if (travel === null) continue;
      const error = Math.abs(launchX + dir * travel - target.x);
      if (error <= target.width / 2 - WORLD.feetHalf - 2)
        candidates.push({
          launchX,
          ticks,
          score: error + Math.abs(offset) * 0.2,
        });
    }
  }
  candidates.sort((a, b) => a.score - b.score || a.ticks - b.ticks);
  for (const c of candidates) {
    const succeeds = (offset) => {
      const pilot = new Astronaut(level, c.launchX + offset, source.y);
      for (let n = 0; n < c.ticks; n++) pilot.step({ jump: true });
      pilot.step({ left: dir < 0, right: dir > 0 });
      for (
        let n = 0;
        n < 240 && !pilot.grounded && pilot.y < source.y + 60;
        n++
      )
        pilot.step({});
      return pilot.grounded && pilot.platformId === target.id;
    };
    // One walk tick is 1.25 px: never rely on an exact subpixel takeoff.
    if (succeeds(0) && succeeds(-1.5) && succeeds(1.5))
      return {
        from: source.id,
        to: target.id,
        x: c.launchX,
        y: source.y,
        dir,
        ticks: c.ticks,
        route,
      };
  }
  throw new Error(
    `Invalid route: ${level.seed}/${source.id}->${target.id} ${JSON.stringify({ source, target, candidates: candidates.length })}`,
  );
}
// Six asymmetric chamber patterns. Both complete routes are validated against
// all stepped solid terrain before a seed is offered to the player.
export function generateCampaign(seed) {
  seed = String(seed).trim().slice(0, 40) || newSeed();
  const random = seededRandom(seed);
  const chambers = [];
  let total = 0;
  for (let zone = 0; zone < 5; zone++)
    for (let room = 0; room < ROOMS_PER_ZONE; room++) {
      const rules = CAMPAIGN_ZONES[zone],
        rises = [];
      for (let step = 0; step < 4; step++) {
        const range =
          rules.shortRise && step === 1 ? rules.shortRise : rules.rise;
        const rise = Math.round(range[0] + random() * (range[1] - range[0]));
        rises.push(rise);
        total += rise;
      }
      chambers.push({ zone, room, rises });
    }
  const ground = total + 480,
    platforms = [
      {
        id: 0,
        x: 400,
        y: ground,
        width: 800,
        height: 60,
        shape: "cliff",
        zone: 0,
        kind: "ground",
      },
    ],
    rooms = [],
    zoneStarts = [];
  let base = ground,
    source = platforms[0];
  for (const chamber of chambers) {
    const { zone, room, rises } = chamber,
      rules = CAMPAIGN_ZONES[zone];
    if (room === 0) zoneStarts.push({ zone, y: base });
    // Asymmetric chambers vary launch distances, materials and resting ledges.
    const layouts = [
      [150, 310, 160],
      [175, 320, 155],
      [155, 300, 170],
      [165, 310, 165],
      [180, 325, 175],
      [160, 300, 155],
    ];
    const layout =
      (room + zone * 2 + Math.floor(random() * 3)) % layouts.length;
    const hubX = [390, 410, 395, 405, 400, 410][(room + zone) % 6];
    const routes = { left: [], right: [] },
      ys = [];
    let yy = base;
    for (const rise of rises) {
      yy -= rise;
      ys.push(yy);
    }
    const target = {
      id: 0,
      x: hubX,
      y: ys[3],
      width: rules.width + 24,
      height: 26,
      shape: zone === 2 ? "ruin" : zone === 4 ? "shard" : "terrace",
      zone,
      kind: "hub",
      room: rooms.length,
    };
    for (const route of ["left", "right"]) {
      const side = route === "left" ? -1 : 1;
      const offsets = layouts[(layout + (side > 0 ? 2 : 0)) % layouts.length];
      const xs = [
        source.x + side * offsets[0],
        400 + side * Math.max(zone >= 2 ? 315 : 0, offsets[1]),
        hubX + side * offsets[2],
      ];
      for (let step = 0; step < 3; step++) {
        const p = {
          id: platforms.length,
          x: Math.max(
            rules.width / 2 + 8,
            Math.min(792 - rules.width / 2, xs[step]),
          ),
          y:
            ys[step] +
            (zone >= 2
              ? Math.floor(random() * 7) - 3
              : Math.floor(random() * 15) - 7),
          width:
            rules.width - Math.floor(random() * 13) + (step === 1 ? 10 : 0),
          height: step === 1 && zone < 2 ? 12 : 20 + (layout % 3) * 4,
          shape:
            zone === 0
              ? ["shelf", "branch", "cliff"][step]
              : zone === 1
                ? ["bough", "branch", "shelf"][step]
                : zone === 2
                  ? ["ruin", "panel", "arch"][step]
                  : zone === 3
                    ? ["shard", "shelf", "cliff"][step]
                    : ["cliff", "shard", "ruin"][step],
          zone,
          kind: "ledge",
          route,
          room: rooms.length,
        };
        platforms.push(p);
        routes[route].push(p.id);
      }
    }
    target.id = platforms.length;
    platforms.push(target);
    const current = {
      id: rooms.length,
      zone,
      entry: source.id,
      exit: target.id,
      routes,
      layout,
    };
    rooms.push(current);
    source = target;
    base = target.y;
  }
  const level = {
    kind: "campaign",
    revision: 4,
    seed,
    height: ground + 64,
    ground,
    spawn: 400,
    zones: CAMPAIGN_ZONES,
    platforms,
    walls: terrainMasses(platforms),
    rooms,
    zoneStarts,
    goal: platforms.at(-1),
    routePlans: { left: [], right: [] },
  };
  for (const room of rooms)
    for (const route of ["left", "right"]) {
      let from = platforms[room.entry];
      for (const id of [...room.routes[route], room.exit]) {
        const target = platforms[id],
          edge = planJump(level, from, target, route);
        level.routePlans[route].push(edge);
        from = target;
      }
    }
  return level;
}
export function readBest(storage, key = "cima.training.best.v4") {
  try {
    const n = Number(storage.getItem(key));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
export function writeBest(storage, ms, key = "cima.training.best.v4") {
  try {
    storage.setItem(key, String(ms));
  } catch {
    /* Optional storage. */
  }
}
export function campaignBestKey(seed) {
  return `cima.moon.best.v4.${seed}`;
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
