import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD,
  Astronaut,
  PLATFORMS,
  trainingLevel,
  generateCampaign,
  jumpSpeed,
  formatTime,
  readBest,
  writeBest,
  readUnlock,
  writeUnlock,
  campaignBestKey,
} from "../src/model.js";
const empty = {};
function jump(a, ticks, dir = 1) {
  for (let i = 0; i < ticks; i++) a.step({ jump: true });
  a.step({ left: dir < 0, right: dir > 0 });
}
function finish(a, max = 400) {
  for (let i = 0; i < max && !a.grounded; i++) a.step(empty);
}
test("original 25-platform map is preserved as separate training", () => {
  const t = trainingLevel();
  assert.equal(t.platforms, PLATFORMS);
  assert.equal(t.platforms.length, 26);
  assert.equal(t.goal.id, 25);
  assert.equal(t.ground, 3240);
  const a = new Astronaut(t);
  for (let i = 1; i < t.platforms.length; i++) {
    const p = t.platforms[i],
      dir = Math.sign(p.x - a.x),
      launch = p.x - dir * 208;
    for (let n = 0; Math.abs(launch - a.x) > 1.3 && n < 250; n++)
      a.step({ left: launch < a.x, right: launch > a.x });
    jump(a, 96, dir);
    finish(a);
    assert.equal(a.platformId, p.id, `training jump ${i}`);
  }
  assert.equal(a.jumps, 25);
  assert.equal(a.falls, 0);
});
test("charge is bounded and direction cannot change after launch", () => {
  assert.equal(jumpSpeed(-1), 250);
  assert.equal(jumpSpeed(2), 690);
  const a = new Astronaut(trainingLevel());
  jump(a, 300);
  assert.equal(a.charge, 1);
  a.step({ left: true });
  assert.equal(a.vx, 250);
  const short = new Astronaut(trainingLevel());
  jump(short, 3, 0);
  assert.ok(short.vy > a.vy);
});
test("continuous collision stops terminal-speed falls on thin platforms", () => {
  const level = {
    ground: 500,
    height: 600,
    spawn: 100,
    platforms: [
      { id: 0, x: 400, y: 500, width: 800, height: 1 },
      { id: 1, x: 200, y: 200, width: 40, height: 1 },
    ],
  };
  const a = new Astronaut(level, 200, 100);
  a.grounded = false;
  a.vy = 1100;
  a.step({}, 0.2);
  assert.equal(a.y, 200);
  assert.equal(a.platformId, 1);
  assert.ok(a.grounded);
});
test("solid underside cancels upward velocity and walls reflect airborne motion", () => {
  const a = new Astronaut(trainingLevel(), 300, 3240);
  jump(a, 96, 0);
  let top = 3240;
  for (let i = 0; i < 150; i++) {
    a.step({});
    top = Math.min(top, a.y - WORLD.playerH);
  }
  assert.ok(top >= 3144 - 1e-5);
  const b = new Astronaut(trainingLevel(), 780, 3020);
  b.grounded = false;
  b.vx = 250;
  b.vy = -100;
  for (let i = 0; i < 20; i++) b.step({});
  assert.ok(b.vx < 0);
  assert.ok(b.x <= 789);
});
test("walking off an edge falls continuously without a respawn", () => {
  const level = {
    ground: 500,
    height: 560,
    spawn: 200,
    platforms: [
      { id: 0, x: 400, y: 500, width: 800, height: 24 },
      { id: 1, x: 200, y: 200, width: 100, height: 24 },
    ],
  };
  const a = new Astronaut(level, 200, 200);
  a.platformId = 1;
  for (let i = 0; i < 500; i++) a.step({ left: true });
  assert.ok(a.y > 200);
  assert.ok(a.falls >= 1);
  assert.ok(a.grounded);
  assert.equal(a.y, 500);
});
test("1000 seeds have solid-collision witnesses for all 40 jumps", () => {
  for (let i = 0; i < 1000; i++) {
    const level = generateCampaign(String(i));
    assert.equal(level.platforms.length, 41);
    for (let zone = 1; zone < 5; zone++) {
      const before = level.platforms.filter((p) => p.id && p.zone === zone - 1),
        after = level.platforms.filter((p) => p.zone === zone);
      assert.ok(
        Math.max(...after.map((p) => p.width)) <
          Math.min(...before.map((p) => p.width)),
      );
    }
  }
});
test("same seed reproduces geometry and different seeds vary height and route", () => {
  assert.deepEqual(generateCampaign("LUNA"), generateCampaign("LUNA"));
  assert.notDeepEqual(
    generateCampaign("LUNA").platforms,
    generateCampaign("ORBITA").platforms,
  );
});
test("campaign witnesses also work in one continuous route with no repositioning", () => {
  for (const seed of ["LUNA", "ORBITA", "1", "127", "ROMANCE"]) {
    const level = generateCampaign(seed),
      a = new Astronaut(level);
    for (const p of level.platforms.slice(1)) {
      jump(a, p.witness.ticks, p.witness.dir);
      finish(a);
      assert.equal(a.platformId, p.id, `${seed}/${p.id}`);
    }
    assert.equal(a.jumps, 40);
    assert.equal(a.falls, 0);
  }
});
test("formatting and storage tolerate corrupt/denied data; records are per seed", () => {
  assert.equal(formatTime(61000), "01:01");
  assert.equal(formatTime(3600000), "60:00");
  for (const value of [null, "NaN", "0", "-9", "Infinity"])
    assert.equal(readBest({ getItem: () => value }), null);
  const blocked = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  assert.equal(readBest(blocked), null);
  assert.equal(readUnlock(blocked), false);
  assert.doesNotThrow(() => writeBest(blocked, 5));
  assert.doesNotThrow(() => writeUnlock(blocked));
  assert.notEqual(campaignBestKey("A"), campaignBestKey("B"));
});
