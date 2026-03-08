export class Input {
  constructor(game) {
    this.game = game;
    this.keys = {};

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        this.game.switchPerspective();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        this.game.swapActive();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  update(dt) {
    const world = this.game.activeWorld;
    const ship = world.ship;
    const dir = world.direction;
    const speed = 10;

    // Movement
    let vx = 0, vz = 0;
    if (this.keys['ArrowLeft']) vx = -speed * dir;
    if (this.keys['ArrowRight']) vx = speed * dir;
    if (this.keys['ArrowUp']) vz = -speed;
    if (this.keys['ArrowDown']) vz = speed;

    ship.position.x += vx * dt;
    ship.position.z += vz * dt;

    // Clamp
    ship.position.x = Math.max(world.shipBounds.minX, Math.min(world.shipBounds.maxX, ship.position.x));
    ship.position.z = Math.max(world.shipBounds.minZ, Math.min(world.shipBounds.maxZ, ship.position.z));

    // Tilt on Z movement (Star Fox style)
    const tiltTarget = (vz / speed) * 0.3;
    ship.rotation.x += (tiltTarget - ship.rotation.x) * 5 * dt;

    // Shoot
    if (this.keys['Space']) {
      if (!this._shootCooldown || this._shootCooldown <= 0) {
        world.fireBullet();
        this._shootCooldown = 0.15;
      }
    }
    if (this._shootCooldown > 0) this._shootCooldown -= dt;
  }
}
