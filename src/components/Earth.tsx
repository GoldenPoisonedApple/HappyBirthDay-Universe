import type { MutableRefObject } from 'react';
import * as THREE from 'three';

interface EarthProps {
  groupRef: MutableRefObject<THREE.Group | null>;
  pointsGeometry: THREE.BufferGeometry;
  lineGeometry: THREE.BufferGeometry;
  radius: number;
}

export function Earth({ groupRef, pointsGeometry, lineGeometry, radius }: EarthProps) {
  return (
    <group ref={groupRef}>
      <points geometry={pointsGeometry}>
        <pointsMaterial color="white" size={radius * 0.015} sizeAttenuation={true} />
      </points>
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 'gray' }))} />
    </group>
  );
}
