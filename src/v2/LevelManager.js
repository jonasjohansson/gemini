const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

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

  // ACT 4: Weave
  { at: 22, obstacles: [{ y: 0.4, type: 'big', passable: VIEW_SIDE }] },
  { at: 23, obstacles: [{ y: 0.6, type: 'big', passable: VIEW_TOP }] },
  { at: 24, obstacles: [{ y: 0.3, type: 'big', passable: VIEW_SIDE }] },
  { at: 25, obstacles: [{ y: 0.7, type: 'big', passable: VIEW_TOP }] },
  { at: 26, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_SIDE }] },
  { at: 26.8, obstacles: [{ y: 0.5, type: 'big', passable: VIEW_TOP }] },

  // ACT 5: Maze
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

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.segmentIndex = 0;
  }

  update(dt) {
    const segTime = this.game.levelTime - this.game.loopCount * LEVEL_LOOP;

    while (
      this.segmentIndex < LEVEL_SEGMENTS.length &&
      LEVEL_SEGMENTS[this.segmentIndex].at <= segTime
    ) {
      const seg = LEVEL_SEGMENTS[this.segmentIndex];
      this.spawnSegment(this.game.worldA, seg);
      this.spawnSegment(this.game.worldB, seg);
      this.segmentIndex++;
    }

    if (segTime >= LEVEL_LOOP) {
      this.game.loopCount++;
      this.segmentIndex = 0;
    }
  }

  spawnSegment(world, seg) {
    if (seg.obstacles) {
      seg.obstacles.forEach((def) => {
        world.addObstacle(def.y, def.type, def.passable);
      });
    }
    if (seg.enemies) {
      seg.enemies.forEach((def) => {
        world.addEnemy(def.y, def.pattern);
      });
    }
  }
}
