// Native 16 × 24 art, drawn one pixel at a time. No filtering, trims or
// pose-dependent bounds: bottom row 23 is the boots in every animation.
export const SPRITE_SIZE = { width: 16, height: 24, scale: 2 };
export const STATES = [
  "idle",
  "walk1",
  "walk2",
  "charge",
  "jump",
  "fall",
  "land",
  "wave",
];
const C = {
  ink: "#10182b",
  dark: "#26344d",
  shade: "#637b91",
  white: "#e5e3c9",
  light: "#fff0cb",
  teal: "#76c7bf",
  glass: "#254961",
  pink: "#d9879b",
  rust: "#a85c65",
  skin: "#dda57c",
  hair: "#594752",
  orange: "#e8aa68",
  blue: "#729bb5",
};
export function spritePixels(role, state) {
  const pixels = Array.from({ length: 24 }, () => Array(16).fill(null));
  const r = (color, x, y, w, h) => {
    for (let yy = Math.max(0, y); yy < Math.min(24, y + h); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(16, x + w); xx++)
        pixels[yy][xx] = C[color];
  };
  const crouch = state === "charge" || state === "land",
    dy = crouch ? 4 : 0,
    training = role === "cadet",
    lover = role === "beloved";
  // Identical boot contacts for every frame; one boot rises during a walk.
  r("ink", 4, 19, 4, 5);
  r("ink", 9, 19, 4, 5);
  r(training ? "blue" : "shade", 5, 18, 2, 4);
  r(training ? "blue" : "white", 10, 18, 2, 4);
  if (state === "walk1") {
    r("ink", 3, 22, 5, 2);
    r("ink", 9, 21, 5, 2);
  } else if (state === "walk2") {
    r("ink", 4, 21, 4, 2);
    r("ink", 10, 22, 4, 2);
  } else {
    r("ink", 4, 22, 4, 2);
    r("ink", 9, 22, 5, 2);
  }
  r("shade", 4, 23, 4, 1);
  r("shade", 9, 23, 5, 1);
  if (!training) {
    r("ink", 1, 11 + dy, 4, 8 - dy);
    r("shade", 2, 12 + dy, 2, 5 - dy);
    r("pink", 2, 12 + dy, 2, 1);
  }
  r("ink", 4, 12 + dy, 9, 8 - dy);
  r(training ? "orange" : lover ? "pink" : "white", 5, 12 + dy, 7, 7 - dy);
  r(training ? "rust" : "shade", 5, 18, 7, 2);
  r(training ? "blue" : "teal", 6, 14 + dy, 5, 2);
  r("light", 7, 15 + dy, 1, 1);
  r("rust", 10, 15 + dy, 1, 1);
  if (training) {
    r("ink", 4, 4 + dy, 9, 8);
    r("hair", 5, 5 + dy, 7, 4);
    r("blue", 4, 4 + dy, 8, 3);
    r("teal", 3, 6 + dy, 11, 1);
    r("skin", 6, 8 + dy, 7, 4);
    r("ink", 11, 8 + dy, 1, 1);
    r("hair", 5, 8 + dy, 2, 3);
    r("orange", 6, 12 + dy, 5, 1);
  } else {
    r("ink", 3, 3 + dy, 11, 10);
    r("white", 4, 3 + dy, 9, 9);
    r("white", 3, 5 + dy, 11, 5);
    r("shade", 5, 4 + dy, 8, 7);
    r("glass", 6, 5 + dy, 7, 5);
    r(lover ? "orange" : "teal", 7, 5 + dy, 5, 2);
    r("light", 7, 5 + dy, 2, 1);
    r("ink", 6, 10 + dy, 7, 1);
    r("pink", 4, 12 + dy, 9, 2);
    r("rust", 1, 13 + dy, 4, 2);
    r("pink", 0, 14 + dy, 3, 1);
  }
  const raised = state === "fall" || state === "wave",
    arm = raised ? 10 : state === "jump" ? 12 : 15 + Math.floor(dy / 2);
  r("ink", 12, arm, 3, 6);
  r(training ? "orange" : lover ? "pink" : "white", 12, arm, 2, 4);
  r(training ? "skin" : "light", 12, arm + 4, 2, 2);
  if (raised) {
    r("ink", 1, 10, 3, 4);
    r(training ? "skin" : "white", 1, 9, 2, 3);
  }
  return pixels;
}
function draw(ctx, pixels, ox = 0, oy = 0) {
  for (let y = 0; y < pixels.length; y++)
    for (let x = 0; x < pixels[y].length; x++)
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
}
export function makeSprites(scene) {
  const atlas = scene.textures.createCanvas("retro-atlas", 16 * 8, 24 * 3),
    ac = atlas.context;
  ["cadet", "astronaut", "beloved"].forEach((role, row) =>
    STATES.forEach((state, col) => {
      const pixels = spritePixels(role, state),
        texture = scene.textures.createCanvas(`pixel-${role}-${state}`, 16, 24);
      draw(texture.context, pixels);
      texture.refresh();
      draw(ac, pixels, col * 16, row * 24);
    }),
  );
  atlas.refresh();
  const reunion = scene.textures.createCanvas("pixel-reunion", 32, 24);
  draw(reunion.context, spritePixels("astronaut", "idle"), 0, 0);
  // Mirror the beloved to face the astronaut, preserving the same foot row.
  draw(
    reunion.context,
    spritePixels("beloved", "idle").map((row) => [...row].reverse()),
    16,
    0,
  );
  reunion.refresh();
}
export function showSprite(sprite, frame, role = "astronaut") {
  if (frame === "beloved") {
    role = "beloved";
    frame = "idle";
  }
  sprite
    .setTexture(
      frame === "reunion" ? "pixel-reunion" : `pixel-${role}-${frame}`,
    )
    .setScale(SPRITE_SIZE.scale);
}
