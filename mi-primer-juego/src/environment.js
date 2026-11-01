import { seededRandom } from "./model.js";

// Original scenery on a native two-pixel grid. The reference informs the
// layered silhouettes, broken contours and restrained palette, never a map.
const palettes = [
  {
    sky: 0x3a604e,
    mist: 0x638065,
    far: 0x2d503e,
    mid: 0x1b382c,
    ink: 0x102219,
    leaf: 0x28432a,
    light: 0x47773c,
    moss: 0x83ac54,
    rock: 0x3c3c2a,
    shade: 0x242b20,
  },
  {
    sky: 0x71888a,
    mist: 0x9ca5a0,
    far: 0x51625a,
    mid: 0x303e35,
    ink: 0x202822,
    leaf: 0x492c30,
    light: 0x753d40,
    moss: 0xb66b55,
    rock: 0x383331,
    shade: 0x252724,
  },
  {
    sky: 0x353f59,
    mist: 0x647389,
    far: 0x2e3a51,
    mid: 0x202e40,
    ink: 0x111e2a,
    leaf: 0x293e3b,
    light: 0x456358,
    moss: 0x91b9a3,
    rock: 0x4e5a62,
    shade: 0x293842,
  },
  {
    sky: 0x342d48,
    mist: 0x67617a,
    far: 0x3d354e,
    mid: 0x27283d,
    ink: 0x191d30,
    leaf: 0x38334d,
    light: 0x59506b,
    moss: 0xb4a1b3,
    rock: 0x5d5364,
    shade: 0x393340,
  },
  {
    sky: 0x101a2e,
    mist: 0x3e4e68,
    far: 0x27354c,
    mid: 0x1b293d,
    ink: 0x101a29,
    leaf: 0x2c3d49,
    light: 0x5d6e79,
    moss: 0xd6c5a0,
    rock: 0x737983,
    shade: 0x414c5b,
  },
];
const hex = (n) => "#" + n.toString(16).padStart(6, "0");
const rect = (c, color, x, y, w, h) => {
  c.fillStyle = typeof color === "number" ? hex(color) : color;
  c.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
};
// Scanline polygons avoid antialiased edges on our small canvas textures.
function poly(c, color, points) {
  const min = Math.floor(Math.min(...points.map((p) => p[1]))),
    max = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = min; y < max; y++) {
    const cuts = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
        cuts.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length; i += 2)
      rect(
        c,
        color,
        Math.ceil(cuts[i]),
        y,
        Math.floor(cuts[i + 1]) - Math.ceil(cuts[i]),
        1,
      );
  }
}
function limb(c, color, x, y, ex, ey, width) {
  const n = Math.ceil(Math.hypot(ex - x, ey - y));
  for (let i = 0; i <= n; i++) {
    const f = i / n,
      w = Math.max(1, width * (1 - f * 0.6));
    rect(c, color, x + (ex - x) * f - w / 2, y + (ey - y) * f, w, w);
  }
}
function foliage(c, r, x, y, w, color, light, detail = true) {
  // Asymmetric, overlapping angular fronds rather than circular canopies.
  const h = w * 0.34;
  poly(c, color, [
    [x - w * 0.55, y],
    [x - w * 0.43, y - h * 0.6],
    [x - w * 0.18, y - h * 0.5],
    [x - w * 0.12, y - h],
    [x + w * 0.07, y - h * 0.72],
    [x + w * 0.26, y - h * 0.86],
    [x + w * 0.32, y - h * 0.38],
    [x + w * 0.54, y - h * 0.32],
    [x + w * 0.44, y + h * 0.18],
    [x + w * 0.2, y + h * 0.34],
    [x + w * 0.16, y + h * 0.54],
    [x - w * 0.15, y + h * 0.4],
    [x - w * 0.4, y + h * 0.32],
  ]);
  // Broken edge pixels read as individual leaves at the silhouette.
  if (detail)
    for (let i = 0; i < w / 3; i++) {
      const xx = x + (r() - 0.5) * w * 0.9,
        yy = y - h * 0.5 - r() * h * 0.35;
      rect(c, color, xx, yy, 2 + r() * 5, 1 + r() * 3);
      if (r() > 0.55) rect(c, light, xx + 1, yy, 2, 1);
    }
  if (detail)
    for (let i = 0; i < w * 2; i++) {
      const xx = x + (r() - 0.5) * w,
        yy = y + (r() - 0.6) * h;
      if (r() > 0.45) rect(c, light, xx, yy, 1 + r() * 4, 1 + r() * 2);
    }
}
function makeForest(scene, key, z, layer) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, 400, 1024),
    c = t.context,
    r = seededRandom(key),
    p = palettes[z];
  const trunk = layer === 0 ? p.far : p.mid,
    leaf = layer === 0 ? p.far : p.ink;
  // Trunks traverse the entire tile. Branches cross at different angles.
  for (let i = 0; i < (layer === 0 ? 9 : 5); i++) {
    const x = i * (layer === 0 ? 53 : 108) - 20 + r() * 48,
      w = layer === 0 ? 9 + r() * 12 : 19 + r() * 18;
    const bend = (r() - 0.5) * 70;
    poly(c, trunk, [
      [x - w, 1024],
      [x - w * 0.5, 750],
      [x + bend - w * 0.4, 480],
      [x - w * 0.25, 220],
      [x - 4, 0],
      [x + 8, 0],
      [x + w * 0.4, 250],
      [x + bend + w * 0.6, 480],
      [x + w * 0.8, 750],
      [x + w, 1024],
    ]);
    for (let y = 50; y < 1030; y += 90 + r() * 65) {
      const sign = r() > 0.5 ? 1 : -1,
        ex = x + sign * (65 + r() * 100),
        ey = y - 35 - r() * 65;
      limb(c, trunk, x, y + 25, ex, ey, w * 0.7);
      limb(c, leaf, ex, ey, ex + sign * 24, ey - 36, 3);
      foliage(
        c,
        r,
        ex,
        ey,
        65 + r() * 75,
        leaf,
        layer === 0 ? p.far : p.leaf,
        layer === 1,
      );
      if (layer === 1)
        foliage(
          c,
          r,
          ex - sign * 24,
          ey + 12,
          45 + r() * 42,
          p.leaf,
          p.light,
          true,
        );
    }
    if (layer === 1) {
      for (let j = 0; j < 12; j++) {
        const yy = r() * 1024,
          xx = x + (r() - 0.5) * w;
        limb(c, p.leaf, xx, yy, xx + (r() - 0.5) * 10, yy + 28 + r() * 45, 1);
      }
      // Thin hanging vines, highlighted intermittently.
      const vx = x + w + 15;
      for (let yy = 0; yy < 1024; yy += 3)
        if (yy % 170 < 125)
          rect(c, p.light, vx + Math.sin(yy * 0.035) * 5, yy, 1, 3);
    }
  }
  t.refresh();
}
function makeSpace(scene, key, z, layer) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, 400, 1024),
    c = t.context,
    r = seededRandom(key),
    p = palettes[z];
  if (z === 2) {
    for (let i = 0; i < 8; i++) {
      const x = r() * 400,
        y = r() * 1024,
        col = layer ? p.mid : p.far;
      rect(c, col, x, y, 8, 190);
      rect(c, col, x - 24, y + 30, 60, 22);
      rect(c, col, x - 65, y + 38, 32, 2);
      rect(c, col, x + 38, y + 38, 32, 2);
      for (let j = 0; j < 4; j++) rect(c, p.sky, x - 61 + j * 7, y + 32, 5, 15);
      for (let j = 0; j < 3; j++) rect(c, p.mist, x + 2, y + 65 + j * 35, 2, 4);
    }
  } else {
    for (let i = 0; i < 26; i++) {
      const x = r() * 400,
        y = r() * 1024,
        w = 8 + r() * 34;
      poly(c, layer ? p.mid : p.far, [
        [x - w, y],
        [x - w * 0.7, y - w * 0.5],
        [x + w * 0.2, y - w * 0.6],
        [x + w * 0.7, y - w * 0.1],
        [x + w * 0.4, y + w * 0.4],
        [x - w * 0.2, y + w * 0.6],
      ]);
      if (z === 4) rect(c, p.light, x - w * 0.3, y - w * 0.45, w * 0.4, 1);
    }
  }
  t.refresh();
}

export function paintTerrain(scene) {
  const g = scene.terrain,
    level = scene.level;
  g.clear();
  for (const b of [...level.platforms, ...level.walls]) {
    const p = palettes[b.zone],
      r = seededRandom(level.seed + ":rock:" + b.id),
      left = Math.round(b.x - b.width / 2),
      y = Math.round(b.y),
      w = Math.round(b.width),
      h = b.height;
    const branch = ["branch", "bough"].includes(b.shape),
      panel = b.shape === "panel";
    const base = branch ? 0x3d3828 : p.rock;
    g.fillStyle(p.shade);
    g.fillRect(left, y, w, h);
    g.fillStyle(base);
    g.fillRect(left + 2, y, w - 4, h - 3);
    // Broken strata and bark grain; every stone pixel is inside a solid.
    for (let j = 0; j < (w * h) / 36; j++) {
      const xx = left + 2 + Math.floor((r() * (w - 6)) / 2) * 2,
        yy = y + 4 + Math.floor((r() * Math.max(1, h - 7)) / 2) * 2;
      g.fillStyle(r() > 0.5 ? p.shade : branch ? 0x5b4c31 : p.light, 0.65);
      g.fillRect(
        xx,
        yy,
        Math.min(w + left - xx - 2, 2 + Math.floor(r() * 4) * 2),
        2,
      );
    }
    if (b.kind === "mass") continue;
    g.fillStyle(branch ? 0x736244 : panel ? 0x9bbcb9 : p.moss);
    g.fillRect(left, y, w, 2);
    g.fillStyle(branch ? 0x887148 : panel ? 0x6d9997 : p.light);
    g.fillRect(left + 2, y + 2, w - 4, 2);
    if (panel) {
      g.fillStyle(0x162d3e);
      for (let x = left + 8; x < left + w - 8; x += 14)
        g.fillRect(x, y + 6, 10, h - 10);
      g.fillStyle(0x94d6c5);
      g.fillRect(left + 4, y + 6, 2, 4);
    } else {
      // Tufts are non-solid foliage, clearly distinct from the walking ledge.
      for (let x = left + 4; x < left + w - 4; x += 6 + Math.floor(r() * 12)) {
        g.fillStyle(branch ? 0x617545 : p.moss);
        g.fillRect(x, y - 2, 2, 4);
        if (r() > 0.5) g.fillRect(x + 2, y - 4, 2, 4);
        if (b.zone < 2 && r() > 0.5) {
          g.fillStyle(p.leaf);
          g.fillRect(x, y + h - 4, 4, 6 + Math.floor(r() * 5) * 2);
          g.fillStyle(p.light);
          g.fillRect(x, y + h - 2, 2, 4);
        }
      }
    }
    if (b.shape === "ruin" || b.shape === "arch") {
      g.fillStyle(p.shade);
      for (let xx = left + 18; xx < left + w; xx += 28)
        g.fillRect(xx, y + 6, 2, h - 7);
      g.fillStyle(p.moss);
      g.fillRect(left + 6, y + 8, 4, 2);
    }
    if (b.id === level.goal.id) {
      g.fillStyle(0xa5b3a5);
      g.fillRect(left + 6, y - 48, 2, 48);
      g.fillStyle(0xbe7181);
      g.fillRect(left + 8, y - 48, 20, 12);
      scene.heart(g, left + 18, y - 46, 0xffe6ba, 0.5);
    }
    // Route marks are small inlaid stones, never an outline around a platform.
    if (b.route) {
      g.fillStyle(b.route === "left" ? 0xe0ae74 : 0x83c7bc);
      g.fillRect(Math.round(b.x) - 2, y + 6, 4, 2);
    }
  }
}

const voices = [
  [
    "Cuidadora del sendero",
    "Prueba la carga. Las ramas cortas piden saltos medidos.",
  ],
  [
    "Vigía del dosel",
    "Mira el próximo apoyo antes de soltar. El viento solo mueve las hojas.",
  ],
  [
    "La cartógrafa",
    "Desde los descansos puedes cambiar de ruta. Sigue tu propia luz.",
  ],
  [
    "Radio de exploración",
    "Aquí también llegaron otros. Respira antes de saltar.",
  ],
  ["Faro lunar", "Ella dejó una luz encendida para ti. Ya falta poco."],
];
export class LivingWorld {
  constructor(scene, reduced) {
    this.s = scene;
    this.reduced = reduced;
    this.time = 0;
    this.zone = -1;
    this.layers = [];
    this.ambient = scene.add.graphics().setScrollFactor(0).setDepth(-7);
    this.creatures = scene.add.graphics().setDepth(2);
    this.bubble = scene.add
      .text(0, 0, "", {
        fontFamily: "Courier New",
        fontSize: "12px",
        color: "#f0e9d2",
        backgroundColor: "#14271fee",
        padding: { x: 10, y: 8 },
        align: "center",
        wordWrap: { width: 240 },
      })
      .setOrigin(0.5, 1)
      .setDepth(8)
      .setVisible(false);
  }
  rebuild() {
    const l = this.s.level;
    this.habitats = [
      {
        x: l.kind === "training" ? 184 : 478,
        y: l.ground,
        zone: 0,
        npc: true,
        camp: true,
      },
    ];
    for (const p of l.platforms) {
      if (
        (p.kind === "hub" && p.id !== l.goal.id && p.room % 3 === 1) ||
        (l.kind === "training" &&
          p.id > 0 &&
          p.id % 5 === 0 &&
          p.id !== l.goal.id)
      )
        this.habitats.push({
          x: p.x + Math.min(24, p.width * 0.2),
          y: p.y,
          zone: p.zone,
          npc: true,
          camp: p.zone < 2,
        });
      else if (p.id > 0 && (p.id % 4 === 1 || p.id % 11 === 0))
        this.habitats.push({
          x: p.x - p.width * 0.25,
          y: p.y,
          zone: p.zone,
          npc: false,
          species: p.id % 3,
        });
    }
    this.zone = -1;
    this.bubble.setVisible(false);
  }
  sky(zone) {
    this.zone = zone;
    this.layers.forEach((l) => l.destroy());
    this.layers = [];
    const s = this.s,
      g = s.sky,
      h = s.scale.gameSize.height,
      p = palettes[zone];
    g.clear();
    g.fillStyle(p.sky);
    g.fillRect(0, 0, 800, h);
    // Dithered haze bands, in an intentionally small palette.
    for (let y = 0; y < h; y += 8) {
      g.fillStyle(p.mist, 0.06 + (y / h) * 0.12);
      g.fillRect(0, y, 800, 8);
    }
    if (zone < 2) {
      g.fillStyle(0xd6d4a1, 0.07);
      g.fillPoints(
        [
          { x: 470, y: 0 },
          { x: 510, y: 0 },
          { x: 190, y: h },
          { x: 70, y: h },
        ],
        true,
      );
    } else {
      const r = seededRandom("stars" + zone);
      for (let i = 0; i < 90; i++) {
        g.fillStyle(i % 8 ? 0x8b9cae : 0xe6cfab, 0.55);
        g.fillRect(
          Math.floor(r() * 400) * 2,
          Math.floor((r() * h) / 2) * 2,
          2,
          i % 8 ? 2 : 4,
        );
      }
    }
    // The Moon stays part of the story, progressively revealed above the canopy.
    const mx = 652,
      my = Math.min(138, h * 0.2),
      rad = zone < 2 ? 27 : 43;
    g.fillStyle(zone < 2 ? 0xd5d9bc : 0xc9cabc, 0.75);
    for (let yy = -rad; yy < rad; yy += 2) {
      const half = Math.floor(Math.sqrt(rad * rad - yy * yy) / 2) * 2;
      g.fillRect(mx - half, my + yy, half * 2, 2);
    }
    g.fillStyle(p.sky, 0.25);
    g.fillRect(mx + 10, my - 18, 10, 8);
    g.fillRect(mx - 18, my + 10, 8, 6);
    for (let layer = 0; layer < 2; layer++) {
      const key = "landscape-" + zone + "-" + layer;
      if (zone < 2) makeForest(s, key, zone, layer);
      else makeSpace(s, key, zone, layer);
      this.layers.push(
        s.add
          .tileSprite(0, 0, 400, Math.ceil(h / 2) + 2, key)
          .setOrigin(0)
          .setScale(2)
          .setScrollFactor(0)
          .setDepth(layer ? -12 : -18),
      );
    }
    document.getElementById("stage").classList.add("night");
  }
  update(delta) {
    const s = this.s;
    if (!this.reduced && (s.state === "playing" || s.state === "ready"))
      this.time += Math.min(delta, 100);
    const t = this.time / 1000,
      cam = s.cameras.main.scrollY,
      h = s.scale.gameSize.height,
      z = Math.max(0, s.zone);
    this.layers.forEach((layer, i) => {
      layer.tilePositionY = cam * (i ? 0.2 : 0.075);
      layer.tilePositionX = this.reduced
        ? 0
        : Math.round(Math.sin(t * 0.25 + i) * 1.5);
    });
    const g = this.ambient,
      p = palettes[z];
    g.clear();
    const mod = (n, m) => ((n % m) + m) % m;
    // Leaves drift on a separate plane; fireflies, mist and distant birds move.
    for (let i = 0; i < 26; i++) {
      const x =
          Math.floor(
            mod(i * 137 + t * (z < 2 ? 9 : 2) + Math.sin(t + i) * 8, 800) / 2,
          ) * 2,
        y =
          Math.floor(mod(i * 91 + t * (z < 2 ? 11 : -5) - cam * 0.13, h) / 2) *
          2;
      g.fillStyle(
        z < 2 ? (i % 4 ? p.moss : 0xe4ce83) : 0xb3c4cc,
        i % 4 ? 0.32 : 0.7,
      );
      g.fillRect(x, y, i % 4 ? 4 : 2, 2);
      if (i % 4 === 0) {
        g.fillStyle(0xd8df92, 0.05);
        g.fillRect(x - 4, y - 4, 10, 10);
      }
    }
    if (z < 2)
      for (let i = 0; i < 3; i++) {
        const x = mod(i * 330 + t * 23, 900) - 50,
          y = mod(i * 83 + 70 - cam * 0.04, Math.max(150, h * 0.6));
        g.fillStyle(p.ink, 0.6);
        g.fillRect(x, y, 6, 2);
        g.fillRect(x - 4, y + (Math.floor(t * 4 + i) % 2 ? -2 : 2), 4, 2);
        g.fillRect(x + 6, y - 2, 4, 2);
      }
    const c = this.creatures;
    c.clear();
    let nearby = null;
    for (const a of this.habitats) {
      if (a.y < cam - 100 || a.y > cam + h + 100) continue;
      if (a.npc) {
        this.npc(c, a, t);
        if (a.camp) this.camp(c, a.x - 30, a.y, t);
        if (Math.abs(s.pilot.x - a.x) < 86 && Math.abs(s.pilot.y - a.y) < 48)
          nearby = a;
      } else this.animal(c, a, t);
    }
    if (nearby && s.state === "playing") {
      const v = voices[nearby.zone];
      const scale = Math.min(
        1.8,
        Math.max(1, 800 / document.getElementById("game").clientWidth),
      );
      this.bubble.setText(v[0] + "\n" + v[1]).setScale(scale);
      const margin = this.bubble.displayWidth / 2 + 12;
      this.bubble
        .setPosition(
          Math.max(margin, Math.min(800 - margin, nearby.x)),
          nearby.y - 54,
        )
        .setVisible(true);
    } else this.bubble.setVisible(false);
  }
  npc(g, a, t) {
    const x = Math.round(a.x),
      y = a.y,
      b = Math.floor(t * 1.5) % 2;
    const r = (col, xx, yy, w, h) => {
      g.fillStyle(col);
      g.fillRect(x + xx, y + yy, w, h);
    };
    r(0x15251f, -11, -26, 22, 26);
    r(a.zone < 2 ? 0x665b45 : 0x758a8d, -9, -24, 18, 22);
    r(a.zone < 2 ? 0xa5a27a : 0xb3c8c1, -7, -36, 14, 14);
    r(0x233630, -5, -32, 12, 8);
    r(0xe0d49e, 1, -30, 4, 2);
    r(0x394638, -9, -6, 7, 6);
    r(0x394638, 4, -6, 7, 6);
    r(0x87785a, 10, -27, 3, 27);
    r(0xdec38b, 10, -23 - b, 6, 6);
    r(0xe5dfb0, 12, -21 - b, 2, 2);
    if (a.zone >= 2) {
      r(0x83bdb2, -7, -18, 6, 4);
      r(0x343d43, -3, -43, 2, 7);
      r(0xd5a37b, -5, -45, 4, 2);
    }
  }
  camp(g, x, y, t) {
    g.fillStyle(0x806347);
    g.fillRect(x - 10, y - 4, 20, 4);
    g.fillRect(x - 7, y - 6, 14, 4);
    const frame = Math.floor(t * 8) % 3;
    g.fillStyle(0xc25e30);
    g.fillRect(x - 6, y - 12, 12, 8);
    g.fillRect(x - 4 + frame * 2, y - 20 - frame * 2, 4, 12);
    g.fillStyle(0xefb64d);
    g.fillRect(x - 4, y - 12, 8, 6);
    g.fillRect(x - 2, y - 16 - frame * 2, 4, 8);
    g.fillStyle(0xf9de8a);
    g.fillRect(x - 2, y - 9, 4, 4);
    for (let i = 0; i < 3; i++) {
      const yy = (t * 12 + i * 12) % 38;
      g.fillStyle(0xe7c98c, 0.23 * (1 - yy / 40));
      g.fillRect(
        x - 2 + Math.floor(Math.sin(yy * 0.3) * 3) * 2,
        y - 24 - yy,
        4,
        4,
      );
    }
  }
  animal(g, a, t) {
    const flutter = Math.floor(t * 5 + a.x) % 2,
      x = Math.round(a.x),
      y = a.y;
    g.fillStyle(a.zone < 2 ? 0x111f21 : 0x859994);
    if (a.zone < 2) {
      if (a.species === 0) {
        // A tiny fox, ears and a white-tipped tail.
        g.fillStyle(0xa46e42);
        g.fillRect(x - 7, y - 10, 16, 8);
        g.fillRect(x + 5, y - 16, 8, 10);
        g.fillRect(x + 5, y - 20, 2, 6);
        g.fillRect(x + 11, y - 18, 2, 4);
        g.fillRect(x - 14, y - 8, 10, 4);
        g.fillStyle(0xd3c9a5);
        g.fillRect(x - 16, y - 8, 4, 4);
      } else {
        // Bird bobbing its head on a bough.
        g.fillRect(x - 6, y - 10, 14, 8);
        g.fillRect(x + 4, y - 16 + flutter * 2, 8, 8);
        g.fillRect(x - 12, y - 4, 8, 2);
        g.fillStyle(0x67978d);
        g.fillRect(x + 5, y - 15 + flutter * 2, 6, 2);
        g.fillStyle(0xb9a778);
        g.fillRect(x + 12, y - 10 + flutter * 2, 4, 2);
      }
      g.fillStyle(0x101d21);
      g.fillRect(x + 9, y - 12 + flutter * 2, 2, 2);
      g.fillRect(x - 4, y - 2, 2, 2);
      g.fillRect(x + 4, y - 2, 2, 2);
    } else {
      // Small maintenance bots and lunar terrarium sprouts.
      g.fillRect(x - 8, y - 14, 16, 10);
      g.fillRect(x - 6, y - 4, 4, 4);
      g.fillRect(x + 4, y - 4, 4, 4);
      g.fillStyle(flutter ? 0xa4d6b7 : 0x628e88);
      g.fillRect(x - 4, y - 10, 8, 2);
      g.fillStyle(0x466657);
      g.fillRect(x - 1, y - 22, 2, 8);
      g.fillRect(x - 6, y - 23, 6, 2);
      g.fillRect(x + 1, y - 25, 6, 2);
    }
  }
}
