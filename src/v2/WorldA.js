import { World } from './World.js';

export class WorldA extends World {
  constructor(game) {
    super(game, 0x00ddff, 1); // Cyan, flies right
  }
}
