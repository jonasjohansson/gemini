import Phaser from 'phaser';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

const W = 512;
const WORLD_H = 220;
const DIVIDER_Y = 224;
const DIVIDER_H = 32;
const WORLD_B_TOP = DIVIDER_Y + DIVIDER_H;

const SCALE = 3; // pixel scale-up

// Puzzle-focused level design
// Each segment forms a spatial puzzle that REQUIRES perspective switching
// Obstacles are arranged so there's no gap in one view but a clear path in the other
const LEVEL_SEGMENTS = [
  // === TUTORIAL: One wall, one solution ===
  // Full wall of SIDE-passable obstacles — switch to SIDE to pass
  { at: 2, obstacles: [
    { y: 0.2, passable: VIEW_SIDE },
    { y: 0.4, passable: VIEW_SIDE },
    { y: 0.6, passable: VIEW_SIDE },
    { y: 0.8, passable: VIEW_SIDE },
  ]},

  // Full wall of TOP-passable — switch to TOP to pass
  { at: 6, obstacles: [
    { y: 0.2, passable: VIEW_TOP },
    { y: 0.4, passable: VIEW_TOP },
    { y: 0.6, passable: VIEW_TOP },
    { y: 0.8, passable: VIEW_TOP },
  ]},

  // === LESSON 2: Mixed wall with one gap ===
  // Wall with gap at 0.5 — but only in SIDE view (0.5 is side-passable)
  { at: 10, obstacles: [
    { y: 0.15, passable: VIEW_TOP },
    { y: 0.35, passable: VIEW_TOP },
    { y: 0.5, passable: VIEW_SIDE },  // the "gap" in side view
    { y: 0.65, passable: VIEW_TOP },
    { y: 0.85, passable: VIEW_TOP },
  ]},

  // Reverse: gap only in TOP view
  { at: 14, obstacles: [
    { y: 0.15, passable: VIEW_SIDE },
    { y: 0.35, passable: VIEW_SIDE },
    { y: 0.5, passable: VIEW_TOP },   // gap in top view
    { y: 0.65, passable: VIEW_SIDE },
    { y: 0.85, passable: VIEW_SIDE },
  ]},

  // === LESSON 3: Two walls in quick succession — must switch between ===
  { at: 18, obstacles: [
    { y: 0.2, passable: VIEW_SIDE },
    { y: 0.4, passable: VIEW_SIDE },
    { y: 0.6, passable: VIEW_SIDE },
    { y: 0.8, passable: VIEW_SIDE },
  ]},
  { at: 19.5, obstacles: [
    { y: 0.2, passable: VIEW_TOP },
    { y: 0.4, passable: VIEW_TOP },
    { y: 0.6, passable: VIEW_TOP },
    { y: 0.8, passable: VIEW_TOP },
  ]},

  // === PUZZLE 1: Checkerboard wall ===
  // Alternating types — must pick a lane AND a perspective
  // In SIDE view: gaps at 0.3, 0.7 (top-passable ones become passable? no —
  // side-passable ones ghost. So side view: 0.2(ghost) 0.35(solid) 0.5(ghost) 0.65(solid) 0.8(ghost)
  // Player must navigate through the solid ones
  { at: 23, obstacles: [
    { y: 0.2, passable: VIEW_SIDE },
    { y: 0.35, passable: VIEW_TOP },
    { y: 0.5, passable: VIEW_SIDE },
    { y: 0.65, passable: VIEW_TOP },
    { y: 0.8, passable: VIEW_SIDE },
  ]},

  // Inverted checkerboard — forces the opposite perspective
  { at: 25, obstacles: [
    { y: 0.2, passable: VIEW_TOP },
    { y: 0.35, passable: VIEW_SIDE },
    { y: 0.5, passable: VIEW_TOP },
    { y: 0.65, passable: VIEW_SIDE },
    { y: 0.8, passable: VIEW_TOP },
  ]},

  // === PUZZLE 2: Funnel ===
  // Wide wall with a narrow gap that shifts position between perspectives
  // SIDE view: gap at top (0.15 is side-passable)
  // TOP view: gap at bottom (0.85 is top-passable) — but rest is solid!
  { at: 28, obstacles: [
    { y: 0.15, passable: VIEW_SIDE },  // ghost in side
    { y: 0.3, passable: VIEW_TOP },
    { y: 0.45, passable: VIEW_TOP },
    { y: 0.6, passable: VIEW_TOP },
    { y: 0.75, passable: VIEW_TOP },
    { y: 0.85, passable: VIEW_TOP },   // ghost in top — gap here
  ]},

  // === PUZZLE 3: Double funnel — must switch MID-WALL ===
  // First half needs SIDE, second half needs TOP (but they arrive together)
  // Top cluster: side-passable
  { at: 32, obstacles: [
    { y: 0.15, passable: VIEW_SIDE },
    { y: 0.3, passable: VIEW_SIDE },
  ]},
  // Bottom cluster: top-passable (arrives slightly after)
  { at: 32.8, obstacles: [
    { y: 0.6, passable: VIEW_TOP },
    { y: 0.75, passable: VIEW_TOP },
    { y: 0.9, passable: VIEW_TOP },
  ]},

  // === PUZZLE 4: The Gauntlet ===
  // Rapid alternating walls
  { at: 36, obstacles: [
    { y: 0.3, passable: VIEW_SIDE },
    { y: 0.5, passable: VIEW_SIDE },
    { y: 0.7, passable: VIEW_SIDE },
  ]},
  { at: 37, obstacles: [
    { y: 0.3, passable: VIEW_TOP },
    { y: 0.5, passable: VIEW_TOP },
    { y: 0.7, passable: VIEW_TOP },
  ]},
  { at: 38, obstacles: [
    { y: 0.3, passable: VIEW_SIDE },
    { y: 0.5, passable: VIEW_SIDE },
    { y: 0.7, passable: VIEW_SIDE },
  ]},
  { at: 39, obstacles: [
    { y: 0.3, passable: VIEW_TOP },
    { y: 0.5, passable: VIEW_TOP },
    { y: 0.7, passable: VIEW_TOP },
  ]},

  // === PUZZLE 5: Total wall — must be in exactly the right perspective ===
  { at: 42, obstacles: [
    { y: 0.1, passable: VIEW_SIDE },
    { y: 0.25, passable: VIEW_SIDE },
    { y: 0.4, passable: VIEW_SIDE },
    { y: 0.55, passable: VIEW_SIDE },
    { y: 0.7, passable: VIEW_SIDE },
    { y: 0.85, passable: VIEW_SIDE },
  ]},
  { at: 44, obstacles: [
    { y: 0.1, passable: VIEW_TOP },
    { y: 0.25, passable: VIEW_TOP },
    { y: 0.4, passable: VIEW_TOP },
    { y: 0.55, passable: VIEW_TOP },
    { y: 0.7, passable: VIEW_TOP },
    { y: 0.85, passable: VIEW_TOP },
  ]},

  // Guardians (sparse, not the focus)
  { at: 16, enemies: [{ y: 0.5, pattern: 'drift' }] },
  { at: 27, enemies: [{ y: 0.3, pattern: 'drift' }, { y: 0.7, pattern: 'drift' }] },
  { at: 35, enemies: [{ y: 0.5, pattern: 'sine' }] },
  { at: 41, enemies: [{ y: 0.3, pattern: 'sine' }, { y: 0.7, pattern: 'sine' }] },
];
const LEVEL_LOOP = 48;

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
    this.load.image('enemyBullet', '/assets/v3/enemy-bullet.png');
    this.load.image('exp1', '/assets/v3/explosion1.png');
    this.load.image('exp2', '/assets/v3/explosion2.png');
    this.load.image('exp3', '/assets/v3/explosion3.png');
    for (let i = 1; i <= 6; i++) {
      this.load.image(`enemy${i}`, `/assets/v3/enemy${i}.png`);
    }

    // Generate starfield
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x000000, 1);
    gfx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 50; i++) {
      const b = Phaser.Math.Between(1, 3);
      gfx.fillStyle(b === 3 ? 0xffffff : b === 2 ? 0x8888cc : 0x444466, 1);
      gfx.fillRect(Phaser.Math.Between(0, 255), Phaser.Math.Between(0, 255), 1, 1);
    }
    gfx.generateTexture('starfield', 256, 256);
    gfx.destroy();

    // Obstacle textures — more visible, NES-style
    this.genObsTexture('obs-side', 0xff6600, 0x993300, 0xff8833);
    this.genObsTexture('obs-top', 0x0088ff, 0x003366, 0x44aaff);
  }

  genObsTexture(key, outline, fill, highlight) {
    const g = this.make.graphics({ add: false });
    // 16x16 crystal/asteroid
    g.fillStyle(fill, 1);
    g.fillRect(4, 2, 8, 12);
    g.fillRect(2, 4, 12, 8);
    g.fillStyle(outline, 1);
    // Outline
    g.fillRect(4, 1, 8, 1);
    g.fillRect(4, 14, 8, 1);
    g.fillRect(1, 4, 1, 8);
    g.fillRect(14, 4, 1, 8);
    g.fillRect(2, 2, 2, 2);
    g.fillRect(12, 2, 2, 2);
    g.fillRect(2, 12, 2, 2);
    g.fillRect(12, 12, 2, 2);
    // Highlight
    g.fillStyle(highlight, 1);
    g.fillRect(5, 3, 3, 1);
    g.fillRect(4, 4, 1, 2);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  create() {
    this.perspective = VIEW_SIDE;
    this.scrollSpeed = 50;
    this.levelTime = 0;
    this.segmentIndex = 0;
    this.loopCount = 0;
    this.score = 0;

    this.worldA = this.createWorld(0, WORLD_H, 'shipA', 1, 'A');
    this.createDivider();
    this.worldB = this.createWorld(WORLD_B_TOP, WORLD_H, 'shipB', -1, 'B');

    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    this.shiftKey.on('down', () => this.switchPerspective());
    this.tabKey.on('down', () => this.swapActiveWorld());
  }

  createDivider() {
    const g = this.add.graphics();
    g.setDepth(10);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, DIVIDER_Y, W, DIVIDER_H);
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

  createWorld(topY, height, shipKey, direction, label) {
    const world = {
      topY, height, label, direction, shipKey,
      obstacles: this.add.group(),
      enemies: this.add.group(),
      bullets: this.add.group(),
      enemyBullets: this.add.group(),
      aiShootCooldown: 0,
    };

    world.bg = this.add.tileSprite(0, topY, W, height, 'starfield');
    world.bg.setOrigin(0, 0);

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
    const speed = this.scrollSpeed + this.loopCount * 6;

    this.processLevelSegments();
    this.updateWorld(this.worldA, dt, speed);
    this.updateWorld(this.worldB, dt, speed);

    const world = this.activeWorld;
    const ship = world.ship;
    const dir = world.direction;
    const spd = 130;
    ship.body.setVelocity(0, 0);

    if (this.cursors.left.isDown) ship.body.setVelocityX(-spd * dir);
    else if (this.cursors.right.isDown) ship.body.setVelocityX(spd * dir);
    if (this.cursors.up.isDown) ship.body.setVelocityY(-spd);
    else if (this.cursors.down.isDown) ship.body.setVelocityY(spd);

    this.updateShipFrame(world);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireBullet(world);
    }

    this.updateAI(this.inactiveWorld, dt);
    this.updateShipFrame(this.inactiveWorld);
  }

  updateShipFrame(world) {
    const vy = world.ship.body.velocity.y;
    const prefix = world.shipKey;
    if (vy < -20) {
      world.ship.setTexture(`${prefix}-up`);
    } else if (vy > 20) {
      world.ship.setTexture(`${prefix}-down`);
    } else {
      world.ship.setTexture(prefix);
    }
  }

  processLevelSegments() {
    const segTime = this.levelTime - this.loopCount * LEVEL_LOOP;
    while (
      this.segmentIndex < LEVEL_SEGMENTS.length &&
      LEVEL_SEGMENTS[this.segmentIndex].at <= segTime
    ) {
      const seg = LEVEL_SEGMENTS[this.segmentIndex];
      this.spawnSegment(this.worldA, seg);
      this.spawnSegment(this.worldB, seg);
      this.segmentIndex++;
    }
    if (segTime >= LEVEL_LOOP) {
      this.loopCount++;
      this.segmentIndex = 0;
    }
  }

  spawnSegment(world, seg) {
    if (seg.obstacles) seg.obstacles.forEach((d) => this.spawnObstacle(world, d));
    if (seg.enemies) seg.enemies.forEach((d) => this.spawnEnemy(world, d));
  }

  spawnObstacle(world, def) {
    const y = world.topY + def.y * world.height;
    const dir = world.direction;
    const spawnX = dir === 1 ? W + 16 : -16;
    const texKey = def.passable === VIEW_SIDE ? 'obs-side' : 'obs-top';

    const obs = this.physics.add.sprite(spawnX, y, texKey);
    obs.setScale(SCALE);
    obs.setDepth(2);
    obs.setData('passableIn', def.passable);
    obs.setData('dir', dir);

    this.updateObsAppearance(obs);
    world.obstacles.add(obs);
  }

  updateObsAppearance(obs) {
    const passableIn = obs.getData('passableIn');
    if (this.perspective === passableIn) {
      // Edge-on: squished, semi-transparent — you see it but can fly through
      if (this.perspective === VIEW_SIDE) {
        obs.setScale(SCALE * 0.2, SCALE);
      } else {
        obs.setScale(SCALE, SCALE * 0.2);
      }
      obs.setAlpha(0.35);
      obs.body.setSize(0, 0);
    } else {
      // Full — solid and dangerous
      obs.setScale(SCALE);
      obs.setAlpha(1);
      obs.body.setSize(14, 14);
    }
  }

  spawnEnemy(world, def) {
    const y = world.topY + def.y * world.height;
    const dir = world.direction;
    const spawnX = dir === 1 ? W + 16 : -16;
    const num = Phaser.Math.Between(1, 6);
    const enemy = this.physics.add.sprite(spawnX, y, `enemy${num}`);
    enemy.setScale(SCALE);
    enemy.setDepth(2);
    enemy.body.setSize(14, 14);
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
      const oob = dir === 1 ? obs.x < -30 : obs.x > W + 30;
      if (oob) obs.destroy();
    });

    world.enemies.getChildren().forEach((enemy) => {
      const t = enemy.getData('time') + dt;
      enemy.setData('time', t);
      const pat = enemy.getData('pattern');
      if (pat === 'sine') {
        enemy.x -= speed * 0.35 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 2) * 30;
      } else {
        enemy.x -= speed * 0.25 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 1.5) * 12;
      }

      let cd = enemy.getData('shootCooldown') - dt;
      if (cd <= 0) {
        this.enemyShoot(enemy, world);
        cd = Phaser.Math.FloatBetween(2.5, 5);
      }
      enemy.setData('shootCooldown', cd);

      const oob = dir === 1 ? enemy.x < -20 : enemy.x > W + 20;
      if (oob) enemy.destroy();
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
    this.physics.overlap(world.bullets, world.enemies, (bullet, enemy) => {
      this.spawnExplosion(enemy.x, enemy.y);
      bullet.destroy();
      enemy.destroy();
      this.score += 100;
      this.scoreText.setText(`${this.score}`);
    });

    this.physics.overlap(world.ship, world.obstacles, (ship, obs) => {
      if (obs.getData('passableIn') === this.perspective) return;
      this.spawnExplosion(ship.x, ship.y);
      this.hitShip(world);
    });

    this.physics.overlap(world.ship, world.enemies, (ship, enemy) => {
      this.spawnExplosion(enemy.x, enemy.y);
      enemy.destroy();
      this.hitShip(world);
    });

    this.physics.overlap(world.ship, world.enemyBullets, (ship, bullet) => {
      this.spawnExplosion(bullet.x, bullet.y);
      bullet.destroy();
      this.hitShip(world);
    });
  }

  switchPerspective() {
    this.perspective = this.perspective === VIEW_SIDE ? VIEW_TOP : VIEW_SIDE;
    const color = this.perspective === VIEW_SIDE ? '#ff8833' : '#44aaff';
    this.perspText.setText(this.perspective.toUpperCase());
    this.perspText.setColor(color);

    [this.worldA, this.worldB].forEach((world) => {
      world.obstacles.getChildren().forEach((obs) => this.updateObsAppearance(obs));
    });

    this.cameras.main.flash(40, 50, 50, 80);
  }

  swapActiveWorld() {
    if (this.activeWorld === this.worldA) {
      this.activeWorld = this.worldB;
      this.inactiveWorld = this.worldA;
      this.activeLabel.setText('▼ TWIN B');
      this.activeLabel.setColor('#ff66aa');
    } else {
      this.activeWorld = this.worldA;
      this.inactiveWorld = this.worldB;
      this.activeLabel.setText('▲ TWIN A');
      this.activeLabel.setColor('#44aaff');
    }
    this.inactiveWorld.ship.body.setVelocity(0, 0);
  }

  fireBullet(world) {
    const dir = world.direction;
    const b = this.physics.add.sprite(
      world.ship.x + 16 * dir, world.ship.y, 'bullet'
    );
    b.setScale(SCALE);
    b.setDepth(2);
    if (dir === -1) b.setFlipX(true);
    b.body.setSize(8, 4);
    world.bullets.add(b);
  }

  enemyShoot(enemy, world) {
    const b = this.physics.add.sprite(enemy.x, enemy.y, 'enemyBullet');
    b.setScale(SCALE);
    b.setDepth(2);
    b.body.setSize(6, 6);
    world.enemyBullets.add(b);
  }

  spawnExplosion(x, y) {
    ['exp1', 'exp2', 'exp3'].forEach((key, i) => {
      this.time.delayedCall(i * 60, () => {
        const e = this.add.sprite(x, y, key);
        e.setScale(SCALE);
        e.setDepth(5);
        this.tweens.add({
          targets: e, alpha: 0, scale: SCALE * 2.5, duration: 200,
          onComplete: () => e.destroy(),
        });
      });
    });
    this.cameras.main.shake(30, 0.002);
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

    world.obstacles.getChildren().forEach((obs) => {
      if (obs.getData('passableIn') === this.perspective) return;
      const dx = (obs.x - ship.x) * dir;
      if (dx > 0 && dx < 100) {
        if (dx < nearestDist) {
          nearestDist = dx;
          const center = world.topY + world.height / 2;
          targetY = obs.y > center ? obs.y - 35 : obs.y + 35;
          targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
        }
      }
    });

    world.enemyBullets.getChildren().forEach((b) => {
      if (Math.abs(b.x - ship.x) < 40 && Math.abs(b.y - ship.y) < 25) {
        targetY = ship.y + (b.y > ship.y ? -30 : 30);
        targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
      }
    });

    world.enemies.getChildren().forEach((enemy) => {
      const dx = (enemy.x - ship.x) * dir;
      if (dx > 0 && dx < 180 && nearestDist > 50) {
        targetY = enemy.y;
        if (Math.abs(ship.y - enemy.y) < 12) shouldShoot = true;
      }
    });

    const dy = targetY - ship.y;
    ship.body.setVelocityY(Math.abs(dy) > 4 ? Math.sign(dy) * speed : 0);

    const safeX = dir === 1 ? 50 : W - 50;
    const driftX = safeX - ship.x;
    ship.body.setVelocityX(Math.abs(driftX) > 6 ? Math.sign(driftX) * speed * 0.3 : 0);

    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world);
      world.aiShootCooldown = 0.45;
    }
  }
}
