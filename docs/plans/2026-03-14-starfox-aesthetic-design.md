# Gemini v4 — Star Fox SNES Aesthetic

## Core Concept

Two stacked Three.js viewports (top/bottom), each rendering a forward-scrolling rail corridor with SNES Star Fox flat-shaded polygon visuals. Same twin-ship + perspective-switch mechanics as v3.

## Visual Style

- Flat-shaded low-poly geometry — `MeshLambertMaterial` with `flatShading: true`, no textures
- Limited color palette — muted greens, blues, grays like SNES Star Fox's Super FX chip output
- Ground plane — checkerboard grid scrolling toward camera (iconic Star Fox ground)
- Sky — gradient or simple color with distant polygon mountains on horizon
- No anti-aliasing — crisp polygon edges, pixelated feel

## World Structure

- Camera on a rail, looking forward down a corridor
- Ground plane with scrolling checkerboard pattern
- Ships are low-poly Arwing-style models (a few triangles/quads)
- Obstacles are flat-shaded polyhedra (cubes, pyramids, columns) placed on ground or floating
- Enemies are simple polygon ships

## Perspective Switch (Shift key)

- Solid obstacles: flat-shaded, full color, collidable
- Passable obstacles: wireframe rendering (`MeshBasicMaterial({ wireframe: true })`), translucent, non-collidable
- Camera flash effect on switch

## Twin Mechanic (Tab key)

- Two viewport regions via scissor test, stacked vertically
- Same corridor content mirrored in both
- Active world = player controls, inactive = AI autopilot
- Divider bar rendered as HTML overlay

## Controls

- Arrow keys: move ship within the viewport (x/y offset from center rail)
- Space: shoot (polygon bullet projectiles)
- Shift: switch perspective
- Tab: swap active twin

## Collision

- Simple bounding-box checks in 3D space (no physics engine)

## File Structure

```
src/v4/
  boot.js        — Three.js setup, renderer, game loop
  GameScene.js   — main game logic, level processing
  models.js      — procedural geometry (ship, obstacles, enemies)
  ground.js      — scrolling checkerboard ground plane
```

## Level System

- Same LEVEL_SEGMENTS data structure as v3, reinterpreted for 3D z-depth positioning
- Obstacles spawn at far z and scroll toward camera
- y values map to vertical position, obstacles placed on ground or floating
