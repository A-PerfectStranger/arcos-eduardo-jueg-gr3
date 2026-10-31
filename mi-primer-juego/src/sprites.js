// Frame rectangles over the original transparent, generated artwork.
// Rendering uses a shared feet anchor. Hitboxes live exclusively in model.js.
export const SPRITE_FRAMES = {
  idle: [14, 276, 274, 374, 44],
  walk1: [309, 278, 299, 372, 44],
  walk2: [14, 276, 274, 374, 44],
  charge: [633, 366, 295, 284, 34],
  jump: [929, 179, 320, 472, 54],
  fall: [13, 727, 322, 358, 44],
  land: [305, 815, 326, 301, 34],
  beloved: [641, 776, 258, 346, 44],
  reunion: [908, 771, 344, 353, 48],
};
export function makeSprites(scene) {
  const texture = scene.textures.get("astronaut-art");
  for (const [name, [x, y, w, h]] of Object.entries(SPRITE_FRAMES))
    texture.add(name, 0, x, y, w, h);
}
export function showSprite(sprite, frame) {
  const [, , w, h, size] = SPRITE_FRAMES[frame];
  sprite
    .setTexture("astronaut-art", frame)
    .setDisplaySize((size * w) / h, size);
}
