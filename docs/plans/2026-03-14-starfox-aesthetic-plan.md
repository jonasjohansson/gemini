# Star Fox SNES Aesthetic (v4) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a new v4 of Gemini using Three.js with SNES Star Fox flat-shaded polygon 3D aesthetics, keeping the twin-world and perspective-switch mechanics from v3.

**Architecture:** Single Three.js WebGLRenderer with two scissored viewports (top/bottom). Each world has its own Scene and Camera. Procedural low-poly geometry for all game objects. Simple AABB collision detection in 3D space. Game loop via requestAnimationFrame with delta time.

**Tech Stack:** Three.js (already installed), vanilla JS ES modules, Vite dev server.

---

### Task 1: Boot file and renderer setup

**Files:**
- Create: `src/v4/boot.js`
- Modify: `src/main.js`

**Step 1: Create `src/v4/boot.js`**

```js
import * as THREE from 'three';
import { Game } from './Game.js';

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Crisp pixels, no smoothing
renderer.autoClear = false;
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const game = new Game(renderer);

let prev = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;
  game.update(dt);
  game.render();
}
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.onResize();
});
```

**Step 2: Add v4 route to `src/main.js`**

Add an `else if (version === '4')` branch that imports `./v4/boot.js`. Also change the default version to `'4'`.

```js
const version = params.get('v') || '4';
// ...
} else if (version === '4') {
  import('./v4/boot.js');
} else {
  import('./v3/boot.js');
}
```

**Step 3: Commit**

```bash
git add src/v4/boot.js src/main.js
git commit -m "feat(v4): add Three.js boot file and version routing"
```

---

### Task 2: Procedural geometry models

**Files:**
- Create: `src/v4/models.js`

**Step 1: Create `src/v4/models.js`**

This file exports factory functions that return Three.js meshes using procedural geometry. All models use flat-shaded `MeshLambertMaterial`. Star Fox SNES color palette.

```js
import * as THREE from 'three';

// SNES Star Fox palette
const COLORS = {
  shipBody: 0x8888aa,
  shipWing: 0x6666ff,
  shipNose: 0xccccdd,
  obsSide: 0xcc6622,    // orange — passable in side view
  obsTop: 0x2266cc,     // blue — passable in top view
  obsWire: 0x446688,    // wireframe color for passable
  enemy: 0xcc2222,
  enemyWing: 0x881111,
  bullet: 0x44ff44,
  enemyBullet: 0xff4444,
  groundA: 0x338833,
  groundB: 0x226622,
  mountain: 0x556655,
  sky: 0x4488cc,
};

export { COLORS };

export function createShip() {
  const group = new THREE.Group();

  // Fuselage — elongated octahedron-ish
  const bodyGeo = new THREE.ConeGeometry(0.3, 1.8, 4);
  bodyGeo.rotateX(-Math.PI / 2);
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.shipBody, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
  noseGeo.rotateX(-Math.PI / 2);
  const noseMat = new THREE.MeshLambertMaterial({ color: COLORS.shipNose, flatShading: true });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.z = -1.0;
  group.add(nose);

  // Wings — flat triangular prisms
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(-1.2, -0.3);
  wingShape.lineTo(-0.2, 0);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
  const wingMat = new THREE.MeshLambertMaterial({ color: COLORS.shipWing, flatShading: true });

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.1, 0, 0.2);
  group.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat.clone());
  wingR.scale.x = -1;
  wingR.position.set(0.1, 0, 0.2);
  group.add(wingR);

  return group;
}

export function createObstacle(type) {
  // type: 'S' (side-passable, orange) or 'T' (top-passable, blue)
  const color = type === 'S' ? COLORS.obsSide : COLORS.obsTop;

  const group = new THREE.Group();

  // Column/pillar shape
  const geo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Top pyramid cap
  const capGeo = new THREE.ConeGeometry(0.85, 0.8, 4);
  const capMat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.65;
  group.add(cap);

  // Store original materials for perspective switching
  group.userData.solidMaterials = [mat, capMat];
  group.userData.type = type;

  return group;
}

export function createObstacleWireframe(type) {
  const group = new THREE.Group();

  const geo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
  const mat = new THREE.MeshBasicMaterial({
    color: COLORS.obsWire, wireframe: true, transparent: true, opacity: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const capGeo = new THREE.ConeGeometry(0.85, 0.8, 4);
  const capMat = new THREE.MeshBasicMaterial({
    color: COLORS.obsWire, wireframe: true, transparent: true, opacity: 0.4,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.65;
  group.add(cap);

  group.userData.wireframeMaterials = [mat, capMat];
  group.userData.type = type;

  return group;
}

export function createEnemy() {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.ConeGeometry(0.4, 1.2, 4);
  bodyGeo.rotateX(Math.PI / 2); // pointing toward player
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.enemy, flatShading: true });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Wings
  const wingGeo = new THREE.BoxGeometry(1.8, 0.05, 0.6);
  const wingMat = new THREE.MeshLambertMaterial({ color: COLORS.enemyWing, flatShading: true });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.z = 0.2;
  group.add(wings);

  return group;
}

export function createBullet() {
  const geo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.bullet });
  return new THREE.Mesh(geo, mat);
}

export function createEnemyBullet() {
  const geo = new THREE.SphereGeometry(0.12, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.enemyBullet });
  return new THREE.Mesh(geo, mat);
}

export function createExplosion() {
  // Particle group — flat polygon shards
  const group = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.TetrahedronGeometry(0.15);
    const mat = new THREE.MeshBasicMaterial({
      color: [0xffffff, 0xffff44, 0xff6600, 0xff2200][i % 4],
    });
    const shard = new THREE.Mesh(geo, mat);
    const angle = (i / 8) * Math.PI * 2;
    shard.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * (2 + Math.random() * 3),
      Math.sin(angle) * (2 + Math.random() * 3),
      (Math.random() - 0.5) * 2,
    );
    group.add(shard);
  }
  group.userData.age = 0;
  group.userData.maxAge = 0.5;
  return group;
}
```

**Step 2: Commit**

```bash
git add src/v4/models.js
git commit -m "feat(v4): procedural low-poly geometry models"
```

---

### Task 3: Scrolling checkerboard ground

**Files:**
- Create: `src/v4/ground.js`

**Step 1: Create `src/v4/ground.js`**

Generates a flat plane with a checkerboard pattern via vertex colors. Scrolls by shifting UV/position offset each frame.

```js
import * as THREE from 'three';
import { COLORS } from './models.js';

const GRID_SIZE = 40;   // number of tiles along each axis
const TILE_SIZE = 2;    // world units per tile

export function createGround() {
  const geo = new THREE.PlaneGeometry(
    GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE,
    GRID_SIZE, GRID_SIZE
  );
  geo.rotateX(-Math.PI / 2);

  // Vertex colors for checkerboard
  const colors = [];
  const colorA = new THREE.Color(COLORS.groundA);
  const colorB = new THREE.Color(COLORS.groundB);

  // PlaneGeometry with segments creates (GRID_SIZE+1)^2 vertices
  // We need face colors, so use a non-indexed geometry
  const nonIndexed = geo.toNonIndexed();
  const posAttr = nonIndexed.getAttribute('position');
  const count = posAttr.count;

  for (let i = 0; i < count; i += 6) {
    // Each quad = 2 triangles = 6 vertices
    // Determine which tile based on first vertex position
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const tileX = Math.floor((x + GRID_SIZE * TILE_SIZE / 2) / TILE_SIZE);
    const tileZ = Math.floor((z + GRID_SIZE * TILE_SIZE / 2) / TILE_SIZE);
    const c = (tileX + tileZ) % 2 === 0 ? colorA : colorB;

    for (let j = 0; j < 6; j++) {
      colors.push(c.r, c.g, c.b);
    }
  }

  nonIndexed.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(nonIndexed, mat);
  mesh.position.y = -2;

  return mesh;
}

export function updateGround(mesh, dt, speed) {
  mesh.position.z += speed * dt;
  // Wrap to prevent floating-point drift
  if (mesh.position.z > TILE_SIZE * 2) {
    mesh.position.z -= TILE_SIZE * 2;
  }
}

export function createMountains() {
  const group = new THREE.Group();

  // Simple polygon mountain range on the horizon
  for (let i = 0; i < 8; i++) {
    const h = 4 + Math.random() * 8;
    const w = 3 + Math.random() * 5;
    const geo = new THREE.ConeGeometry(w, h, 4 + Math.floor(Math.random() * 3));
    const shade = 0.3 + Math.random() * 0.15;
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(shade, shade + 0.05, shade),
      flatShading: true,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(-30 + i * 8 + Math.random() * 4, h / 2 - 2, -60);
    group.add(m);
  }

  return group;
}
```

**Step 2: Commit**

```bash
git add src/v4/ground.js
git commit -m "feat(v4): scrolling checkerboard ground and polygon mountains"
```

---

### Task 4: Game class — scene setup, dual viewports, HUD

**Files:**
- Create: `src/v4/Game.js`

**Step 1: Create `src/v4/Game.js`**

This is the main game class. Sets up two Three.js scenes with cameras, handles the split viewport rendering, input, HUD overlay, and ties everything together.

```js
import * as THREE from 'three';
import { createShip, createObstacle, createEnemy, createBullet, createEnemyBullet, createExplosion, COLORS } from './models.js';
import { createGround, updateGround, createMountains } from './ground.js';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

const LEVEL_SEGMENTS = [
  { at: 2, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 6, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 10, wall: [
    { y: 0.15, p: 'T' }, { y: 0.35, p: 'S' }, { y: 0.5, p: 'T' },
    { y: 0.65, p: 'S' }, { y: 0.85, p: 'T' },
  ]},
  { at: 13, wall: [
    { y: 0.15, p: 'S' }, { y: 0.35, p: 'T' }, { y: 0.5, p: 'S' },
    { y: 0.65, p: 'T' }, { y: 0.85, p: 'S' },
  ]},
  { at: 16, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 17.2, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 19, enemies: [{ y: 0.5, pattern: 'drift' }] },
  { at: 21, wall: [
    { y: 0.1, p: 'T' }, { y: 0.25, p: 'T' },
    { y: 0.5, p: 'S' },
    { y: 0.75, p: 'T' }, { y: 0.9, p: 'T' },
  ]},
  { at: 24, wall: [
    { y: 0.15, p: 'S' },
    { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 25.5, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' },
    { y: 0.85, p: 'T' },
  ]},
  { at: 27, wall: [
    { y: 0.15, p: 'S' },
    { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 29, enemies: [{ y: 0.3, pattern: 'drift' }, { y: 0.7, pattern: 'drift' }] },
  { at: 31, wall: [
    { y: 0.2, p: 'S' }, { y: 0.5, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 32, wall: [
    { y: 0.2, p: 'T' }, { y: 0.5, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 33, wall: [
    { y: 0.2, p: 'S' }, { y: 0.5, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 34, wall: [
    { y: 0.2, p: 'T' }, { y: 0.5, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  { at: 37, wall: [
    { y: 0.1, p: 'S' }, { y: 0.3, p: 'T' }, { y: 0.5, p: 'S' },
    { y: 0.7, p: 'T' }, { y: 0.9, p: 'S' },
  ]},
  { at: 38.5, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'T' },
    { y: 0.8, p: 'S' },
  ]},
  { at: 40, enemies: [{ y: 0.5, pattern: 'sine' }] },
  { at: 42, wall: [
    { y: 0.1, p: 'S' }, { y: 0.25, p: 'T' }, { y: 0.4, p: 'S' },
    { y: 0.55, p: 'T' }, { y: 0.7, p: 'S' }, { y: 0.85, p: 'T' },
  ]},
  { at: 44, wall: [
    { y: 0.1, p: 'T' }, { y: 0.25, p: 'S' }, { y: 0.4, p: 'T' },
    { y: 0.55, p: 'S' }, { y: 0.7, p: 'T' }, { y: 0.85, p: 'S' },
  ]},
  { at: 46, enemies: [{ y: 0.3, pattern: 'sine' }, { y: 0.7, pattern: 'sine' }] },
];
const LEVEL_LOOP = 50;

// Ship movement bounds in 3D space
const SHIP_X_RANGE = 6;   // +/- from center
const SHIP_Y_MIN = -1.5;
const SHIP_Y_MAX = 3;
const SHIP_Z = -2;         // ship z position (near camera)
const SPAWN_Z = -50;       // obstacles spawn far away
const DESPAWN_Z = 2;       // behind camera

export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.perspective = VIEW_SIDE;
    this.scrollSpeed = 12;
    this.levelTime = 0;
    this.segmentIndex = 0;
    this.loopCount = 0;
    this.score = 0;

    this.worldA = this.createWorld();
    this.worldB = this.createWorld();

    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    this.keys = {};
    this.keyJustPressed = {};
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.keyJustPressed[e.code] = true;
      this.keys[e.code] = true;
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.createHUD();
    this.onResize();
  }

  createWorld() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.sky);
    scene.fog = new THREE.Fog(COLORS.sky, 30, 55);

    // Lighting — simple directional like SNES
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Camera — slightly elevated, looking forward
    const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
    camera.position.set(0, 3, 4);
    camera.lookAt(0, 1, -20);

    // Ground
    const ground = createGround();
    scene.add(ground);

    // Mountains
    const mountains = createMountains();
    scene.add(mountains);

    // Player ship
    const ship = createShip();
    ship.position.set(0, 0.5, SHIP_Z);
    scene.add(ship);

    return {
      scene,
      camera,
      ground,
      mountains,
      ship,
      shipVelX: 0,
      shipVelY: 0,
      obstacles: [],    // { mesh, type, passableIn }
      enemies: [],      // { mesh, pattern, startY, time, shootCooldown }
      bullets: [],      // { mesh }
      enemyBullets: [], // { mesh }
      explosions: [],   // { group }
      aiShootCooldown: 0,
    };
  }

  createHUD() {
    const hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    document.body.appendChild(hud);
    this.hudEl = hud;

    // Divider bar
    const divider = document.createElement('div');
    divider.style.cssText = 'position:absolute;left:0;width:100%;height:40px;background:#000;display:flex;align-items:center;justify-content:center;border-top:2px solid #334;border-bottom:2px solid #334;';
    hud.appendChild(divider);
    this.dividerEl = divider;

    // Title
    const title = document.createElement('span');
    title.textContent = 'G E M I N I';
    title.style.cssText = 'font-family:monospace;font-size:14px;color:#4466aa;letter-spacing:4px;';
    divider.appendChild(title);

    // Perspective label
    const perspLabel = document.createElement('span');
    perspLabel.textContent = 'SIDE';
    perspLabel.style.cssText = 'font-family:monospace;font-size:11px;color:#ff8833;position:absolute;left:12px;';
    divider.appendChild(perspLabel);
    this.perspLabel = perspLabel;

    // Score
    const scoreLabel = document.createElement('span');
    scoreLabel.textContent = '0';
    scoreLabel.style.cssText = 'font-family:monospace;font-size:11px;color:#336699;position:absolute;right:12px;';
    divider.appendChild(scoreLabel);
    this.scoreLabel = scoreLabel;

    // Active twin label
    const twinLabel = document.createElement('span');
    twinLabel.textContent = 'TWIN A';
    twinLabel.style.cssText = 'font-family:monospace;font-size:10px;color:#44aaff;position:absolute;bottom:2px;';
    divider.appendChild(twinLabel);
    this.twinLabel = twinLabel;

    // Flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.05s;';
    hud.appendChild(flash);
    this.flashEl = flash;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const halfH = (h - 40) / 2; // 40px for divider
    const aspect = w / halfH;

    this.worldA.camera.aspect = aspect;
    this.worldA.camera.updateProjectionMatrix();
    this.worldB.camera.aspect = aspect;
    this.worldB.camera.updateProjectionMatrix();

    // Position divider
    this.dividerEl.style.top = `${halfH}px`;

    this.viewportTop = { x: 0, y: halfH + 40, w, h: halfH };    // World A (top of screen = bottom of GL)
    this.viewportBottom = { x: 0, y: 0, w, h: halfH };           // World B (bottom of screen = top of GL)
  }

  update(dt) {
    this.levelTime += dt;
    const speed = this.scrollSpeed + this.loopCount * 1.5;

    this.processLevel();

    // Player input
    const w = this.activeWorld;
    const moveSpeed = 8;
    const shipX = w.ship.position.x;
    const shipY = w.ship.position.y;

    if (this.keys['ArrowLeft']) w.ship.position.x = Math.max(shipX - moveSpeed * dt, -SHIP_X_RANGE);
    if (this.keys['ArrowRight']) w.ship.position.x = Math.min(shipX + moveSpeed * dt, SHIP_X_RANGE);
    if (this.keys['ArrowUp']) w.ship.position.y = Math.min(shipY + moveSpeed * dt, SHIP_Y_MAX);
    if (this.keys['ArrowDown']) w.ship.position.y = Math.max(shipY - moveSpeed * dt, SHIP_Y_MIN);

    // Ship tilt based on movement
    const targetRollX = this.keys['ArrowUp'] ? -0.15 : this.keys['ArrowDown'] ? 0.15 : 0;
    const targetRollZ = this.keys['ArrowLeft'] ? 0.4 : this.keys['ArrowRight'] ? -0.4 : 0;
    w.ship.rotation.x += (targetRollX - w.ship.rotation.x) * 8 * dt;
    w.ship.rotation.z += (targetRollZ - w.ship.rotation.z) * 8 * dt;

    if (this.keyJustPressed['Space']) this.fireBullet(w);
    if (this.keyJustPressed['ShiftLeft'] || this.keyJustPressed['ShiftRight']) this.switchPerspective();
    if (this.keyJustPressed['Tab']) this.swapActiveWorld();

    this.keyJustPressed = {};

    // Update both worlds
    this.updateWorld(this.worldA, dt, speed);
    this.updateWorld(this.worldB, dt, speed);

    // AI for inactive world
    this.updateAI(this.inactiveWorld, dt, speed);
  }

  processLevel() {
    const segTime = this.levelTime - this.loopCount * LEVEL_LOOP;
    while (
      this.segmentIndex < LEVEL_SEGMENTS.length &&
      LEVEL_SEGMENTS[this.segmentIndex].at <= segTime
    ) {
      const seg = LEVEL_SEGMENTS[this.segmentIndex];
      if (seg.wall) {
        seg.wall.forEach((d) => {
          this.spawnObstacle(this.worldA, d);
          this.spawnObstacle(this.worldB, d);
        });
      }
      if (seg.enemies) {
        seg.enemies.forEach((d) => {
          this.spawnEnemy(this.worldA, d);
          this.spawnEnemy(this.worldB, d);
        });
      }
      this.segmentIndex++;
    }
    if (segTime >= LEVEL_LOOP) { this.loopCount++; this.segmentIndex = 0; }
  }

  spawnObstacle(world, def) {
    const passableIn = def.p === 'S' ? VIEW_SIDE : VIEW_TOP;
    const mesh = createObstacle(def.p);
    // y: 0..1 maps to x: -SHIP_X_RANGE..+SHIP_X_RANGE
    const x = (def.y - 0.5) * 2 * SHIP_X_RANGE;
    mesh.position.set(x, 0, SPAWN_Z);
    mesh.userData.passableIn = passableIn;
    mesh.userData.type = def.p;
    world.scene.add(mesh);
    world.obstacles.push(mesh);
    this.updateObsMaterial(mesh);
  }

  spawnEnemy(world, def) {
    const mesh = createEnemy();
    const x = (def.y - 0.5) * 2 * SHIP_X_RANGE;
    mesh.position.set(x, 1, SPAWN_Z);
    mesh.userData.pattern = def.pattern;
    mesh.userData.startX = x;
    mesh.userData.time = 0;
    mesh.userData.shootCooldown = 2 + Math.random() * 2;
    world.scene.add(mesh);
    world.enemies.push(mesh);
  }

  updateObsMaterial(mesh) {
    const passable = mesh.userData.passableIn;
    const isPassable = this.perspective === passable;

    mesh.children.forEach((child) => {
      if (isPassable) {
        child.material = new THREE.MeshBasicMaterial({
          color: COLORS.obsWire, wireframe: true, transparent: true, opacity: 0.3,
        });
      } else {
        const color = mesh.userData.type === 'S' ? COLORS.obsSide : COLORS.obsTop;
        child.material = new THREE.MeshLambertMaterial({ color, flatShading: true });
      }
    });
  }

  updateWorld(world, dt, speed) {
    // Scroll ground
    updateGround(world.ground, dt, speed);

    // Move obstacles toward camera
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
      const obs = world.obstacles[i];
      obs.position.z += speed * dt;
      if (obs.position.z > DESPAWN_Z) {
        world.scene.remove(obs);
        world.obstacles.splice(i, 1);
      }
    }

    // Move enemies
    for (let i = world.enemies.length - 1; i >= 0; i--) {
      const e = world.enemies[i];
      e.userData.time += dt;
      const t = e.userData.time;

      e.position.z += speed * 0.4 * dt;

      if (e.userData.pattern === 'sine') {
        e.position.x = e.userData.startX + Math.sin(t * 2) * 3;
      } else {
        e.position.x = e.userData.startX + Math.sin(t * 1.5) * 1.5;
      }

      // Enemy shooting
      e.userData.shootCooldown -= dt;
      if (e.userData.shootCooldown <= 0) {
        this.enemyShoot(e, world);
        e.userData.shootCooldown = 3 + Math.random() * 2;
      }

      if (e.position.z > DESPAWN_Z) {
        world.scene.remove(e);
        world.enemies.splice(i, 1);
      }
    }

    // Move bullets
    for (let i = world.bullets.length - 1; i >= 0; i--) {
      const b = world.bullets[i];
      b.position.z -= 40 * dt;
      if (b.position.z < SPAWN_Z - 10) {
        world.scene.remove(b);
        world.bullets.splice(i, 1);
      }
    }

    // Move enemy bullets
    for (let i = world.enemyBullets.length - 1; i >= 0; i--) {
      const b = world.enemyBullets[i];
      b.position.z += 15 * dt;
      if (b.position.z > DESPAWN_Z + 5) {
        world.scene.remove(b);
        world.enemyBullets.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = world.explosions.length - 1; i >= 0; i--) {
      const exp = world.explosions[i];
      exp.userData.age += dt;
      if (exp.userData.age >= exp.userData.maxAge) {
        world.scene.remove(exp);
        world.explosions.splice(i, 1);
        continue;
      }
      const progress = exp.userData.age / exp.userData.maxAge;
      exp.children.forEach((shard) => {
        shard.position.add(shard.userData.velocity.clone().multiplyScalar(dt));
        shard.material.opacity = 1 - progress;
        shard.material.transparent = true;
      });
    }

    // Collision: bullets vs enemies
    for (let bi = world.bullets.length - 1; bi >= 0; bi--) {
      const b = world.bullets[bi];
      for (let ei = world.enemies.length - 1; ei >= 0; ei--) {
        const e = world.enemies[ei];
        if (b.position.distanceTo(e.position) < 1.5) {
          this.boom(e.position.clone(), world);
          world.scene.remove(b);
          world.bullets.splice(bi, 1);
          world.scene.remove(e);
          world.enemies.splice(ei, 1);
          this.score += 100;
          this.scoreLabel.textContent = this.score;
          break;
        }
      }
    }

    // Collision: ship vs obstacles
    const shipPos = world.ship.position;
    for (const obs of world.obstacles) {
      if (obs.userData.passableIn === this.perspective) continue;
      const dx = Math.abs(shipPos.x - obs.position.x);
      const dz = Math.abs(shipPos.z - obs.position.z);
      const dy = Math.abs(shipPos.y - obs.position.y);
      if (dx < 1.0 && dz < 0.8 && dy < 2.0) {
        this.boom(shipPos.clone(), world);
        this.hitShip(world);
        break;
      }
    }

    // Collision: ship vs enemies
    for (let i = world.enemies.length - 1; i >= 0; i--) {
      const e = world.enemies[i];
      if (shipPos.distanceTo(e.position) < 1.2) {
        this.boom(e.position.clone(), world);
        world.scene.remove(e);
        world.enemies.splice(i, 1);
        this.hitShip(world);
        break;
      }
    }

    // Collision: ship vs enemy bullets
    for (let i = world.enemyBullets.length - 1; i >= 0; i--) {
      const b = world.enemyBullets[i];
      if (shipPos.distanceTo(b.position) < 0.8) {
        this.boom(b.position.clone(), world);
        world.scene.remove(b);
        world.enemyBullets.splice(i, 1);
        this.hitShip(world);
        break;
      }
    }
  }

  fireBullet(world) {
    const b = createBullet();
    b.position.copy(world.ship.position);
    b.position.z -= 1;
    world.scene.add(b);
    world.bullets.push(b);
  }

  enemyShoot(enemy, world) {
    const b = createEnemyBullet();
    b.position.copy(enemy.position);
    b.position.z += 0.5;
    world.scene.add(b);
    world.enemyBullets.push(b);
  }

  boom(pos, world) {
    const exp = createExplosion();
    exp.position.copy(pos);
    world.scene.add(exp);
    world.explosions.push(exp);
  }

  hitShip(world) {
    // Flash the ship (blink visibility)
    let count = 0;
    const interval = setInterval(() => {
      world.ship.visible = !world.ship.visible;
      count++;
      if (count >= 16) {
        world.ship.visible = true;
        clearInterval(interval);
      }
    }, 50);
  }

  switchPerspective() {
    this.perspective = this.perspective === VIEW_SIDE ? VIEW_TOP : VIEW_SIDE;
    this.perspLabel.textContent = this.perspective === VIEW_SIDE ? 'SIDE' : 'TOP';
    this.perspLabel.style.color = this.perspective === VIEW_SIDE ? '#ff8833' : '#44aaff';

    // Update all obstacle materials in both worlds
    [this.worldA, this.worldB].forEach((w) => {
      w.obstacles.forEach((obs) => this.updateObsMaterial(obs));
    });

    // Flash effect
    this.flashEl.style.opacity = '0.3';
    setTimeout(() => { this.flashEl.style.opacity = '0'; }, 50);
  }

  swapActiveWorld() {
    if (this.activeWorld === this.worldA) {
      this.activeWorld = this.worldB;
      this.inactiveWorld = this.worldA;
      this.twinLabel.textContent = 'TWIN B';
      this.twinLabel.style.color = '#ff66aa';
    } else {
      this.activeWorld = this.worldA;
      this.inactiveWorld = this.worldB;
      this.twinLabel.textContent = 'TWIN A';
      this.twinLabel.style.color = '#44aaff';
    }
  }

  updateAI(world, dt, speed) {
    const ship = world.ship;
    const aiSpeed = 6;
    let targetX = 0;
    let targetY = 0.5;
    let shouldShoot = false;
    let nearestDist = Infinity;

    // Dodge obstacles
    for (const obs of world.obstacles) {
      if (obs.userData.passableIn === this.perspective) continue;
      const dz = obs.position.z - ship.position.z;
      if (dz < 0 && dz > -15 && Math.abs(dz) < nearestDist) {
        nearestDist = Math.abs(dz);
        targetX = obs.position.x > 0 ? obs.position.x - 2.5 : obs.position.x + 2.5;
        targetX = Math.max(-SHIP_X_RANGE, Math.min(SHIP_X_RANGE, targetX));
      }
    }

    // Dodge enemy bullets
    for (const b of world.enemyBullets) {
      if (Math.abs(b.position.z - ship.position.z) < 5 && Math.abs(b.position.x - ship.position.x) < 2) {
        targetX = ship.position.x + (b.position.x > ship.position.x ? -3 : 3);
        targetX = Math.max(-SHIP_X_RANGE, Math.min(SHIP_X_RANGE, targetX));
      }
    }

    // Aim at enemies
    for (const e of world.enemies) {
      const dz = e.position.z - ship.position.z;
      if (dz < 0 && dz > -25 && nearestDist > 8) {
        targetX = e.position.x;
        targetY = e.position.y;
        if (Math.abs(ship.position.x - e.position.x) < 1) shouldShoot = true;
      }
    }

    // Move toward target
    const dx = targetX - ship.position.x;
    const dy = targetY - ship.position.y;
    ship.position.x += Math.sign(dx) * Math.min(Math.abs(dx), aiSpeed * dt);
    ship.position.y += Math.sign(dy) * Math.min(Math.abs(dy), aiSpeed * dt);

    // Tilt
    ship.rotation.z += (-Math.sign(dx) * 0.3 - ship.rotation.z) * 5 * dt;

    // Shoot
    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world);
      world.aiShootCooldown = 0.45;
    }
  }

  render() {
    const gl = this.renderer;
    gl.setScissorTest(true);

    // World A — top half
    const vt = this.viewportTop;
    gl.setViewport(vt.x, vt.y, vt.w, vt.h);
    gl.setScissor(vt.x, vt.y, vt.w, vt.h);
    gl.render(this.worldA.scene, this.worldA.camera);

    // World B — bottom half
    const vb = this.viewportBottom;
    gl.setViewport(vb.x, vb.y, vb.w, vb.h);
    gl.setScissor(vb.x, vb.y, vb.w, vb.h);
    gl.render(this.worldB.scene, this.worldB.camera);

    gl.setScissorTest(false);
  }
}
```

**Step 2: Commit**

```bash
git add src/v4/Game.js
git commit -m "feat(v4): main Game class with dual viewports, input, HUD, collisions, AI"
```

---

### Task 5: Wire up boot.js and test

**Files:**
- Modify: `src/v4/boot.js` (already created in Task 1 — imports Game)

**Step 1: Verify boot.js imports Game correctly**

The boot.js from Task 1 already imports `{ Game }` from `./Game.js`. Confirm it matches.

**Step 2: Run the dev server and test**

```bash
cd /Users/jonas/Documents/GitHub/org/jonasjohansson/gemini && npm run dev
```

Open browser, verify:
- Two 3D viewports stacked vertically with divider
- Flat-shaded polygon ground scrolling toward camera
- Mountains on horizon
- Low-poly ships visible in both viewports
- Arrow keys move ship, Space shoots
- Shift switches perspective (obstacles toggle wireframe/solid)
- Tab swaps active twin
- Enemies spawn and shoot back

**Step 3: Fix any issues found during testing**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(v4): Star Fox SNES aesthetic — complete v4 implementation"
```
