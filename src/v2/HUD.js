export class HUD {
  constructor(game) {
    this.game = game;

    // Create HUD overlay
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10;
      font-family: 'Courier New', monospace;
      color: #446688;
    `;
    document.body.appendChild(this.el);

    // Divider line
    this.divider = document.createElement('div');
    this.divider.style.cssText = `
      position: absolute; left: 0; width: 100%;
      top: 50%; transform: translateY(-50%);
      height: 4px;
      background: linear-gradient(to right, #00ddff22, #334466, #ff44aa22);
      box-shadow: 0 0 8px #33446644;
    `;
    this.el.appendChild(this.divider);

    // Title
    this.title = document.createElement('div');
    this.title.style.cssText = `
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px; letter-spacing: 6px; color: #445577;
    `;
    this.title.textContent = 'GEMINI';
    this.el.appendChild(this.title);

    // Score
    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = `
      position: absolute; right: 20px; top: 50%;
      transform: translateY(-50%);
      font-size: 11px; color: #445577;
    `;
    this.el.appendChild(this.scoreEl);

    // Perspective indicator
    this.perspEl = document.createElement('div');
    this.perspEl.style.cssText = `
      position: absolute; left: 20px; top: 50%;
      transform: translateY(-50%);
      font-size: 11px; color: #445577;
    `;
    this.el.appendChild(this.perspEl);

    // Active indicators
    this.indicatorA = document.createElement('div');
    this.indicatorA.style.cssText = `
      position: absolute; right: 15px; top: 25%;
      transform: translateY(-50%);
      font-size: 14px; color: #00ddff;
    `;
    this.indicatorA.textContent = '◄';
    this.el.appendChild(this.indicatorA);

    this.indicatorB = document.createElement('div');
    this.indicatorB.style.cssText = `
      position: absolute; left: 15px; bottom: 25%;
      transform: translateY(50%);
      font-size: 14px; color: #ff44aa;
    `;
    this.el.appendChild(this.indicatorB);

    // Controls hint
    this.controls = document.createElement('div');
    this.controls.style.cssText = `
      position: absolute; bottom: 10px; left: 50%;
      transform: translateX(-50%);
      font-size: 9px; color: #222244;
    `;
    this.controls.textContent = 'ARROWS · SPACE shoot · SHIFT perspective · TAB swap';
    this.el.appendChild(this.controls);
  }

  update() {
    this.scoreEl.textContent = this.game.score;
    this.perspEl.textContent = this.game.perspective.toUpperCase();

    const isA = this.game.activeWorld === this.game.worldA;
    this.indicatorA.textContent = isA ? '◄' : '';
    this.indicatorB.textContent = isA ? '' : '►';
  }
}
