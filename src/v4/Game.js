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

const SHIP_X_RANGE = 6;
const SHIP_Y_MIN = -1.5;
const SHIP_Y_MAX = 3;
const SHIP_Z = -2;
const SPAWN_Z = -50;
const DESPAWN_Z = 2;

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

    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
    camera.position.set(0, 3, 4);
    camera.lookAt(0, 1, -20);

    const ground = createGround();
    scene.add(ground);

    const mountains = createMountains();
    scene.add(mountains);

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
      obstacles: [],
      enemies: [],
      bullets: [],
      enemyBullets: [],
      explosions: [],
      aiShootCooldown: 0,
    };
  }

  createHUD() {
    const hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    document.body.appendChild(hud);
    this.hudEl = hud;

    const divider = document.createElement('div');
    divider.style.cssText = 'position:absolute;left:0;width:100%;height:40px;background:#000;display:flex;align-items:center;justify-content:center;border-top:2px solid #334;border-bottom:2px solid #334;';
    hud.appendChild(divider);
    this.dividerEl = divider;

    const title = document.createElement('span');
    title.textContent = 'G E M I N I';
    title.style.cssText = 'font-family:monospace;font-size:14px;color:#4466aa;letter-spacing:4px;';
    divider.appendChild(title);

    const perspLabel = document.createElement('span');
    perspLabel.textContent = 'SIDE';
    perspLabel.style.cssText = 'font-family:monospace;font-size:11px;color:#ff8833;position:absolute;left:12px;';
    divider.appendChild(perspLabel);
    this.perspLabel = perspLabel;

    const scoreLabel = document.createElement('span');
    scoreLabel.textContent = '0';
    scoreLabel.style.cssText = 'font-family:monospace;font-size:11px;color:#336699;position:absolute;right:12px;';
    divider.appendChild(scoreLabel);
    this.scoreLabel = scoreLabel;

    const twinLabel = document.createElement('span');
    twinLabel.textContent = 'TWIN A';
    twinLabel.style.cssText = 'font-family:monospace;font-size:10px;color:#44aaff;position:absolute;bottom:2px;';
    divider.appendChild(twinLabel);
    this.twinLabel = twinLabel;

    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.05s;';
    hud.appendChild(flash);
    this.flashEl = flash;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const halfH = (h - 40) / 2;
    const aspect = w / halfH;

    this.worldA.camera.aspect = aspect;
    this.worldA.camera.updateProjectionMatrix();
    this.worldB.camera.aspect = aspect;
    this.worldB.camera.updateProjectionMatrix();

    this.dividerEl.style.top = `${halfH}px`;

    this.viewportTop = { x: 0, y: halfH + 40, w, h: halfH };
    this.viewportBottom = { x: 0, y: 0, w, h: halfH };
  }

  update(dt) {
    this.levelTime += dt;
    const speed = this.scrollSpeed + this.loopCount * 1.5;

    this.processLevel();

    const w = this.activeWorld;
    const moveSpeed = 8;
    const shipX = w.ship.position.x;
    const shipY = w.ship.position.y;

    if (this.keys['ArrowLeft']) w.ship.position.x = Math.max(shipX - moveSpeed * dt, -SHIP_X_RANGE);
    if (this.keys['ArrowRight']) w.ship.position.x = Math.min(shipX + moveSpeed * dt, SHIP_X_RANGE);
    if (this.keys['ArrowUp']) w.ship.position.y = Math.min(shipY + moveSpeed * dt, SHIP_Y_MAX);
    if (this.keys['ArrowDown']) w.ship.position.y = Math.max(shipY - moveSpeed * dt, SHIP_Y_MIN);

    const targetRollX = this.keys['ArrowUp'] ? -0.15 : this.keys['ArrowDown'] ? 0.15 : 0;
    const targetRollZ = this.keys['ArrowLeft'] ? 0.4 : this.keys['ArrowRight'] ? -0.4 : 0;
    w.ship.rotation.x += (targetRollX - w.ship.rotation.x) * 8 * dt;
    w.ship.rotation.z += (targetRollZ - w.ship.rotation.z) * 8 * dt;

    if (this.keyJustPressed['Space']) this.fireBullet(w);
    if (this.keyJustPressed['ShiftLeft'] || this.keyJustPressed['ShiftRight']) this.switchPerspective();
    if (this.keyJustPressed['Tab']) this.swapActiveWorld();

    this.keyJustPressed = {};

    this.updateWorld(this.worldA, dt, speed);
    this.updateWorld(this.worldB, dt, speed);

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
    updateGround(world.ground, dt, speed);

    for (let i = world.obstacles.length - 1; i >= 0; i--) {
      const obs = world.obstacles[i];
      obs.position.z += speed * dt;
      if (obs.position.z > DESPAWN_Z) {
        world.scene.remove(obs);
        world.obstacles.splice(i, 1);
      }
    }

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

    for (let i = world.bullets.length - 1; i >= 0; i--) {
      const b = world.bullets[i];
      b.position.z -= 40 * dt;
      if (b.position.z < SPAWN_Z - 10) {
        world.scene.remove(b);
        world.bullets.splice(i, 1);
      }
    }

    for (let i = world.enemyBullets.length - 1; i >= 0; i--) {
      const b = world.enemyBullets[i];
      b.position.z += 15 * dt;
      if (b.position.z > DESPAWN_Z + 5) {
        world.scene.remove(b);
        world.enemyBullets.splice(i, 1);
      }
    }

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

    [this.worldA, this.worldB].forEach((w) => {
      w.obstacles.forEach((obs) => this.updateObsMaterial(obs));
    });

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

    for (const obs of world.obstacles) {
      if (obs.userData.passableIn === this.perspective) continue;
      const dz = obs.position.z - ship.position.z;
      if (dz < 0 && dz > -15 && Math.abs(dz) < nearestDist) {
        nearestDist = Math.abs(dz);
        targetX = obs.position.x > 0 ? obs.position.x - 2.5 : obs.position.x + 2.5;
        targetX = Math.max(-SHIP_X_RANGE, Math.min(SHIP_X_RANGE, targetX));
      }
    }

    for (const b of world.enemyBullets) {
      if (Math.abs(b.position.z - ship.position.z) < 5 && Math.abs(b.position.x - ship.position.x) < 2) {
        targetX = ship.position.x + (b.position.x > ship.position.x ? -3 : 3);
        targetX = Math.max(-SHIP_X_RANGE, Math.min(SHIP_X_RANGE, targetX));
      }
    }

    for (const e of world.enemies) {
      const dz = e.position.z - ship.position.z;
      if (dz < 0 && dz > -25 && nearestDist > 8) {
        targetX = e.position.x;
        targetY = e.position.y;
        if (Math.abs(ship.position.x - e.position.x) < 1) shouldShoot = true;
      }
    }

    const dx = targetX - ship.position.x;
    const dy = targetY - ship.position.y;
    ship.position.x += Math.sign(dx) * Math.min(Math.abs(dx), aiSpeed * dt);
    ship.position.y += Math.sign(dy) * Math.min(Math.abs(dy), aiSpeed * dt);

    ship.rotation.z += (-Math.sign(dx) * 0.3 - ship.rotation.z) * 5 * dt;

    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world);
      world.aiShootCooldown = 0.45;
    }
  }

  render() {
    const gl = this.renderer;
    gl.setScissorTest(true);

    const vt = this.viewportTop;
    gl.setViewport(vt.x, vt.y, vt.w, vt.h);
    gl.setScissor(vt.x, vt.y, vt.w, vt.h);
    gl.render(this.worldA.scene, this.worldA.camera);

    const vb = this.viewportBottom;
    gl.setViewport(vb.x, vb.y, vb.w, vb.h);
    gl.setScissor(vb.x, vb.y, vb.w, vb.h);
    gl.render(this.worldB.scene, this.worldB.camera);

    gl.setScissorTest(false);
  }
}
