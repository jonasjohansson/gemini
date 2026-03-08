import * as THREE from 'three';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

// Wireframe material helpers
export function wireMat(color, opacity = 1) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

export function glowMat(color, opacity = 0.15) {
  return new THREE.LineBasicMaterial({
    color, transparent: true, opacity, linewidth: 2,
  });
}

// Create wireframe ship geometry
export function createShipMesh(color, direction) {
  const group = new THREE.Group();
  const d = direction;

  // Main body — angular arrow shape
  const bodyPts = [
    new THREE.Vector3(1.4 * d, 0, 0),    // nose
    new THREE.Vector3(-0.8 * d, 0, 0.8),  // top wing
    new THREE.Vector3(-0.3 * d, 0, 0.2),  // inner
    new THREE.Vector3(-1.0 * d, 0, 0.2),  // engine
    new THREE.Vector3(-1.0 * d, 0, -0.2), // engine
    new THREE.Vector3(-0.3 * d, 0, -0.2), // inner
    new THREE.Vector3(-0.8 * d, 0, -0.8), // bottom wing
    new THREE.Vector3(1.4 * d, 0, 0),     // close
  ];
  const bodyGeo = new THREE.BufferGeometry().setFromPoints(bodyPts);
  group.add(new THREE.Line(bodyGeo, wireMat(color)));
  group.add(new THREE.Line(bodyGeo, glowMat(color, 0.2)));

  // Cockpit
  const cockpitGeo = new THREE.SphereGeometry(0.12, 6, 4);
  const cockpitMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0.5 * d, 0, 0);
  group.add(cockpit);

  return group;
}

// Create wireframe enemy (Space Invader shape)
export function createEnemyMesh(color) {
  const group = new THREE.Group();

  const pts = [
    new THREE.Vector3(-0.8, 0, -0.6),
    new THREE.Vector3(-0.6, 0, -0.8),
    new THREE.Vector3(-0.2, 0, -0.8),
    new THREE.Vector3(-0.2, 0, -1.0),
    new THREE.Vector3(0.2, 0, -1.0),
    new THREE.Vector3(0.2, 0, -0.8),
    new THREE.Vector3(0.6, 0, -0.8),
    new THREE.Vector3(0.8, 0, -0.6),
    new THREE.Vector3(0.8, 0, 0.6),
    new THREE.Vector3(0.4, 0, 0.4),
    new THREE.Vector3(0.2, 0, 0.8),
    new THREE.Vector3(-0.2, 0, 0.8),
    new THREE.Vector3(-0.4, 0, 0.4),
    new THREE.Vector3(-0.8, 0, 0.6),
    new THREE.Vector3(-0.8, 0, -0.6),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  group.add(new THREE.Line(geo, wireMat(color, 0.9)));
  group.add(new THREE.Line(geo, glowMat(color, 0.25)));

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.08, 4, 4);
  const eyeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.25, 0, -0.35);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.25, 0, -0.35);
  group.add(eyeL, eyeR);

  return group;
}

// Create wireframe obstacle (crystal/diamond)
export function createObstacleMesh(size, color) {
  const group = new THREE.Group();
  const s = size;

  // Octahedron wireframe
  const geo = new THREE.OctahedronGeometry(s, 0);
  const edges = new THREE.EdgesGeometry(geo);
  group.add(new THREE.LineSegments(edges, wireMat(color, 0.9)));
  group.add(new THREE.LineSegments(edges, glowMat(color, 0.2)));

  return group;
}

// Create bullet
export function createBulletMesh(color) {
  const geo = new THREE.OctahedronGeometry(0.12, 0);
  const edges = new THREE.EdgesGeometry(geo);
  const group = new THREE.Group();
  group.add(new THREE.LineSegments(edges, wireMat(color)));
  group.add(new THREE.LineSegments(edges, glowMat(color, 0.4)));
  return group;
}

// Grid plane
export function createGrid(color, size = 40, divisions = 20) {
  const grid = new THREE.GridHelper(size, divisions, color, color);
  grid.material.transparent = true;
  grid.material.opacity = 0.08;
  return grid;
}

// Base World class
export class World {
  constructor(game, shipColor, direction) {
    this.game = game;
    this.shipColor = shipColor;
    this.direction = direction;
    this.obstacles = [];
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.engineParticles = [];
    this.aiShootCooldown = 0;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.04);

    // Camera — orthographic for clean wireframe look
    const aspect = window.innerWidth / (window.innerHeight / 2);
    const frustum = 8;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum, 0.1, 200
    );
    this.setupCamera();

    // Grid
    this.grid = createGrid(shipColor);
    this.grid.position.y = -2;
    this.scene.add(this.grid);

    // Second grid (ceiling) — subtle
    this.gridCeiling = createGrid(shipColor);
    this.gridCeiling.position.y = 6;
    this.gridCeiling.material = this.gridCeiling.material.clone();
    this.gridCeiling.material.opacity = 0.03;
    this.scene.add(this.gridCeiling);

    // Ship
    this.ship = createShipMesh(shipColor, direction);
    this.ship.position.set(direction === 1 ? -6 : 6, 0, 0);
    this.scene.add(this.ship);
    this.shipVelocity = new THREE.Vector3();
    this.shipBounds = { minX: -9, maxX: 9, minZ: -5, maxZ: 5 };

    // Ambient light lines (decorative distant wireframes)
    this.addAmbientLines();
  }

  setupCamera() {
    // Camera positions for each perspective
    this.cameraPositions = {
      side: new THREE.Vector3(0, 8, 14),
      top: new THREE.Vector3(0, 18, 2),
    };
    this.cameraLookAt = new THREE.Vector3(0, 0, 0);
    this.cameraTargetPos = this.cameraPositions.side.clone();
    this.camera.position.copy(this.cameraTargetPos);
    this.camera.lookAt(this.cameraLookAt);
  }

  addAmbientLines() {
    // Distant wireframe structures (Rez-style background elements)
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.BoxGeometry(
        Math.random() * 2 + 0.5,
        Math.random() * 3 + 1,
        Math.random() * 2 + 0.5
      );
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, wireMat(this.shipColor, 0.04));
      line.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 4 - 1,
        -15 - Math.random() * 20
      );
      this.scene.add(line);
    }
  }

  onResize(aspect) {
    const frustum = 8;
    this.camera.left = -frustum * aspect;
    this.camera.right = frustum * aspect;
    this.camera.top = frustum;
    this.camera.bottom = -frustum;
    this.camera.updateProjectionMatrix();
  }

  onPerspectiveChange(perspective) {
    // Set camera target — will lerp in update()
    this.cameraTargetPos.copy(this.cameraPositions[perspective]);

    // Update obstacle targets (they'll lerp too)
    this.obstacles.forEach((obs) => {
      this.updateObstacleTarget(obs, perspective);
    });
  }

  update(dt, speed) {
    const dir = this.direction;
    const isActive = this === this.game.activeWorld;

    // Smooth camera transition
    const lerpSpeed = 3.5; // how fast the camera moves (higher = snappier)
    this.camera.position.lerp(this.cameraTargetPos, 1 - Math.exp(-lerpSpeed * dt));
    this.camera.lookAt(this.cameraLookAt);

    // Scroll grid
    this.grid.position.x -= speed * dt * dir * 0.5;
    this.grid.position.x %= 4; // loop
    this.gridCeiling.position.x = this.grid.position.x;

    // Ship glow pulse
    const pulse = 0.7 + Math.sin(this.game.levelTime * 4) * 0.3;
    this.ship.children[0].material.opacity = isActive ? 1 : 0.4;
    this.ship.children[1].material.opacity = isActive ? 0.25 : 0.08;

    // Update obstacles
    this.obstacles = this.obstacles.filter((obs) => {
      obs.mesh.position.x -= speed * dt * dir;
      // Slow rotation
      obs.mesh.rotation.y += dt * 0.5;
      obs.mesh.rotation.z += dt * 0.3;
      // Organic drift
      obs.mesh.position.z += Math.sin(this.game.levelTime * 0.8 + obs.phase) * obs.drift * dt;

      // Smooth scale lerp toward target
      obs.mesh.scale.lerp(obs.targetScale, 1 - Math.exp(-5 * dt));

      // Smooth opacity lerp
      obs.mesh.children.forEach((child, i) => {
        const target = obs.targetOpacities[i];
        child.material.opacity += (target - child.material.opacity) * (1 - Math.exp(-5 * dt));
      });

      // Update passable state based on current scale (use threshold)
      const minAxis = Math.min(obs.mesh.scale.x, obs.mesh.scale.z);
      obs.isPassable = minAxis < 0.5;

      const outOfBounds = dir === 1 ? obs.mesh.position.x < -15 : obs.mesh.position.x > 15;
      if (outOfBounds) {
        this.scene.remove(obs.mesh);
        return false;
      }

      // Collision with ship
      if (!obs.isPassable) {
        const dx = obs.mesh.position.x - this.ship.position.x;
        const dz = obs.mesh.position.z - this.ship.position.z;
        const hitDist = obs.size * 0.6;
        if (Math.abs(dx) < hitDist && Math.abs(dz) < hitDist) {
          this.hitShip();
          this.spawnExplosion(this.ship.position.x, this.ship.position.z);
        }
      }

      return true;
    });

    // Update enemies
    this.enemies = this.enemies.filter((enemy) => {
      enemy.time += dt;
      if (enemy.pattern === 'sine') {
        enemy.mesh.position.x -= speed * 0.4 * dt * dir;
        enemy.mesh.position.z = enemy.startZ + Math.sin(enemy.time * 2) * 3;
      } else {
        enemy.mesh.position.x -= speed * 0.3 * dt * dir;
        enemy.mesh.position.z = enemy.startZ + Math.sin(enemy.time * 1.5) * 1.5;
      }
      // Pulse
      enemy.mesh.rotation.y += dt * 2;

      // Enemy shooting
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        this.fireEnemyBullet(enemy);
        enemy.shootCooldown = 2 + Math.random() * 2;
      }

      // Collision with ship
      const dx = enemy.mesh.position.x - this.ship.position.x;
      const dz = enemy.mesh.position.z - this.ship.position.z;
      if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.8) {
        this.spawnExplosion(enemy.mesh.position.x, enemy.mesh.position.z);
        this.scene.remove(enemy.mesh);
        this.hitShip();
        return false;
      }

      const outOfBounds = dir === 1 ? enemy.mesh.position.x < -15 : enemy.mesh.position.x > 15;
      if (outOfBounds) {
        this.scene.remove(enemy.mesh);
        return false;
      }
      return true;
    });

    // Update bullets
    this.bullets = this.bullets.filter((bullet) => {
      bullet.mesh.position.x += 25 * dt * dir;
      bullet.mesh.rotation.y += dt * 10;
      const outOfBounds = dir === 1 ? bullet.mesh.position.x > 15 : bullet.mesh.position.x < -15;
      if (outOfBounds) {
        this.scene.remove(bullet.mesh);
        return false;
      }

      // Hit enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        const dx = bullet.mesh.position.x - enemy.mesh.position.x;
        const dz = bullet.mesh.position.z - enemy.mesh.position.z;
        if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.8) {
          this.spawnExplosion(enemy.mesh.position.x, enemy.mesh.position.z);
          this.scene.remove(enemy.mesh);
          this.scene.remove(bullet.mesh);
          this.enemies.splice(i, 1);
          this.game.score += 100;
          return false;
        }
      }
      return true;
    });

    // Update enemy bullets
    this.enemyBullets = this.enemyBullets.filter((bullet) => {
      bullet.mesh.position.x -= 12 * dt * dir;
      bullet.mesh.rotation.y += dt * 8;
      const outOfBounds = dir === 1 ? bullet.mesh.position.x < -15 : bullet.mesh.position.x > 15;
      if (outOfBounds) {
        this.scene.remove(bullet.mesh);
        return false;
      }

      // Hit ship
      const dx = bullet.mesh.position.x - this.ship.position.x;
      const dz = bullet.mesh.position.z - this.ship.position.z;
      if (Math.abs(dx) < 0.6 && Math.abs(dz) < 0.6) {
        this.spawnExplosion(bullet.mesh.position.x, bullet.mesh.position.z);
        this.scene.remove(bullet.mesh);
        this.hitShip();
        return false;
      }
      return true;
    });

    // Engine particles
    if (Math.random() < (isActive ? 0.5 : 0.15)) {
      this.spawnEngineParticle();
    }
    this.engineParticles = this.engineParticles.filter((p) => {
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.material.opacity = (p.life / p.maxLife) * 0.5;
      p.mesh.scale.setScalar(p.life / p.maxLife * 0.5);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        return false;
      }
      return true;
    });

    // AI for inactive world
    if (!isActive) {
      this.updateAI(dt);
    }
  }

  addObstacle(relY, type, passableIn) {
    const dir = this.direction;
    const z = (relY - 0.5) * 10; // map 0-1 to -5..5
    const x = dir === 1 ? 15 : -15;
    const size = type === 'big' ? 1.2 : 0.7;
    const color = passableIn === 'side' ? 0xff6600 : 0x0088ff;

    const mesh = createObstacleMesh(size, color);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    const obs = {
      mesh, size, color, passableIn,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 1.5,
      isPassable: this.game.perspective === passableIn,
      targetScale: new THREE.Vector3(1, 1, 1),
      targetOpacities: mesh.children.map((_, i) => i === 0 ? 0.9 : 0.2),
    };

    // Set initial state (no lerp for spawn)
    this.updateObstacleTarget(obs, this.game.perspective);
    obs.mesh.scale.copy(obs.targetScale);
    obs.mesh.children.forEach((child, i) => {
      child.material.opacity = obs.targetOpacities[i];
    });
    obs.isPassable = this.game.perspective === passableIn;

    this.obstacles.push(obs);
  }

  updateObstacleTarget(obs, perspective) {
    const passable = perspective === obs.passableIn;
    if (passable) {
      // Edge-on: squish one axis
      if (perspective === 'side') {
        obs.targetScale.set(0.15, 1, 1);
      } else {
        obs.targetScale.set(1, 1, 0.15);
      }
      obs.targetOpacities = obs.mesh.children.map((_, i) => i === 0 ? 0.25 : 0.08);
    } else {
      // Face-on: full size
      obs.targetScale.set(1, 1, 1);
      obs.targetOpacities = obs.mesh.children.map((_, i) => i === 0 ? 0.9 : 0.2);
    }
  }

  addEnemy(relY, pattern) {
    const dir = this.direction;
    const z = (relY - 0.5) * 10;
    const x = dir === 1 ? 15 : -15;
    const color = this.shipColor === 0x00ddff ? 0xff4444 : 0xff6644;

    const mesh = createEnemyMesh(color);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    this.enemies.push({
      mesh, pattern, color,
      startZ: z,
      time: 0,
      shootCooldown: 1.5 + Math.random() * 2,
    });
  }

  fireBullet() {
    const dir = this.direction;
    const mesh = createBulletMesh(this.shipColor);
    mesh.position.set(
      this.ship.position.x + dir * 1.5,
      0,
      this.ship.position.z
    );
    this.scene.add(mesh);
    this.bullets.push({ mesh });
  }

  fireEnemyBullet(enemy) {
    const mesh = createBulletMesh(0xff2222);
    mesh.position.copy(enemy.mesh.position);
    this.scene.add(mesh);
    this.enemyBullets.push({ mesh });
  }

  spawnEngineParticle() {
    const dir = this.direction;
    const geo = new THREE.SphereGeometry(0.06, 3, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: this.shipColor, transparent: true, opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      this.ship.position.x - dir * 1.2,
      0,
      this.ship.position.z + (Math.random() - 0.5) * 0.3
    );
    this.scene.add(mesh);
    this.engineParticles.push({
      mesh,
      vx: -dir * (3 + Math.random() * 5),
      vz: (Math.random() - 0.5) * 2,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
    });
  }

  spawnExplosion(x, z) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 3 + Math.random() * 6;
      const geo = new THREE.SphereGeometry(0.04, 3, 3);
      const mat = new THREE.MeshBasicMaterial({
        color: this.shipColor, transparent: true, opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);
      this.engineParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
      });
    }
  }

  hitShip() {
    // Flash effect
    const origColor = this.shipColor;
    this.ship.children.forEach((child) => {
      if (child.material) child.material.opacity = 0.1;
    });
    let flashes = 0;
    const flashInterval = setInterval(() => {
      flashes++;
      this.ship.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = flashes % 2 === 0 ? 0.1 : 1;
        }
      });
      if (flashes >= 10) {
        clearInterval(flashInterval);
        this.ship.children.forEach((child, i) => {
          if (child.material) child.material.opacity = i < 2 ? 1 : 0.6;
        });
      }
    }, 60);
  }

  // AI for inactive twin
  updateAI(dt) {
    const dir = this.direction;
    const speed = 8;
    const shipPos = this.ship.position;
    let targetZ = 0;
    let nearestThreatDist = Infinity;

    // Dodge obstacles
    this.obstacles.forEach((obs) => {
      if (obs.isPassable) return;
      const dx = (obs.mesh.position.x - shipPos.x) * dir;
      if (dx > 0 && dx < 8) {
        if (dx < nearestThreatDist) {
          nearestThreatDist = dx;
          targetZ = obs.mesh.position.z > 0 ? obs.mesh.position.z - 3 : obs.mesh.position.z + 3;
          targetZ = Math.max(-4.5, Math.min(4.5, targetZ));
        }
      }
    });

    // Dodge enemy bullets
    this.enemyBullets.forEach((bullet) => {
      const dx = Math.abs(bullet.mesh.position.x - shipPos.x);
      const dz = bullet.mesh.position.z - shipPos.z;
      if (dx < 3 && Math.abs(dz) < 2) {
        targetZ = shipPos.z + (dz > 0 ? -2.5 : 2.5);
        targetZ = Math.max(-4.5, Math.min(4.5, targetZ));
      }
    });

    // Target enemies
    let shouldShoot = false;
    this.enemies.forEach((enemy) => {
      const dx = (enemy.mesh.position.x - shipPos.x) * dir;
      if (dx > 0 && dx < 12 && nearestThreatDist > 4) {
        targetZ = enemy.mesh.position.z;
        if (Math.abs(shipPos.z - enemy.mesh.position.z) < 0.8) {
          shouldShoot = true;
        }
      }
    });

    // Move
    const dz = targetZ - shipPos.z;
    if (Math.abs(dz) > 0.3) {
      shipPos.z += Math.sign(dz) * speed * dt;
    }

    // Stay in safe X zone
    const safeX = dir === 1 ? -6 : 6;
    const driftX = safeX - shipPos.x;
    if (Math.abs(driftX) > 0.5) {
      shipPos.x += Math.sign(driftX) * speed * 0.3 * dt;
    }

    // Clamp
    shipPos.z = Math.max(-5, Math.min(5, shipPos.z));

    // Shoot
    this.aiShootCooldown -= dt;
    if (shouldShoot && this.aiShootCooldown <= 0) {
      this.fireBullet();
      this.aiShootCooldown = 0.4;
    }
  }
}
