import { World } from './World.js';

export class WorldB extends World {
  constructor(game) {
    super(game, 0xff44aa, -1); // Magenta, flies left (toward Twin A)
  }
}
