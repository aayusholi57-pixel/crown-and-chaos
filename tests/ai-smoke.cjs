"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

let now = 0;
let nextFrame = null;
let rafId = 1;
const noop = () => {};
const context2d = new Proxy({}, {
  get(target, key) {
    if (key === "createLinearGradient") return () => ({ addColorStop: noop });
    if (key === "measureText") return () => ({ width: 0 });
    return target[key] || noop;
  },
  set(target, key, value) { target[key] = value; return true; }
});
const canvas = {
  id: "", width: 1, height: 1, style: {},
  setAttribute: noop, addEventListener: noop,
  getContext: () => context2d
};
const arena = {
  appendChild: noop,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 520 })
};
const windowObject = {
  devicePixelRatio: 1,
  CrownGame: { onCastleDamage: noop, onUnitSelected: noop, onBattleStats: noop }
};
const sandbox = {
  window: windowObject,
  document: {
    getElementById: id => id === "arena" ? arena : null,
    createElement: tag => tag === "canvas" ? canvas : {}
  },
  ResizeObserver: class { observe() {} },
  requestAnimationFrame: callback => { nextFrame = callback; return rafId++; },
  performance: { now: () => now },
  console
};

const source = fs.readFileSync(require("node:path").join(__dirname, "..", "game2d.js"), "utf8");
vm.runInNewContext(source, sandbox, { filename: "game2d.js" });
const engine = windowObject.Crown2D;
assert.ok(engine, "2D engine should initialize");
engine.deployArmy("red", 10, "soldier");
engine.deployArmy("blue", 10, "soldier");
const before = engine.getStats();
assert.equal(before.red, 10);
assert.equal(before.blue, 10);
engine.setDifficulty("veteran");
engine.beginBattle();

for (let frame = 0; frame < 210; frame++) {
  now += 1000 / 60;
  const callback = nextFrame;
  assert.equal(typeof callback, "function", "animation loop should schedule its next frame");
  nextFrame = null;
  callback(now);
}

const after = engine.getStats();
assert.equal(after.difficulty, "veteran");
assert.equal(after.redPlan, "ENGAGE");
assert.equal(after.bluePlan, "ENGAGE");
assert.ok(after.redAvgX > before.redAvgX + 100, "red army should automatically advance");
assert.ok(after.blueAvgX < before.blueAvgX - 100, "blue army should automatically advance");
console.log("AI smoke test passed: both 10-unit armies acquired the battle and marched toward each other.");
