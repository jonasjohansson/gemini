import Phaser from 'phaser';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

const WORLD_HEIGHT = 280;
const DIVIDER_Y = 290;
const WORLD_A_TOP = 10;
const WORLD_B_TOP = 310;
const W = 800;

// --- Wireframe drawing helpers ---

function glowLine(gfx, x1, y1, x2, y2, color, alpha = 1) {
  // Outer glow
  gfx.lineStyle(4, color, alpha * 0.15);
  gfx.lineBetween(x1, y1, x2, y2);
  // Mid glow
  gfx.lineStyle(2, color, alpha * 0.4);
  gfx.lineBetween(x1, y1, x2, y2);
  // Core
  gfx.lineStyle(1, color, alpha);
  gfx.lineBetween(x1, y1, x2, y2);
}

function glowRect(gfx, x, y, w, h, color, alpha = 1) {
  gfx.lineStyle(3, color, alpha * 0.15);
  gfx.strokeRect(x, y, w, h);
  gfx.lineStyle(1.5, color, alpha * 0.4);
  gfx.strokeRect(x, y, w, h);
  gfx.lineStyle(1, color, alpha);
  gfx.strokeRect(x, y, w, h);
}

function drawWireShip(gfx, color, dir) {
  gfx.clear();
  const d = dir;
  // Arrow/ship shape
  const points = [
    { x: 14 * d, y: 0 },     // nose
    { x: -8 * d, y: -10 },   // top wing
    { x: -4 * d, y: -3 },    // inner top
    { x: -12 * d, y: -3 },   // engine top
    { x: -12 * d, y: 3 },    // engine bottom
    { x: -4 * d, y: 3 },     // inner bottom
    { x: -8 * d, y: 10 },    // bottom wing
  ];

  // Glow layer
  gfx.lineStyle(3, color, 0.2);
  gfx.beginPath();
  gfx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) gfx.lineTo(points[i].x, points[i].y);
  gfx.closePath();
  gfx.strokePath();

  // Core layer
  gfx.lineStyle(1, color, 1);
  gfx.beginPath();
  gfx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) gfx.lineTo(points[i].x, points[i].y);
  gfx.closePath();
  gfx.strokePath();

  // Cockpit dot
  gfx.fillStyle(color, 0.8);
  gfx.fillCircle(4 * d, 0, 2);
}

function drawWireEnemy(gfx, color) {
  gfx.clear();
  // Space invader shape — blocky wireframe
  const pts = [
    { x: -8, y: -6 }, { x: -6, y: -8 }, { x: -2, y: -8 }, { x: -2, y: -10 },
    { x: 2, y: -10 }, { x: 2, y: -8 }, { x: 6, y: -8 }, { x: 8, y: -6 },
    { x: 8, y: -2 }, { x: 10, y: 0 }, { x: 8, y: 2 },
    { x: 8, y: 6 }, { x: 4, y: 4 }, { x: 2, y: 8 },
    { x: -2, y: 8 }, { x: -4, y: 4 }, { x: -8, y: 6 },
    { x: -8, y: 2 }, { x: -10, y: 0 }, { x: -8, y: -2 },
  ];

  // Glow
  gfx.lineStyle(3, color, 0.2);
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((p) => gfx.lineTo(p.x, p.y));
  gfx.closePath();
  gfx.strokePath();

  // Core
  gfx.lineStyle(1, color, 0.9);
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((p) => gfx.lineTo(p.x, p.y));
  gfx.closePath();
  gfx.strokePath();

  // Eyes
  gfx.fillStyle(color, 0.7);
  gfx.fillCircle(-3, -4, 1.5);
  gfx.fillCircle(3, -4, 1.5);
}

function drawWireObstacle(gfx, size, color, perspective, passableIn, alpha) {
  gfx.clear();

  if (perspective === passableIn) {
    // Edge-on: thin line — visible but clearly passable
    if (perspective === VIEW_SIDE) {
      // Seen from side: thin vertical line
      glowLine(gfx, 0, -size * 0.5, 0, size * 0.5, color, alpha * 0.6);
      // Small tick marks to show it's a 3D object seen edge-on
      glowLine(gfx, -3, -size * 0.5, 3, -size * 0.5, color, alpha * 0.3);
      glowLine(gfx, -3, size * 0.5, 3, size * 0.5, color, alpha * 0.3);
    } else {
      // Seen from top: thin horizontal line
      glowLine(gfx, -size * 0.5, 0, size * 0.5, 0, color, alpha * 0.6);
      glowLine(gfx, -size * 0.5, -3, -size * 0.5, 3, color, alpha * 0.3);
      glowLine(gfx, size * 0.5, -3, size * 0.5, 3, color, alpha * 0.3);
    }
  } else {
    // Face-on: full wireframe shape — solid, dangerous
    const s = size * 0.5;
    // Outer diamond/crystal shape
    const pts = [
      { x: 0, y: -s },
      { x: s * 0.7, y: -s * 0.4 },
      { x: s, y: 0 },
      { x: s * 0.7, y: s * 0.4 },
      { x: 0, y: s },
      { x: -s * 0.7, y: s * 0.4 },
      { x: -s, y: 0 },
      { x: -s * 0.7, y: -s * 0.4 },
    ];

    // Glow
    gfx.lineStyle(3, color, alpha * 0.15);
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p) => gfx.lineTo(p.x, p.y));
    gfx.closePath();
    gfx.strokePath();

    // Core
    gfx.lineStyle(1, color, alpha * 0.9);
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p) => gfx.lineTo(p.x, p.y));
    gfx.closePath();
    gfx.strokePath();

    // Internal wireframe cross
    glowLine(gfx, -s, 0, s, 0, color, alpha * 0.3);
    glowLine(gfx, 0, -s, 0, s, color, alpha * 0.3);
  }
}

// Obstacle colors per passable type
const OBS_COLOR_SIDE = 0xff6600; // orange — passable in side view
const OBS_COLOR_TOP = 0x0088ff;  // blue — passable in top view

// Level segments
const LEVEL_SEGMENTS = [
  // ACT 1: Teaching
  { at: 1, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 4, obstacles: [
    { y: 0.2, type: 'big', passable: VIEW_SIDE },
    { y: 0.8, type: 'big', passable: VIEW_SIDE },
  ]},
  { at: 7, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },

  // ACT 2: Alternation
  { at: 10, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 11.2, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },
  { at: 13, obstacles: [
    { y: 0.3, type: 'med', passable: VIEW_SIDE },
    { y: 0.7, type: 'med', passable: VIEW_TOP },
  ]},

  // ACT 3: Corridors
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

  // ACT 4: The Weave
  { at: 22, obstacles: [{ y: 0.4, type: 'big', passable: VIEW_SIDE }] },
  { at: 23, obstacles: [{ y: 0.6, type: 'big', passable: VIEW_TOP }] },
  { at: 24, obstacles: [{ y: 0.3, type: 'big', passable: VIEW_SIDE }] },
  { at: 25, obstacles: [{ y: 0.7, type: 'big', passable: VIEW_TOP }] },
  { at: 26, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 26.8, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },

  // ACT 5: The Maze
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

  // ACT 6: Density
  { at: 34, obstacles: [
    { y: 0.15, type: 'med', passable: VIEW_SIDE },
    { y: 0.35, type: 'med', passable: VIEW_TOP },
    { y: 0.55, type: 'med', passable: VIEW_SIDE },
    { y: 0.75, type: 'med', passable: VIEW_TOP },
  ]},
  { at: 36, obstacles: [
    { y: 0.25, type: 'med', passable: VIEW_TOP },
    { y: 0.45, type: 'med', passable: VIEW_SIDE },
    { y: 0.65, type: 'med', passable: VIEW_TOP },
    { y: 0.85, type: 'med', passable: VIEW_SIDE },
  ]},

  // Guardians
  { at: 15, enemies: [{ y: 0.5, pattern: 'drift' }] },
  { at: 21, enemies: [{ y: 0.3, pattern: 'drift' }] },
  { at: 28, enemies: [
    { y: 0.4, pattern: 'drift' },
    { y: 0.7, pattern: 'drift' },
  ]},
  { at: 33, enemies: [{ y: 0.5, pattern: 'sine' }] },
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

  create() {
    this.perspective = VIEW_SIDE;
    this.scrollSpeed = 80;
    this.levelTime = 0;
    this.segmentIndex = 0;
    this.loopCount = 0;

    // Black void background
    this.cameras.main.setBackgroundColor('#000000');

    // World A
    this.worldA = this.createWorld(WORLD_A_TOP, 0x00ddff, 'A', 1);

    // Divider — glowing line
    this.dividerGfx = this.add.graphics();
    this.dividerGfx.setDepth(10);
    this.drawDivider();

    this.add.text(350, DIVIDER_Y + 4, 'G E M I N I', {
      fontFamily: 'monospace', fontSize: '11px', color: '#445588',
    }).setDepth(11);

    // World B
    this.worldB = this.createWorld(WORLD_B_TOP, 0xff44aa, 'B', -1);

    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    this.shiftKey.on('down', () => this.switchPerspective());
    this.tabKey.on('down', () => this.swapActiveWorld());

    // HUD
    this.score = 0;
    this.scoreText = this.add.text(680, DIVIDER_Y + 4, '0', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688',
    }).setDepth(11);

    this.perspText = this.add.text(16, DIVIDER_Y + 4, 'SIDE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688',
    }).setDepth(11);

    this.add.text(16, 590, 'ARROWS · SPACE shoot · SHIFT perspective · TAB swap', {
      fontFamily: 'monospace', fontSize: '9px', color: '#222244',
    }).setDepth(11);

    // Active indicators
    this.indicatorA = this.add.text(775, WORLD_A_TOP + WORLD_HEIGHT / 2 - 6, '◄', {
      fontFamily: 'monospace', fontSize: '12px', color: '#00ddff',
    }).setDepth(5);
    this.indicatorB = this.add.text(15, WORLD_B_TOP + WORLD_HEIGHT / 2 - 6, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff44aa',
    }).setDepth(5);

    // Pulse timer for visual effects
    this.pulseTime = 0;
  }

  drawDivider() {
    const g = this.dividerGfx;
    g.clear();
    g.fillStyle(0x000000, 1);
    g.fillRect(0, DIVIDER_Y, W, 20);
    // Glow lines
    g.lineStyle(1, 0x334466, 0.8);
    g.lineBetween(0, DIVIDER_Y + 10, W, DIVIDER_Y + 10);
    g.lineStyle(2, 0x334466, 0.2);
    g.lineBetween(0, DIVIDER_Y + 10, W, DIVIDER_Y + 10);
  }

  createWorld(topY, shipColor, label, direction) {
    const world = {
      topY, label, shipColor, direction,
      obstacles: this.add.group(),
      enemies: this.add.group(),
      bullets: this.add.group(),
      enemyBullets: this.add.group(),
      aiShootCooldown: 0,
    };

    // Grid background
    world.gridGfx = this.add.graphics();
    world.gridGfx.setDepth(0);

    // Ship
    world.ship = this.add.graphics();
    const shipX = direction === 1 ? 100 : 700;
    world.ship.setPosition(shipX, topY + WORLD_HEIGHT / 2);
    world.ship.setDepth(3);
    drawWireShip(world.ship, shipColor, direction);
    this.physics.add.existing(world.ship);
    world.ship.body.setSize(24, 18);
    world.ship.body.setOffset(-12, -9);
    world.ship.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(10, topY + 10, 780, WORLD_HEIGHT - 20)
    );
    world.ship.body.setCollideWorldBounds(true);

    // Engine particles (simple dots)
    world.engineParticles = [];

    return world;
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.levelTime += dt;
    this.pulseTime += dt;
    const effectiveSpeed = this.scrollSpeed + this.loopCount * 10;

    this.processLevelSegments();

    // Draw grids
    this.drawGrid(this.worldA, effectiveSpeed);
    this.drawGrid(this.worldB, effectiveSpeed);

    this.updateWorld(this.worldA, dt, effectiveSpeed);
    this.updateWorld(this.worldB, dt, effectiveSpeed);

    // Player input
    const ship = this.activeWorld.ship;
    const dir = this.activeWorld.direction;
    const speed = 200;
    ship.body.setVelocity(0, 0);

    if (this.cursors.left.isDown) ship.body.setVelocityX(-speed * dir);
    else if (this.cursors.right.isDown) ship.body.setVelocityX(speed * dir);
    if (this.cursors.up.isDown) ship.body.setVelocityY(-speed);
    else if (this.cursors.down.isDown) ship.body.setVelocityY(speed);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireBullet(this.activeWorld);
    }

    // AI controls inactive twin
    this.updateAI(this.inactiveWorld, dt);

    // Engine particles
    this.updateEngineParticles(this.worldA, dt);
    this.updateEngineParticles(this.worldB, dt);
  }

  drawGrid(world, speed) {
    const g = world.gridGfx;
    g.clear();

    const topY = world.topY;
    const dir = world.direction;
    const gridSpacing = 60;
    const scrollOffset = (this.levelTime * speed * 0.3 * dir) % gridSpacing;

    // Horizontal lines
    const hAlpha = 0.06;
    g.lineStyle(1, world.shipColor, hAlpha);
    for (let y = topY + 20; y < topY + WORLD_HEIGHT; y += gridSpacing) {
      g.lineBetween(0, y, W, y);
    }

    // Vertical lines (scrolling)
    g.lineStyle(1, world.shipColor, 0.04);
    for (let x = -scrollOffset; x < W + gridSpacing; x += gridSpacing) {
      g.lineBetween(x, topY, x, topY + WORLD_HEIGHT);
    }

    // World border
    g.lineStyle(1, world.shipColor, 0.15);
    g.strokeRect(0, topY, W, WORLD_HEIGHT);
  }

  updateEngineParticles(world, dt) {
    const ship = world.ship;
    const dir = world.direction;
    const isActive = world === this.activeWorld;

    // Spawn new particles
    if (Math.random() < (isActive ? 0.6 : 0.2)) {
      world.engineParticles.push({
        x: ship.x - 14 * dir,
        y: ship.y + Phaser.Math.FloatBetween(-3, 3),
        vx: -Phaser.Math.FloatBetween(40, 120) * dir,
        life: 0.4,
        maxLife: 0.4,
        color: world.shipColor,
      });
    }

    // Update & draw
    const gfx = ship; // reuse... actually let's use a separate graphics
    // We'll draw them in updateWorld instead
    world.engineParticles = world.engineParticles.filter((p) => {
      p.x += p.vx * dt;
      p.life -= dt;
      return p.life > 0;
    });
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
    if (seg.obstacles) seg.obstacles.forEach((def) => this.spawnObstacle(world, def));
    if (seg.enemies) seg.enemies.forEach((def) => this.spawnEnemy(world, def));
  }

  spawnObstacle(world, def) {
    const y = world.topY + def.y * WORLD_HEIGHT;
    const dir = world.direction;
    const spawnX = dir === 1 ? 850 : -50;
    const size = def.type === 'big' ? 60 : 35;
    const color = def.passable === VIEW_SIDE ? OBS_COLOR_SIDE : OBS_COLOR_TOP;

    const gfx = this.add.graphics();
    gfx.setPosition(spawnX, y);
    gfx.setDepth(2);
    drawWireObstacle(gfx, size, color, this.perspective, def.passable, 1);

    this.physics.add.existing(gfx);
    this.updateObstacleHitbox(gfx, size, def.passable);

    gfx.setData('passableIn', def.passable);
    gfx.setData('size', size);
    gfx.setData('color', color);
    gfx.setData('dir', dir);
    gfx.setData('driftPhase', Math.random() * Math.PI * 2);
    gfx.setData('driftSpeed', Phaser.Math.FloatBetween(-6, 6));

    world.obstacles.add(gfx);
  }

  updateObstacleHitbox(gfx, size, passableIn) {
    if (this.perspective === passableIn) {
      // Edge-on: thin hitbox
      if (this.perspective === VIEW_SIDE) {
        gfx.body.setSize(6, size * 0.8);
        gfx.body.setOffset(-3, -size * 0.4);
      } else {
        gfx.body.setSize(size * 0.8, 6);
        gfx.body.setOffset(-size * 0.4, -3);
      }
    } else {
      // Face-on: full hitbox
      gfx.body.setSize(size * 0.7, size * 0.7);
      gfx.body.setOffset(-size * 0.35, -size * 0.35);
    }
  }

  spawnEnemy(world, def) {
    const y = world.topY + def.y * WORLD_HEIGHT;
    const dir = world.direction;
    const spawnX = dir === 1 ? 850 : -30;

    const color = world.shipColor === 0x00ddff ? 0xff4444 : 0xff8844;
    const gfx = this.add.graphics();
    gfx.setPosition(spawnX, y);
    gfx.setDepth(2);
    drawWireEnemy(gfx, color);

    this.physics.add.existing(gfx);
    gfx.body.setSize(18, 18);
    gfx.body.setOffset(-9, -9);
    gfx.setData('pattern', def.pattern || 'drift');
    gfx.setData('startY', y);
    gfx.setData('time', 0);
    gfx.setData('dir', dir);
    gfx.setData('color', color);
    gfx.setData('shootCooldown', Phaser.Math.FloatBetween(1.5, 3));
    world.enemies.add(gfx);
  }

  updateWorld(world, dt, speed) {
    const dir = world.direction;
    const isActive = world === this.activeWorld;

    // Dim inactive world slightly
    // (we handle this via alpha on the ship)

    // Obstacles
    world.obstacles.getChildren().forEach((obs) => {
      obs.x -= speed * dt * dir;
      // Organic drift
      const drift = obs.getData('driftSpeed');
      const phase = obs.getData('driftPhase');
      obs.y += Math.sin(this.levelTime * 0.8 + phase) * drift * dt;

      const outOfBounds = dir === 1 ? obs.x < -80 : obs.x > 880;
      if (outOfBounds) obs.destroy();
    });

    // Enemies
    world.enemies.getChildren().forEach((enemy) => {
      const pattern = enemy.getData('pattern');
      const t = enemy.getData('time') + dt;
      enemy.setData('time', t);

      if (pattern === 'sine') {
        enemy.x -= speed * 0.4 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 2) * 50;
      } else {
        enemy.x -= speed * 0.3 * dt * dir;
        enemy.y = enemy.getData('startY') + Math.sin(t * 1.5) * 20;
      }

      // Redraw with pulse (Rez-style animation)
      const pulseAlpha = 0.7 + Math.sin(t * 8) * 0.3;
      const color = enemy.getData('color');
      enemy.clear();
      drawWireEnemy(enemy, color);
      enemy.setAlpha(pulseAlpha);

      // Enemy shooting
      let cd = enemy.getData('shootCooldown') - dt;
      if (cd <= 0) {
        this.enemyShoot(enemy, world);
        cd = Phaser.Math.FloatBetween(2, 4);
      }
      enemy.setData('shootCooldown', cd);

      const outOfBounds = dir === 1 ? enemy.x < -40 : enemy.x > 840;
      if (outOfBounds) enemy.destroy();
    });

    // Player bullets
    world.bullets.getChildren().forEach((bullet) => {
      bullet.x += 450 * dt * dir;
      const outOfBounds = dir === 1 ? bullet.x > 820 : bullet.x < -20;
      if (outOfBounds) bullet.destroy();
    });

    // Enemy bullets
    world.enemyBullets.getChildren().forEach((bullet) => {
      bullet.x -= 180 * dt * dir;
      const outOfBounds = dir === 1 ? bullet.x < -20 : bullet.x > 820;
      if (outOfBounds) bullet.destroy();
    });

    // Draw engine particles
    if (!world.particleGfx) {
      world.particleGfx = this.add.graphics();
      world.particleGfx.setDepth(2);
    }
    world.particleGfx.clear();
    world.engineParticles.forEach((p) => {
      const a = p.life / p.maxLife;
      world.particleGfx.fillStyle(p.color, a * 0.6);
      world.particleGfx.fillCircle(p.x, p.y, 1 + a);
    });

    // --- Collisions ---
    this.physics.overlap(world.bullets, world.enemies, (bullet, enemy) => {
      this.spawnExplosion(enemy.x, enemy.y, enemy.getData('color'));
      bullet.destroy();
      enemy.destroy();
      this.score += 100;
      this.scoreText.setText(`${this.score}`);
    });

    this.physics.overlap(world.ship, world.obstacles, (ship, obs) => {
      if (obs.getData('passableIn') === this.perspective) return;
      this.spawnExplosion(ship.x, ship.y, world.shipColor);
      this.hitShip(world);
    });

    this.physics.overlap(world.ship, world.enemies, (ship, enemy) => {
      this.spawnExplosion(enemy.x, enemy.y, world.shipColor);
      enemy.destroy();
      this.hitShip(world);
    });

    this.physics.overlap(world.ship, world.enemyBullets, (ship, bullet) => {
      this.spawnExplosion(bullet.x, bullet.y, world.shipColor);
      bullet.destroy();
      this.hitShip(world);
    });
  }

  switchPerspective() {
    this.perspective = this.perspective === VIEW_SIDE ? VIEW_TOP : VIEW_SIDE;
    this.perspText.setText(this.perspective.toUpperCase());

    [this.worldA, this.worldB].forEach((world) => {
      world.obstacles.getChildren().forEach((obs) => {
        const size = obs.getData('size');
        const color = obs.getData('color');
        const passableIn = obs.getData('passableIn');
        drawWireObstacle(obs, size, color, this.perspective, passableIn, 1);
        this.updateObstacleHitbox(obs, size, passableIn);
      });
    });

    // Flash effect — white wireframe flash
    this.cameras.main.flash(60, 10, 15, 30);
    this.cameras.main.shake(40, 0.003);
  }

  swapActiveWorld() {
    if (this.activeWorld === this.worldA) {
      this.activeWorld = this.worldB;
      this.inactiveWorld = this.worldA;
      this.indicatorA.setText('');
      this.indicatorB.setText('►');
    } else {
      this.activeWorld = this.worldA;
      this.inactiveWorld = this.worldB;
      this.indicatorA.setText('◄');
      this.indicatorB.setText('');
    }
    this.inactiveWorld.ship.body.setVelocity(0, 0);
    this.cameras.main.zoomTo(1.015, 40);
    this.time.delayedCall(40, () => this.cameras.main.zoomTo(1, 80));
  }

  fireBullet(world) {
    const ship = world.ship;
    const dir = world.direction;
    const offsetX = dir === 1 ? 16 : -16;

    const bullet = this.add.graphics();
    bullet.setPosition(ship.x + offsetX, ship.y);
    bullet.setDepth(2);

    // Wireframe bullet — small diamond
    const c = world.shipColor;
    bullet.lineStyle(2, c, 0.3);
    bullet.strokeCircle(0, 0, 4);
    bullet.lineStyle(1, c, 0.9);
    bullet.strokeCircle(0, 0, 2);
    bullet.fillStyle(c, 0.5);
    bullet.fillCircle(0, 0, 1);

    this.physics.add.existing(bullet);
    bullet.body.setSize(6, 6);
    bullet.body.setOffset(-3, -3);
    world.bullets.add(bullet);
  }

  enemyShoot(enemy, world) {
    const dir = world.direction;
    const bullet = this.add.graphics();
    bullet.setPosition(enemy.x, enemy.y);
    bullet.setDepth(2);

    const c = 0xff2222;
    bullet.lineStyle(2, c, 0.2);
    bullet.strokeCircle(0, 0, 3);
    bullet.lineStyle(1, c, 0.8);
    bullet.fillStyle(c, 0.4);
    bullet.fillCircle(0, 0, 1.5);

    this.physics.add.existing(bullet);
    bullet.body.setSize(5, 5);
    bullet.body.setOffset(-2.5, -2.5);
    world.enemyBullets.add(bullet);
  }

  // --- AI for inactive twin ---
  updateAI(world, dt) {
    const ship = world.ship;
    const dir = world.direction;
    const speed = 160;
    const lookAhead = 220;
    const shipX = ship.x;
    const shipY = ship.y;

    let targetY = world.topY + WORLD_HEIGHT / 2;
    let shouldShoot = false;
    let nearestThreatDist = Infinity;

    // Dodge obstacles
    world.obstacles.getChildren().forEach((obs) => {
      if (obs.getData('passableIn') === this.perspective) return;
      const dx = (obs.x - shipX) * dir;
      if (dx > 0 && dx < lookAhead) {
        if (dx < nearestThreatDist) {
          nearestThreatDist = dx;
          const obsY = obs.y;
          const worldCenter = world.topY + WORLD_HEIGHT / 2;
          targetY = obsY > worldCenter ? obsY - 70 : obsY + 70;
          targetY = Phaser.Math.Clamp(targetY, world.topY + 25, world.topY + WORLD_HEIGHT - 25);
        }
      }
    });

    // Dodge enemy bullets
    world.enemyBullets.getChildren().forEach((bullet) => {
      const dx = Math.abs(bullet.x - shipX);
      const dy = bullet.y - shipY;
      if (dx < 80 && Math.abs(dy) < 40) {
        targetY = shipY + (dy > 0 ? -50 : 50);
        targetY = Phaser.Math.Clamp(targetY, world.topY + 25, world.topY + WORLD_HEIGHT - 25);
      }
    });

    // Target enemies
    let nearestEnemy = null;
    let nearestEnemyDist = Infinity;
    world.enemies.getChildren().forEach((enemy) => {
      const dx = (enemy.x - shipX) * dir;
      if (dx > 0 && dx < 350) {
        if (dx < nearestEnemyDist) {
          nearestEnemyDist = dx;
          nearestEnemy = enemy;
        }
      }
    });

    if (nearestEnemy && nearestThreatDist > lookAhead * 0.5) {
      targetY = nearestEnemy.y;
      if (Math.abs(shipY - nearestEnemy.y) < 20) shouldShoot = true;
    }

    // Move
    const dy = targetY - shipY;
    ship.body.setVelocityY(Math.abs(dy) > 6 ? (dy > 0 ? speed : -speed) : 0);

    const safeX = dir === 1 ? 100 : 700;
    const driftX = safeX - shipX;
    ship.body.setVelocityX(Math.abs(driftX) > 12 ? (driftX > 0 ? speed * 0.3 : -speed * 0.3) : 0);

    // Shoot
    world.aiShootCooldown -= dt;
    if (shouldShoot && world.aiShootCooldown <= 0) {
      this.fireBullet(world);
      world.aiShootCooldown = 0.4;
    }
  }

  spawnExplosion(x, y, color) {
    this.cameras.main.shake(40, 0.002);
    // Wireframe explosion — expanding lines
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const len = Phaser.Math.Between(15, 40);
      const line = this.add.graphics();
      line.setPosition(x, y);
      line.setDepth(4);
      line.lineStyle(1, color, 0.8);
      line.lineBetween(0, 0, Math.cos(angle) * 5, Math.sin(angle) * 5);

      this.tweens.add({
        targets: line,
        x: x + Math.cos(angle) * len,
        y: y + Math.sin(angle) * len,
        alpha: 0,
        duration: 300,
        onComplete: () => line.destroy(),
      });
    }
    // Center flash
    const flash = this.add.circle(x, y, 8, color, 0.6);
    flash.setDepth(4);
    this.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy(),
    });
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
}
