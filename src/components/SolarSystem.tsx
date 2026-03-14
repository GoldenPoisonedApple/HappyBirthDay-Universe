import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { usePhysicsSimulation } from '../hooks/usePhysicsSimulation';
import { Earth } from './Earth';
import { createAxisLineGeometry, createParticleSphereGeometry } from '../utils/geometry';

export type PhysicsMode = 'rotation' | 'orbit';

interface SolarSystemProps {
  mode: PhysicsMode;
  onVerticalDrag: (deltaY: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
}

export function SolarSystem({ mode, onVerticalDrag, onEarthPositionChange }: SolarSystemProps) {
  const orbitGroupRef = useRef<THREE.Group>(null);
  const rotationGroupRef = useRef<THREE.Group>(null);

  const orbitAngleRef = useRef(0);
  const orbitVelocityRef = useRef(0);
  const earthPosTemp = useRef(new THREE.Vector3());

  const earthRadius = mode === 'orbit' ? 1.2 : 2;
  const orbitRadius = mode === 'orbit' ? 18 : 0;

  const { pointsGeometry, lineGeometry } = useMemo(() => {
    return {
      pointsGeometry: createParticleSphereGeometry(earthRadius, 1000),
      lineGeometry: createAxisLineGeometry(earthRadius),
    };
  }, [earthRadius]);

  const { setAngularVelocity, resetAngularVelocity, setIsDragging } = usePhysicsSimulation(
    rotationGroupRef,
    mode
  );

  const handleDragStart = useCallback(() => {
    resetAngularVelocity();
    setIsDragging(true);
  }, [resetAngularVelocity, setIsDragging]);

  const handleDragMove = useCallback(
    (deltaX: number) => {
      if (mode === 'rotation') {
        setAngularVelocity(0, deltaX * 0.005);
      } else {
        orbitVelocityRef.current += deltaX * 0.0005;
      }
    },
    [mode, setAngularVelocity]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  usePointerDrag(handleDragStart, handleDragMove, handleDragEnd, onVerticalDrag);

  useFrame((_, delta) => {
    if (mode === 'orbit' && orbitGroupRef.current) {
      orbitVelocityRef.current *= Math.exp(-2.0 * delta);
      orbitVelocityRef.current += 0.0001;
      orbitAngleRef.current += orbitVelocityRef.current * delta;

      orbitGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * orbitRadius;
      orbitGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * orbitRadius;

      const selfSpeed = orbitVelocityRef.current * 365;
      setAngularVelocity(0, selfSpeed);
    }

    if (orbitGroupRef.current) {
      orbitGroupRef.current.getWorldPosition(earthPosTemp.current);
      onEarthPositionChange(earthPosTemp.current);
    }
  });

  return (
    <>
      {mode === 'orbit' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}

      <group ref={orbitGroupRef} position={mode === 'orbit' ? [orbitRadius, 0, 0] : [0, 0, 0]}>
        <group rotation={[0, 0, 0]}>
          <Earth groupRef={rotationGroupRef} pointsGeometry={pointsGeometry} lineGeometry={lineGeometry} radius={earthRadius} />
        </group>
      </group>
    </>
  );
}
