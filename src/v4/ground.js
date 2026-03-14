import * as THREE from 'three';
import { COLORS } from './models.js';

const GRID_SIZE = 40;
const TILE_SIZE = 2;

export function createGround() {
  const geo = new THREE.PlaneGeometry(
    GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE,
    GRID_SIZE, GRID_SIZE
  );
  geo.rotateX(-Math.PI / 2);

  const colorA = new THREE.Color(COLORS.groundA);
  const colorB = new THREE.Color(COLORS.groundB);

  const nonIndexed = geo.toNonIndexed();
  const posAttr = nonIndexed.getAttribute('position');
  const count = posAttr.count;
  const colors = [];

  for (let i = 0; i < count; i += 6) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const tileX = Math.floor((x + GRID_SIZE * TILE_SIZE / 2) / TILE_SIZE);
    const tileZ = Math.floor((z + GRID_SIZE * TILE_SIZE / 2) / TILE_SIZE);
    const c = (tileX + tileZ) % 2 === 0 ? colorA : colorB;

    for (let j = 0; j < 6; j++) {
      colors.push(c.r, c.g, c.b);
    }
  }

  nonIndexed.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(nonIndexed, mat);
  mesh.position.y = -2;

  return mesh;
}

export function updateGround(mesh, dt, speed) {
  mesh.position.z += speed * dt;
  if (mesh.position.z > TILE_SIZE * 2) {
    mesh.position.z -= TILE_SIZE * 2;
  }
}

export function createMountains() {
  const group = new THREE.Group();

  for (let i = 0; i < 8; i++) {
    const h = 4 + Math.random() * 8;
    const w = 3 + Math.random() * 5;
    const geo = new THREE.ConeGeometry(w, h, 4 + Math.floor(Math.random() * 3));
    const shade = 0.3 + Math.random() * 0.15;
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(shade, shade + 0.05, shade),
      flatShading: true,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(-30 + i * 8 + Math.random() * 4, h / 2 - 2, -60);
    group.add(m);
  }

  return group;
}
