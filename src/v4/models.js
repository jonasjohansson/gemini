import * as THREE from 'three';

const COLORS = {
  shipBody: 0x8888aa,
  shipWing: 0x6666ff,
  shipNose: 0xccccdd,
  obsSide: 0xcc6622,
  obsTop: 0x2266cc,
  obsWire: 0x446688,
  enemy: 0xcc2222,
  enemyWing: 0x881111,
  bullet: 0x44ff44,
  enemyBullet: 0xff4444,
  groundA: 0x338833,
  groundB: 0x226622,
  mountain: 0x556655,
  sky: 0x4488cc,
};

export { COLORS };

export function createShip() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.ConeGeometry(0.3, 1.8, 4);
  bodyGeo.rotateX(-Math.PI / 2);
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.shipBody, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const noseGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
  noseGeo.rotateX(-Math.PI / 2);
  const noseMat = new THREE.MeshLambertMaterial({ color: COLORS.shipNose, flatShading: true });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.z = -1.0;
  group.add(nose);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(-1.2, -0.3);
  wingShape.lineTo(-0.2, 0);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
  const wingMat = new THREE.MeshLambertMaterial({ color: COLORS.shipWing, flatShading: true });

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.1, 0, 0.2);
  group.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat.clone());
  wingR.scale.x = -1;
  wingR.position.set(0.1, 0, 0.2);
  group.add(wingR);

  return group;
}

export function createObstacle(type) {
  const color = type === 'S' ? COLORS.obsSide : COLORS.obsTop;
  const group = new THREE.Group();

  const geo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const capGeo = new THREE.ConeGeometry(0.85, 0.8, 4);
  const capMat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.65;
  group.add(cap);

  group.userData.solidMaterials = [mat, capMat];
  group.userData.type = type;

  return group;
}

export function createEnemy() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.ConeGeometry(0.4, 1.2, 4);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.enemy, flatShading: true });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  const wingGeo = new THREE.BoxGeometry(1.8, 0.05, 0.6);
  const wingMat = new THREE.MeshLambertMaterial({ color: COLORS.enemyWing, flatShading: true });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.z = 0.2;
  group.add(wings);

  return group;
}

export function createBullet() {
  const geo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.bullet });
  return new THREE.Mesh(geo, mat);
}

export function createEnemyBullet() {
  const geo = new THREE.SphereGeometry(0.12, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.enemyBullet });
  return new THREE.Mesh(geo, mat);
}

export function createExplosion() {
  const group = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.TetrahedronGeometry(0.15);
    const mat = new THREE.MeshBasicMaterial({
      color: [0xffffff, 0xffff44, 0xff6600, 0xff2200][i % 4],
    });
    const shard = new THREE.Mesh(geo, mat);
    const angle = (i / 8) * Math.PI * 2;
    shard.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * (2 + Math.random() * 3),
      Math.sin(angle) * (2 + Math.random() * 3),
      (Math.random() - 0.5) * 2,
    );
    group.add(shard);
  }
  group.userData.age = 0;
  group.userData.maxAge = 0.5;
  return group;
}
