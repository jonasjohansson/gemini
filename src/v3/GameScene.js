import Phaser from 'phaser';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

const W = 512;
const WORLD_H = 220;
const DIVIDER_Y = 224;
const DIVIDER_H = 32;
const WORLD_B_TOP = DIVIDER_Y + DIVIDER_H;

const SCALE = 3;

// Puzzle level — perspective changes are PART of the obstacle design
// Walls contain MIXED types so you must navigate position AND perspective together
const LEVEL_SEGMENTS = [
  // === INTRO: Solid walls, one type ===
  { at: 2, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 6, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},

  // === MIXED WALLS: must pick lane + perspective ===
  // In SIDE: orange ghosts, blue solid → fly through orange gaps
  // In TOP: blue ghosts, orange solid → fly through blue gaps
  { at: 10, wall: [
    { y: 0.15, p: 'T' }, { y: 0.35, p: 'S' }, { y: 0.5, p: 'T' },
    { y: 0.65, p: 'S' }, { y: 0.85, p: 'T' },
  ]},

  // Inverted
  { at: 13, wall: [
    { y: 0.15, p: 'S' }, { y: 0.35, p: 'T' }, { y: 0.5, p: 'S' },
    { y: 0.65, p: 'T' }, { y: 0.85, p: 'S' },
  ]},

  // === DOUBLE WALL: two perspectives back-to-back ===
  { at: 16, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' }, { y: 0.8, p: 'S' },
  ]},
  { at: 17.2, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},

  // Guardian
  { at: 19, enemies: [{ y: 0.5, pattern: 'drift' }] },

  // === CORRIDOR: safe lane only in one perspective ===
  // Top and bottom blocked (top-passable), middle blocked (side-passable)
  // SIDE view: middle is ghost → fly through middle
  // TOP view: edges ghost → fly along edges
  { at: 21, wall: [
    { y: 0.1, p: 'T' }, { y: 0.25, p: 'T' },
    { y: 0.5, p: 'S' },
    { y: 0.75, p: 'T' }, { y: 0.9, p: 'T' },
  ]},

  // === ZIGZAG: alternating safe lanes ===
  // Wall 1: safe lane at top (in SIDE view)
  { at: 24, wall: [
    { y: 0.15, p: 'S' },
    { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},
  // Wall 2: safe lane at bottom (in TOP view)
  { at: 25.5, wall: [
    { y: 0.2, p: 'S' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'S' },
    { y: 0.85, p: 'T' },
  ]},
  // Wall 3: back to top (SIDE)
  { at: 27, wall: [
    { y: 0.15, p: 'S' },
    { y: 0.4, p: 'T' }, { y: 0.6, p: 'T' }, { y: 0.8, p: 'T' },
  ]},

  // Guardian
  { at: 29, enemies: [{ y: 0.3, pattern: 'drift' }, { y: 0.7, pattern: 'drift' }] },

  // === RAPID SWITCH: full walls alternating fast ===
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

  // === MAZE: dense mixed — must weave AND switch ===
  { at: 37, wall: [
    { y: 0.1, p: 'S' }, { y: 0.3, p: 'T' }, { y: 0.5, p: 'S' },
    { y: 0.7, p: 'T' }, { y: 0.9, p: 'S' },
  ]},
  { at: 38.5, wall: [
    { y: 0.2, p: 'T' }, { y: 0.4, p: 'S' }, { y: 0.6, p: 'T' },
    { y: 0.8, p: 'S' },
  ]},

  // Guardian
  { at: 40, enemies: [{ y: 0.5, pattern: 'sine' }] },

  // === GAUNTLET: full density, both types ===
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

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('shipA', '/assets/v3/ship-neutral.png');
    this.load.image('shipA-up', '/assets/v3/ship-up.png');
    this.load.image('shipA-down', '/assets/v3/ship-down.png');
    this.load.image('shipB', '/assets/v3/ship-neutral-flip.png');
    this.load.image('shipB-up', '/assets/v3/ship-up-flip.png');
    this.load.image('shipB-down', '/assets/v3/ship-down-flip.png');
    this.load.image('bullet', '/assets/v3/bullet.png');
  }

  create() {
    this.perspective = VIEW_SIDE;
    this.scrollSpeed = 50;
    this.levelTime = 0;
    this.segmentIndex = 0;
    this.loopCount = 0;
    this.score = 0;

    // Generate all pixel art textures
    this.generateTextures();

    this.worldA = this.createWorld(0, WORLD_H, 'shipA', 1);
    this.createDivider();
    this.worldB = this.createWorld(WORLD_B_TOP, WORLD_H, 'shipB', -1);

    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.shiftKey.on('down', () => this.switchPerspective());
    this.tabKey.on('down', () => this.swapActiveWorld());
  }

  generateTextures() {
    // Starfield
    let g = this.make.graphics({ add: false });
    g.fillStyle(0x000000);
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const b = Phaser.Math.Between(1, 3);
      g.fillStyle(b === 3 ? 0xffffff : b === 2 ? 0x8888cc : 0x333355);
      g.fillRect(Phaser.Math.Between(0, 255), Phaser.Math.Between(0, 255), 1, 1);
    }
    g.generateTexture('starfield', 256, 256);
    g.destroy();

    // Orange obstacle (side-passable) — 8x8 pixel crystal
    g = this.make.graphics({ add: false });
    g.fillStyle(0x662200); g.fillRect(2, 1, 4, 6);
    g.fillStyle(0x993300); g.fillRect(1, 2, 6, 4);
    g.fillStyle(0xff6600); g.fillRect(2, 2, 4, 4);
    g.fillStyle(0xff9933); g.fillRect(2, 2, 2, 1); g.fillRect(2, 2, 1, 2);
    g.generateTexture('obs-S', 8, 8);
    g.destroy();

    // Blue obstacle (top-passable) — 8x8 pixel crystal
    g = this.make.graphics({ add: false });
    g.fillStyle(0x002266); g.fillRect(2, 1, 4, 6);
    g.fillStyle(0x003399); g.fillRect(1, 2, 6, 4);
    g.fillStyle(0x0066ff); g.fillRect(2, 2, 4, 4);
    g.fillStyle(0x44aaff); g.fillRect(2, 2, 2, 1); g.fillRect(2, 2, 1, 2);
    g.generateTexture('obs-T', 8, 8);
    g.destroy();

    // Enemy — NES-style space invader, 8x8
    g = this.make.graphics({ add: false });
    g.fillStyle(0xff4444);
    g.fillRect(1, 2, 1, 4); g.fillRect(6, 2, 1, 4); // sides
    g.fillRect(2, 1, 4, 6); // body
    g.fillStyle(0xff8888);
    g.fillRect(3, 2, 2, 2); // face highlight
    g.fillStyle(0xffcccc);
    g.fillRect(2, 3, 1, 1); g.fillRect(5, 3, 1, 1); // eyes
    g.fillStyle(0xcc0000);
    g.fillRect(0, 3, 1, 2); g.fillRect(7, 3, 1, 2); // wing tips
    g.generateTexture('enemy-sprite', 8, 8);
    g.destroy();

    // Enemy bullet — small red dot 4x4
    g = this.make.graphics({ add: false });
    g.fillStyle(0xff0000); g.fillRect(1, 0, 2, 4);
    g.fillStyle(0xff6666); g.fillRect(0, 1, 4, 2);
    g.fillStyle(0xffffff); g.fillRect(1, 1, 2, 2);
    g.generateTexture('enemy-bullet', 4, 4);
    g.destroy();

    // Explosion frames — NES starburst
    for (let f = 0; f < 4; f++) {
      g = this.make.graphics({ add: false });
      const s = 4 + f * 2; // growing size
      const colors = [0xffffff, 0xffff44, 0xff6600, 0xff2200];
      const c = colors[f];
      // Cross pattern
      g.fillStyle(c);
      g.fillRect(s / 2 - 1, 0, 2, s); // vertical
      g.fillRect(0, s / 2 - 1, s, 2); // horizontal
      // Diagonal pixels
      for (let i = 0; i < s / 2; i++) {
        g.fillRect(i, i, 1, 1);
        g.fillRect(s - 1 - i, i, 1, 1);
        g.fillRect(i, s - 1 - i, 1, 1);
        g.fillRect(s - 1 - i, s - 1 - i, 1, 1);
      }
      if (f < 2) {
        // Inner bright core
        g.fillStyle(0xffffff);
        g.fillRect(s / 2 - 1, s / 2 - 1, 2, 2);
      }
      g.generateTexture(`exp-${f}`, s, s);
      g.destroy();
    }
  }

  createDivider() {
    const g = this.add.graphics();
    g.setDepth(10);
    g.fillStyle(0x000000); g.fillRect(0, DIVIDER_Y, W, DIVIDER_H);
    g.lineStyle(1, 0x222244, 0.5);
    for (let y = DIVIDER_Y + 2; y < DIVIDER_Y + DIVIDER_H; y += 2) {
      g.lineBetween(0, y, W, y);
    }
    g.lineStyle(1, 0x4444aa, 0.8);
    g.lineBetween(0, DIVIDER_Y, W, DIVIDER_Y);
    g.lineBetween(0, DIVIDER_Y + DIVIDER_H - 1, W, DIVIDER_Y + DIVIDER_H - 1);

    this.add.text(W / 2, DIVIDER_Y + 3, 'G E M I N I', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4466aa',
    }).setOrigin(0.5, 0).setDepth(11);

    this.perspText = this.add.text(8, DIVIDER_Y + 18, 'SIDE', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ff8833',
    }).setDepth(11);

    this.scoreText = this.add.text(W - 8, DIVIDER_Y + 18, '0', {
      fontFamily: 'monospace', fontSize: '8px', color: '#336699',
    }).setOrigin(1, 0).setDepth(11);

    this.activeLabel = this.add.text(W / 2, DIVIDER_Y + 18, '▲ TWIN A', {
      fontFamily: 'monospace', fontSize: '8px', color: '#44aaff',
    }).setOrigin(0.5, 0).setDepth(11);
  }

  createWorld(topY, height, shipKey, direction) {
    const world = {
      topY, height, direction, shipKey,
      obstacles: this.add.group(),
      enemies: this.add.group(),
      bullets: this.add.group(),
      enemyBullets: this.add.group(),
      aiShootCooldown: 0,
    };

    world.bg = this.add.tileSprite(0, topY, W, height, 'starfield').setOrigin(0, 0);

    const shipX = direction === 1 ? 50 : W - 50;
    world.ship = this.physics.add.sprite(shipX, topY + height / 2, shipKey);
    world.ship.setScale(SCALE);
    world.ship.setDepth(3);
    world.ship.body.setSize(24, 8);
    world.ship.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(8, topY + 8, W - 16, height - 16)
    );
    world.ship.body.setCollideWorldBounds(true);
    return world;
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.levelTime += dt;
    const speed = this.scrollSpeed + this.loopCount * 5;

    this.processLevel();
    this.updateWorld(this.worldA, dt, speed);
    this.updateWorld(this.worldB, dt, speed);

    // Player
    const w = this.activeWorld;
    const spd = 130;
    w.ship.body.setVelocity(0, 0);
    if (this.cursors.left.isDown) w.ship.body.setVelocityX(-spd * w.direction);
    else if (this.cursors.right.isDown) w.ship.body.setVelocityX(spd * w.direction);
    if (this.cursors.up.isDown) w.ship.body.setVelocityY(-spd);
    else if (this.cursors.down.isDown) w.ship.body.setVelocityY(spd);
    this.updateShipFrame(w);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.fireBullet(w);

    // AI
    this.updateAI(this.inactiveWorld, dt);
    this.updateShipFrame(this.inactiveWorld);
  }

  updateShipFrame(world) {
    const vy = world.ship.body.velocity.y;
    const p = world.shipKey;
    world.ship.setTexture(vy < -20 ? `${p}-up` : vy > 20 ? `${p}-down` : p);
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
          this.spawnObs(this.worldA, d);
          this.spawnObs(this.worldB, d);
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

  spawnObs(world, def) {
    const y = world.topY + def.y * world.height;
    const dir = world.direction;
    const passable = def.p === 'S' ? VIEW_SIDE : VIEW_TOP;
    const obs = this.physics.add.sprite(dir === 1 ? W + 16 : -16, y, `obs-${def.p}`);
    obs.setScale(SCALE);
    obs.setDepth(2);
    obs.setData('passableIn', passable);
    obs.setData('dir', dir);
    this.updateObs(obs);
    world.obstacles.add(obs);
  }

  updateObs(obs) {
    const passable = obs.getData('passableIn');
    if (this.perspective === passable) {
      // Edge-on: thin and ghostly
      if (this.perspective === VIEW_SIDE) {
        obs.setScale(SCALE * 0.15, SCALE);
      } else {
        obs.setScale(SCALE, SCALE * 0.15);
      }
      obs.setAlpha(0.3);
      obs.body.setSize(0, 0);
    } else {
      obs.setScale(SCALE);
      obs.setAlpha(1);
      obs.body.setSize(7, 7);
    }
  }

  spawnEnemy(world, def) {
    const y = world.topY + def.y * world.height;
    const dir = world.direction;
    const enemy = this.physics.add.sprite(dir === 1 ? W + 16 : -16, y, 'enemy-sprite');
    enemy.setScale(SCALE);
    enemy.setDepth(2);
    enemy.body.setSize(7, 7);
    enemy.setData('pattern', def.pattern);
    enemy.setData('startY', y);
    enemy.setData('time', 0);
    enemy.setData('dir', dir);
    enemy.setData('shootCooldown', Phaser.Math.FloatBetween(2, 4));
    if (dir === -1) enemy.setFlipX(true);
    world.enemies.add(enemy);
  }

  updateWorld(world, dt, speed) {
    const dir = world.direction;
    world.bg.tilePositionX += speed * dt * 0.3 * dir;

    world.obstacles.getChildren().forEach((obs) => {
      obs.x -= speed * dt * dir;
      if ((dir === 1 && obs.x < -30) || (dir === -1 && obs.x > W + 30)) obs.destroy();
    });

    world.enemies.getChildren().forEach((e) => {
      const t = e.getData('time') + dt;
      e.setData('time', t);
      if (e.getData('pattern') === 'sine') {
        e.x -= speed * 0.35 * dt * dir;
        e.y = e.getData('startY') + Math.sin(t * 2) * 28;
      } else {
        e.x -= speed * 0.25 * dt * dir;
        e.y = e.getData('startY') + Math.sin(t * 1.5) * 10;
      }
      let cd = e.getData('shootCooldown') - dt;
      if (cd <= 0) { this.enemyShoot(e, world); cd = Phaser.Math.FloatBetween(3, 5); }
      e.setData('shootCooldown', cd);
      if ((dir === 1 && e.x < -20) || (dir === -1 && e.x > W + 20)) e.destroy();
    });

    world.bullets.getChildren().forEach((b) => {
      b.x += 280 * dt * dir;
      if ((dir === 1 && b.x > W + 10) || (dir === -1 && b.x < -10)) b.destroy();
    });

    world.enemyBullets.getChildren().forEach((b) => {
      b.x -= 100 * dt * dir;
      if ((dir === 1 && b.x < -10) || (dir === -1 && b.x > W + 10)) b.destroy();
    });

    // Collisions
    this.physics.overlap(world.bullets, world.enemies, (b, e) => {
      this.boom(e.x, e.y); b.destroy(); e.destroy();
      this.score += 100; this.scoreText.setText(`${this.score}`);
    });
    this.physics.overlap(world.ship, world.obstacles, (s, o) => {
      if (o.getData('passableIn') === this.perspective) return;
      this.boom(s.x, s.y); this.hitShip(world);
    });
    this.physics.overlap(world.ship, world.enemies, (s, e) => {
      this.boom(e.x, e.y); e.destroy(); this.hitShip(world);
    });
    this.physics.overlap(world.ship, world.enemyBullets, (s, b) => {
      this.boom(b.x, b.y); b.destroy(); this.hitShip(world);
    });
  }

  switchPerspective() {
    this.perspective = this.perspective === VIEW_SIDE ? VIEW_TOP : VIEW_SIDE;
    this.perspText.setText(this.perspective === VIEW_SIDE ? 'SIDE' : 'TOP');
    this.perspText.setColor(this.perspective === VIEW_SIDE ? '#ff8833' : '#44aaff');

    [this.worldA, this.worldB].forEach((w) => {
      w.obstacles.getChildren().forEach((o) => this.updateObs(o));
    });
    this.cameras.main.flash(30, 60, 60, 100);
  }

  swapActiveWorld() {
    if (this.activeWorld === this.worldA) {
      this.activeWorld = this.worldB;
      this.inactiveWorld = this.worldA;
      this.activeLabel.setText('▼ TWIN B').setColor('#ff66aa');
    } else {
      this.activeWorld = this.worldA;
      this.inactiveWorld = this.worldB;
      this.activeLabel.setText('▲ TWIN A').setColor('#44aaff');
    }
    this.inactiveWorld.ship.body.setVelocity(0, 0);
  }

  fireBullet(world) {
    const d = world.direction;
    const b = this.physics.add.sprite(world.ship.x + 16 * d, world.ship.y, 'bullet');
    b.setScale(SCALE); b.setDepth(2);
    if (d === -1) b.setFlipX(true);
    b.body.setSize(6, 2);
    world.bullets.add(b);
  }

  enemyShoot(enemy, world) {
    const b = this.physics.add.sprite(enemy.x, enemy.y, 'enemy-bullet');
    b.setScale(SCALE); b.setDepth(2);
    b.body.setSize(3, 3);
    world.enemyBullets.add(b);
  }

  boom(x, y) {
    for (let f = 0; f < 4; f++) {
      this.time.delayedCall(f * 50, () => {
        const e = this.add.sprite(x, y, `exp-${f}`);
        e.setScale(SCALE); e.setDepth(5);
        this.tweens.add({
          targets: e, alpha: 0, scale: SCALE * 1.5, duration: 150,
          onComplete: () => e.destroy(),
        });
      });
    }
    this.cameras.main.shake(25, 0.002);
  }

  hitShip(world) {
    this.tweens.add({
      targets: world.ship, alpha: 0.1, duration: 50, yoyo: true, repeat: 8,
    });
  }

  updateAI(world, dt) {
    const ship = world.ship;
    const dir = world.direction;
    const speed = 110;
    let targetY = world.topY + world.height / 2;
    let nearestDist = Infinity;
    let shouldShoot = false;

    world.obstacles.getChildren().forEach((o) => {
      if (o.getData('passableIn') === this.perspective) return;
      const dx = (o.x - ship.x) * dir;
      if (dx > 0 && dx < 100 && dx < nearestDist) {
        nearestDist = dx;
        const c = world.topY + world.height / 2;
        targetY = o.y > c ? o.y - 35 : o.y + 35;
        targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
      }
    });

    world.enemyBullets.getChildren().forEach((b) => {
      if (Math.abs(b.x - ship.x) < 40 && Math.abs(b.y - ship.y) < 25) {
        targetY = ship.y + (b.y > ship.y ? -30 : 30);
        targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
      }
    });

    world.enemies.getChildren().forEach((e) => {
      const dx = (e.x - ship.x) * dir;
      if (dx > 0 && dx < 180 && nearestDist > 50) {
        targetY = e.y;
        if (Math.abs(ship.y - e.y) < 12) shouldShoot = true;
      }
    });

    const dy = targetY - ship.y;
    ship.body.setVelocityY(Math.abs(dy) > 4 ? Math.sign(dy) * speed : 0);
    const safeX = dir === 1 ? 50 : W - 50;
    const dx = safeX - ship.x;
    ship.body.setVelocityX(Math.abs(dx) > 6 ? Math.sign(dx) * speed * 0.3 : 0);

    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world); world.aiShootCooldown = 0.45;
    }
  }
}
