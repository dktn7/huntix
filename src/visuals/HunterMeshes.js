import * as THREE from 'three';

/** Flat placeholder body (depth 0.1) + PointLight. No animation or state. */
function createHunterGroup({ hunterType, width, height, bodyColor, lightColor, lightIntensity }) {
  const group = new THREE.Group();
  group.userData.hunterType = hunterType;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.1),
    new THREE.MeshBasicMaterial({ color: bodyColor })
  );
  group.add(body);

  const light = new THREE.PointLight(lightColor, lightIntensity);
  light.position.set(0, 0.5, 0.3);
  group.add(light);

  return group;
}

export function createDabik() {
  return createHunterGroup({
    hunterType: 'Dabik',
    width: 0.6,
    height: 1.2,
    bodyColor: 0x2d0040,
    lightColor: 0x8b4ddb,
    lightIntensity: 0.6,
  });
}

export function createBenzu() {
  return createHunterGroup({
    hunterType: 'Benzu',
    width: 0.8,
    height: 1.0,
    bodyColor: 0x3d1500,
    lightColor: 0xff9944,
    lightIntensity: 0.7,
  });
}

export function createSereisa() {
  return createHunterGroup({
    hunterType: 'Sereisa',
    width: 0.5,
    height: 1.2,
    bodyColor: 0x003d3d,
    lightColor: 0xb8ffff,
    lightIntensity: 0.6,
  });
}

export function createVesol() {
  return createHunterGroup({
    hunterType: 'Vesol',
    width: 0.65,
    height: 1.1,
    bodyColor: 0x3d1a00,
    lightColor: 0xff5522,
    lightIntensity: 0.7,
  });
}
