import * as THREE from 'three';
import { WorldA } from './WorldA.js';
import { WorldB } from './WorldB.js';
import { LevelManager } from './LevelManager.js';
import { Input } from './Input.js';
import { HUD } from './HUD.js';

const VIEW_SIDE = 'side';
const VIEW_TOP = 'top';

export class Game {
  constructor() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.autoClear = false;
    document.body.appendChild(this.renderer.domElement);

    // State
    this.perspective = VIEW_SIDE;
    this.score = 0;
    this.scrollSpeed = 6;
    this.levelTime = 0;
    this.loopCount = 0;
    this.clock = new THREE.Clock();

    // Two worlds — each with their own scene and camera
    this.worldA = new WorldA(this);
    this.worldB = new WorldB(this);
    this.activeWorld = this.worldA;
    this.inactiveWorld = this.worldB;

    // Level
    this.level = new LevelManager(this);

    // Input
    this.input = new Input(this);

    // HUD
    this.hud = new HUD(this);

    // Resize
    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }

  start() {
    this.renderer.setAnimationLoop(() => this.update());
  }

  update() {
    const dt = this.clock.getDelta();
    this.levelTime += dt;

    const speed = this.scrollSpeed + this.loopCount * 0.8;

    this.level.update(dt);
    this.worldA.update(dt, speed);
    this.worldB.update(dt, speed);
    this.input.update(dt);
    this.hud.update();

    // Render both worlds (split screen)
    this.renderer.clear();

    const h = window.innerHeight;
    const w = window.innerWidth;
    const halfH = Math.floor(h / 2) - 2;

    // World A — top half
    this.renderer.setViewport(0, halfH + 4, w, halfH);
    this.renderer.setScissor(0, halfH + 4, w, halfH);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.worldA.scene, this.worldA.camera);

    // World B — bottom half
    this.renderer.setViewport(0, 0, w, halfH);
    this.renderer.setScissor(0, 0, w, halfH);
    this.renderer.render(this.worldB.scene, this.worldB.camera);

    this.renderer.setScissorTest(false);
  }

  switchPerspective() {
    this.perspective = this.perspective === VIEW_SIDE ? VIEW_TOP : VIEW_SIDE;
    this.worldA.onPerspectiveChange(this.perspective);
    this.worldB.onPerspectiveChange(this.perspective);
    this.hud.update();
  }

  swapActive() {
    if (this.activeWorld === this.worldA) {
      this.activeWorld = this.worldB;
      this.inactiveWorld = this.worldA;
    } else {
      this.activeWorld = this.worldA;
      this.inactiveWorld = this.worldB;
    }
    this.hud.update();
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);

    const aspect = w / (h / 2);
    this.worldA.onResize(aspect);
    this.worldB.onResize(aspect);
  }
}
