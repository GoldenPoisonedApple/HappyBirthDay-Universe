import * as THREE from 'three';

// 球面上にランダムに点を配置するジオメトリを作成
export function createParticleSphereGeometry(radius: number, pointsCount: number) {
  const points = new THREE.BufferGeometry();
  const positions = new Float32Array(pointsCount * 3);

  for (let i = 0; i < pointsCount; i++) {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = radius * Math.cos(theta);
  }
  points.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return points;
}

// 球の回転軸を示す線のジオメトリを作成
export function createAxisLineGeometry(radius: number) {
  const line = new THREE.BufferGeometry();
  const linePositions = new Float32Array([0, radius * 1.2, 0, 0, -radius * 1.2, 0]);
  line.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  return line;
}