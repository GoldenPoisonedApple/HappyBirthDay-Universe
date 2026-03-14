import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import { TILT_ANGLE } from '../constants';
import { createParticleSphereGeometry, createAxisLineGeometry } from '../utils/geometry';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { usePhysicsSimulation } from '../hooks/usePhysicsSimulation';

export default function InteractiveParticleSphere() {
  const rotationGroupRef = useRef<THREE.Group>(null);

  const { pointsGeometry, lineGeometry } = useMemo(() => {
    const radius = 2;
    const pointsCount = 1000;
    return {
      pointsGeometry: createParticleSphereGeometry(radius, pointsCount),
      lineGeometry: createAxisLineGeometry(radius),
    };
  }, []);

  const { setAngularVelocity, resetAngularVelocity, setIsDragging } = usePhysicsSimulation(rotationGroupRef);

  const handleDragStart = useCallback(() => {
    resetAngularVelocity();
    setIsDragging(true);
  }, [resetAngularVelocity, setIsDragging]);

  const handleDragMove = useCallback((deltaX: number) => {
    setAngularVelocity(0, deltaX * 0.005);
  }, [setAngularVelocity]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  usePointerDrag(handleDragStart, handleDragMove, handleDragEnd);

  return (
    <group rotation={[0, 0, TILT_ANGLE]}>
      <group ref={rotationGroupRef}>
        <points geometry={pointsGeometry}>
          <pointsMaterial color="white" size={0.03} sizeAttenuation={true} />
        </points>
        <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 'gray' }))} />
      </group>
    </group>
  );
}