import Phaser from 'phaser';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

const W = 512;
const WORLD_H = 220;
const DIVIDER_Y = 224;
const DIVIDER_H = 32;
const WORLD_A_TOP = 0;
const WORLD_B_TOP = DIVIDER_Y + DIVIDER_H;

// NES-scale pixel sizes
const SHIP_SCALE = 2;
const ENEMY_SCALE = 2;
const BULLET_SCALE = 2;

// Level data
const LEVEL_SEGMENTS = [
  { at: 1, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 4, obstacles: [
    { y: 0.2, type: 'big', passable: VIEW_SIDE },
    { y: 0.8, type: 'big', passable: VIEW_SIDE },
  ]},
  { at: 7, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },
  { at: 10, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 11.2, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },
  { at: 13, obstacles: [
    { y: 0.3, type: 'med', passable: VIEW_SIDE },
    { y: 0.7, type: 'med', passable: VIEW_TOP },
  ]},
  { at: 15, enemies: [{ y: 0.5, pattern: 'drift' }] },
  { at: 16, obstacles: [
    { y: 0.15, type: 'big', passable: VIEW_TOP },
    { y: 0.85, type: 'big', passable: VIEW_TOP },
    { y: 0.5, type: 'med', passable: VIEW_SIDE },
  ]},
  { at: 19, obstacles: [
    { y: 0.15, type: 'big', passable: VIEW_SIDE },
    { y: 0.85, type: 'big', passable: VIEW_SIDE },
    { y: 0.5, type: 'med', passable: VIEW_TOP },
  ]},
  { at: 21, enemies: [{ y: 0.3, pattern: 'drift' }] },
  { at: 22, obstacles: [{ y: 0.4, type: 'big', passable: VIEW_SIDE }] },
  { at: 23, obstacles: [{ y: 0.6, type: 'big', passable: VIEW_TOP }] },
  { at: 24, obstacles: [{ y: 0.3, type: 'big', passable: VIEW_SIDE }] },
  { at: 25, obstacles: [{ y: 0.7, type: 'big', passable: VIEW_TOP }] },
  { at: 26, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 26.8, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },
  { at: 28, enemies: [
    { y: 0.4, pattern: 'drift' },
    { y: 0.7, pattern: 'drift' },
  ]},
  { at: 29, obstacles: [
    { y: 0.2, type: 'big', passable: VIEW_SIDE },
    { y: 0.5, type: 'big', passable: VIEW_TOP },
    { y: 0.8, type: 'big', passable: VIEW_SIDE },
  ]},
  { at: 31, obstacles: [
    { y: 0.2, type: 'big', passable: VIEW_TOP },
    { y: 0.5, type: 'big', passable: VIEW_SIDE },
    { y: 0.8, type: 'big', passable: VIEW_TOP },
  ]},
  { at: 33, enemies: [{ y: 0.5, pattern: 'sine' }] },
  { at: 34, obstacles: [
    { y: 0.15, type: 'med', passable: VIEW_SIDE },
    { y: 0.35, type: 'med', passable: VIEW_TOP },
    { y: 0.55, type: 'med', passable: VIEW_SIDE },
    { y: 0.75, type: 'med', passable: VIEW_TOP },
  ]},
  { at: 37, enemies: [
    { y: 0.3, pattern: 'sine' },
    { y: 0.7, pattern: 'sine' },
  ]},
];
const LEVEL_LOOP = 40;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // Ships
    this.load.image('shipA', '/assets/v3/ship-neutral.png');
    this.load.image('shipA-up', '/assets/v3/ship-up.png');
    this.load.image('shipA-down', '/assets/v3/ship-down.png');
    this.load.image('shipB', '/assets/v3/ship-neutral-flip.png');
    this.load.image('shipB-up', '/assets/v3/ship-up-flip.png');
    this.load.image('shipB-down', '/assets/v3/ship-down-flip.png');

    // Bullets
    this.load.image('bullet', '/assets/v3/bullet.png');
    this.load.image('enemyBullet', '/assets/v3/enemy-bullet.png');

    // Explosions
    this.load.image('exp1', '/assets/v3/explosion1.png');
    this.load.image('exp2', '/assets/v3/explosion2.png');
    this.load.image('exp3', '/assets/v3/explosion3.png');

    // Enemies
    for (let i = 1; i <= 6; i++) {
      this.load.image(`enemy${i}`, `/assets/v3/enemy${i}.png`);
    }

    // Generate starfield texture
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x000000, 1);
    gfx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      const bright = Phaser.Math.Between(1, 3);
      const color = bright === 3 ? 0xffffff : bright === 2 ? 0x8888cc : 0x444466;
      gfx.fillStyle(color, 1);
      gfx.fillRect(
        Phaser.Math.Between(0, 255),
        Phaser.Math.Between(0, 255),
        1, 1
      );
    }
    gfx.generateTexture('starfield', 256, 256);
    gfx.destroy();

    // Generate obstacle textures (NES-style rocks)
    this.generateObstacleTextures();
  }

  generateObstacleTextures() {
    // Orange obstacle (passable in side view)
    const g1 = this.make.graphics({ add: false });
    g1.lineStyle(1, 0xff6600, 1);
    g1.strokeCircle(8, 8, 7);
    g1.fillStyle(0x993300, 0.5);
    g1.fillCircle(8, 8, 6);
    g1.lineStyle(1, 0xff8833, 0.5);
    g1.lineBetween(3, 5, 6, 3);
    g1.lineBetween(10, 4, 13, 6);
    g1.generateTexture('obs-side', 16, 16);
    g1.destroy();

    // Blue obstacle (passable in top view)
    const g2 = this.make.graphics({ add: false });
    g2.lineStyle(1, 0x0088ff, 1);
    g2.strokeCircle(8, 8, 7);
    g2.fillStyle(0x003366, 0.5);
    g2.fillCircle(8, 8, 6);
    g2.lineStyle(1, 0x44aaff, 0.5);
    g2.lineBetween(4, 6, 7, 4);
    g2.lineBetween(9, 5, 12, 7);
    g2.generateTexture('obs-top', 16, 16);
    g2.destroy();
  }

  create() {
    this.perspective = VIEW_SIDE;
    this.scrollSpeed = 60;
    this.levelTime = 0;
    this.segmentIndex = 0;
    this.loopCount = 0;
    this.score = 0;

    // World A — top half, flies right
    this.worldA = this.createWorld(WORLD_A_TOP, WORLD_H, 'shipA', 1, 'A');

    // Divider — Gradius-style status bar
    this.createDivider();

    // World B — bottom half, flies left
    this.worldB = this.createWorld(WORLD_B_TOP, WORLD_H, 'shipB', -1, 'B');

    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    this.shiftKey.on('down', () => this.switchPerspective());
    this.tabKey.on('down', () => this.swapActiveWorld());
  }

  createDivider() {
    // Black bar
    const g = this.add.graphics();
    g.setDepth(10);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, DIVIDER_Y, W, DIVIDER_H);

    // Gradius-style scanlines on divider
    g.lineStyle(1, 0x222244, 0.5);
    for (let y = DIVIDER_Y + 2; y < DIVIDER_Y + DIVIDER_H; y += 2) {
      g.lineBetween(0, y, W, y);
    }

    // Top/bottom edge lines
    g.lineStyle(1, 0x4444aa, 0.8);
    g.lineBetween(0, DIVIDER_Y, W, DIVIDER_Y);
    g.lineBetween(0, DIVIDER_Y + DIVIDER_H - 1, W, DIVIDER_Y + DIVIDER_H - 1);

    // Title
    this.add.text(W / 2, DIVIDER_Y + 4, 'G E M I N I', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4466aa',
    }).setOrigin(0.5, 0).setDepth(11);

    // Perspective
    this.perspText = this.add.text(8, DIVIDER_Y + 18, 'VIEW SIDE', {
      fontFamily: 'monospace', fontSize: '8px', color: '#336699',
    }).setDepth(11);

    // Score
    this.scoreText = this.add.text(W - 8, DIVIDER_Y + 18, 'SC 0', {
      fontFamily: 'monospace', fontSize: '8px', color: '#336699',
    }).setOrigin(1, 0).setDepth(11);

    // Active indicator
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

    // Starfield background (tiling)
    world.bg = this.add.tileSprite(0, topY, W, height, 'starfield');
    world.bg.setOrigin(0, 0);

    // Ship
    const shipX = direction === 1 ? 50 : W - 50;
    world.ship = this.physics.add.sprite(shipX, topY + height / 2, shipKey);
    world.ship.setScale(SHIP_SCALE);
    world.ship.setDepth(3);
    world.ship.body.setSize(20, 8);
    world.ship.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(8, topY + 8, W - 16, height - 16)
    );
    world.ship.body.setCollideWorldBounds(true);

    return world;
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.levelTime += dt;
    const speed = this.scrollSpeed + this.loopCount * 8;

    this.processLevelSegments();
    this.updateWorld(this.worldA, dt, speed);
    this.updateWorld(this.worldB, dt, speed);

    // Player input
    const world = this.activeWorld;
    const ship = world.ship;
    const dir = world.direction;
    const spd = 140;
    ship.body.setVelocity(0, 0);

    if (this.cursors.left.isDown) ship.body.setVelocityX(-spd * dir);
    else if (this.cursors.right.isDown) ship.body.setVelocityX(spd * dir);
    if (this.cursors.up.isDown) ship.body.setVelocityY(-spd);
    else if (this.cursors.down.isDown) ship.body.setVelocityY(spd);

    // Ship banking animation
    this.updateShipFrame(world);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireBullet(world);
    }

    // AI
    this.updateAI(this.inactiveWorld, dt);
    this.updateShipFrame(this.inactiveWorld);
  }

  updateShipFrame(world) {
    const vy = world.ship.body.velocity.y;
    const prefix = world.shipKey;
    if (vy < -30) {
      world.ship.setTexture(`${prefix}-up`);
    } else if (vy > 30) {
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
    const scale = def.type === 'big' ? 3 : 2;

    const obs = this.physics.add.sprite(spawnX, y, texKey);
    obs.setScale(scale);
    obs.setDepth(2);
    obs.setData('passableIn', def.passable);
    obs.setData('baseScale', scale);
    obs.setData('dir', dir);
    obs.setData('driftPhase', Math.random() * Math.PI * 2);
    obs.setData('driftSpeed', Phaser.Math.FloatBetween(-4, 4));

    this.updateObstacleAppearance(obs);
    world.obstacles.add(obs);
  }

  updateObstacleAppearance(obs) {
    const passableIn = obs.getData('passableIn');
    const baseScale = obs.getData('baseScale');
    if (this.perspective === passableIn) {
      // Edge-on: squished, semi-transparent
      if (this.perspective === VIEW_SIDE) {
        obs.setScale(baseScale * 0.2, baseScale);
      } else {
        obs.setScale(baseScale, baseScale * 0.2);
      }
      obs.setAlpha(0.4);
      obs.body.setSize(0, 0);
    } else {
      obs.setScale(baseScale);
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
    enemy.setScale(ENEMY_SCALE);
    enemy.setDepth(2);
    enemy.body.setSize(14, 14);
    enemy.setData('pattern', def.pattern || 'drift');
    enemy.setData('startY', y);
    enemy.setData('time', 0);
    enemy.setData('dir', dir);
    enemy.setData('shootCooldown', Phaser.Math.FloatBetween(1.5, 3));
    // Flip enemy to face player
    if (dir === -1) enemy.setFlipX(true);
    world.enemies.add(enemy);
  }

  updateWorld(world, dt, speed) {
    const dir = world.direction;

    // Scroll starfield
    world.bg.tilePositionX += speed * dt * 0.4 * dir;

    // Obstacles
    world.obstacles.getChildren().forEach((obs) => {
      obs.x -= speed * dt * dir;
      // Gentle drift
      const drift = obs.getData('driftSpeed');
      const phase = obs.getData('driftPhase');
      obs.y += Math.sin(this.levelTime * 0.8 + phase) * drift * dt;

      const oob = dir === 1 ? obs.x < -20 : obs.x > W + 20;
      if (oob) obs.destroy();
    });

    // Enemies
    world.enemies.getChildren().forEach((enemy) => {
      const pattern = enemy.getData('pattern');
      const t = enemy.getData('time') + dt;
      enemy.setData('time', t);

      if (pattern === 'sine') {
        enemy.x -= speed * 0.4 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 2) * 30;
      } else {
        enemy.x -= speed * 0.3 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 1.5) * 12;
      }

      // Shooting
      let cd = enemy.getData('shootCooldown') - dt;
      if (cd <= 0) {
        this.enemyShoot(enemy, world);
        cd = Phaser.Math.FloatBetween(2, 4);
      }
      enemy.setData('shootCooldown', cd);

      const oob = dir === 1 ? enemy.x < -20 : enemy.x > W + 20;
      if (oob) enemy.destroy();
    });

    // Player bullets
    world.bullets.getChildren().forEach((b) => {
      b.x += 300 * dt * dir;
      const oob = dir === 1 ? b.x > W + 10 : b.x < -10;
      if (oob) b.destroy();
    });

    // Enemy bullets
    world.enemyBullets.getChildren().forEach((b) => {
      b.x -= 120 * dt * dir;
      const oob = dir === 1 ? b.x < -10 : b.x > W + 10;
      if (oob) b.destroy();
    });

    // Collisions
    this.physics.overlap(world.bullets, world.enemies, (bullet, enemy) => {
      this.spawnExplosion(enemy.x, enemy.y);
      bullet.destroy();
      enemy.destroy();
      this.score += 100;
      this.scoreText.setText(`SC ${this.score}`);
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
    this.perspText.setText(`VIEW ${this.perspective.toUpperCase()}`);

    // Update all obstacles
    [this.worldA, this.worldB].forEach((world) => {
      world.obstacles.getChildren().forEach((obs) => {
        this.updateObstacleAppearance(obs);
      });
    });

    // NES-style flash
    this.cameras.main.flash(50, 40, 40, 80);
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
    const ship = world.ship;
    const dir = world.direction;
    const bullet = this.physics.add.sprite(
      ship.x + 14 * dir, ship.y, 'bullet'
    );
    bullet.setScale(BULLET_SCALE);
    bullet.setDepth(2);
    if (dir === -1) bullet.setFlipX(true);
    bullet.body.setSize(6, 4);
    world.bullets.add(bullet);
  }

  enemyShoot(enemy, world) {
    const dir = world.direction;
    const bullet = this.physics.add.sprite(enemy.x, enemy.y, 'enemyBullet');
    bullet.setScale(BULLET_SCALE);
    bullet.setDepth(2);
    bullet.body.setSize(6, 6);
    world.enemyBullets.add(bullet);
  }

  spawnExplosion(x, y) {
    const frames = ['exp1', 'exp2', 'exp3'];
    frames.forEach((key, i) => {
      this.time.delayedCall(i * 80, () => {
        const exp = this.add.sprite(x, y, key);
        exp.setScale(SHIP_SCALE);
        exp.setDepth(5);
        this.tweens.add({
          targets: exp,
          alpha: 0,
          scale: SHIP_SCALE * 2,
          duration: 200,
          onComplete: () => exp.destroy(),
        });
      });
    });
    this.cameras.main.shake(40, 0.002);
  }

  hitShip(world) {
    this.tweens.add({
      targets: world.ship,
      alpha: 0.15,
      duration: 60,
      yoyo: true,
      repeat: 8,
    });
  }

  // AI for inactive twin
  updateAI(world, dt) {
    const ship = world.ship;
    const dir = world.direction;
    const speed = 120;
    let targetY = world.topY + world.height / 2;
    let nearestThreatDist = Infinity;
    let shouldShoot = false;

    // Dodge obstacles
    world.obstacles.getChildren().forEach((obs) => {
      if (obs.getData('passableIn') === this.perspective) return;
      const dx = (obs.x - ship.x) * dir;
      if (dx > 0 && dx < 120) {
        if (dx < nearestThreatDist) {
          nearestThreatDist = dx;
          const center = world.topY + world.height / 2;
          targetY = obs.y > center ? obs.y - 40 : obs.y + 40;
          targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
        }
      }
    });

    // Dodge enemy bullets
    world.enemyBullets.getChildren().forEach((b) => {
      const dx = Math.abs(b.x - ship.x);
      const dy = b.y - ship.y;
      if (dx < 50 && Math.abs(dy) < 30) {
        targetY = ship.y + (dy > 0 ? -35 : 35);
        targetY = Phaser.Math.Clamp(targetY, world.topY + 16, world.topY + world.height - 16);
      }
    });

    // Target enemies
    world.enemies.getChildren().forEach((enemy) => {
      const dx = (enemy.x - ship.x) * dir;
      if (dx > 0 && dx < 200 && nearestThreatDist > 60) {
        targetY = enemy.y;
        if (Math.abs(ship.y - enemy.y) < 14) shouldShoot = true;
      }
    });

    // Move
    const dy = targetY - ship.y;
    ship.body.setVelocityY(Math.abs(dy) > 4 ? (dy > 0 ? speed : -speed) : 0);

    const safeX = dir === 1 ? 50 : W - 50;
    const driftX = safeX - ship.x;
    ship.body.setVelocityX(Math.abs(driftX) > 8 ? (driftX > 0 ? speed * 0.3 : -speed * 0.3) : 0);

    // Shoot
    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world);
      world.aiShootCooldown = 0.4;
    }
  }
}
