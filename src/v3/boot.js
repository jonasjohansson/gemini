import Phaser from 'phaser';
import { GameScene } from './GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 512,
  height: 480,
  pixelArt: true,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

new Phaser.Game(config);
