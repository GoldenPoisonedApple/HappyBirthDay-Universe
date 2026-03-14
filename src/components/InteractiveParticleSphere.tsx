import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { TILT_ANGLE } from '../constants';
import { createParticleSphereGeometry, createAxisLineGeometry } from '../utils/geometry';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { usePhysicsSimulation } from '../hooks/usePhysicsSimulation';

interface Props {
  mode: 'rotation' | 'orbit';
  onVerticalDrag: (deltaY: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
}

export default function InteractiveParticleSphere({ mode, onVerticalDrag, onEarthPositionChange }: Props) {
  const rotationGroupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0);
  const orbitVelocityRef = useRef(0);
  const earthPosTemp = useRef(new THREE.Vector3());

  const earthRadius = mode === 'orbit' ? 1.2 : 2;
  const orbitRadius = mode === 'orbit' ? 18 : 0;

  const { pointsGeometry, lineGeometry } = useMemo(() => {
    const pointsCount = 1000;
    return {
      pointsGeometry: createParticleSphereGeometry(earthRadius, pointsCount),
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
        // 公転モード: ドラッグで公転速度を調整
        orbitVelocityRef.current += deltaX * 0.0005;
      }
    },
    [setAngularVelocity, mode]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  usePointerDrag(handleDragStart, handleDragMove, handleDragEnd, onVerticalDrag);

  // 公転アニメーション
  useFrame((_, delta) => {
    if (mode === 'orbit' && orbitGroupRef.current) {
      // 公転速度を徐々に減衰させ、ゆっくりとした公転になる
      orbitVelocityRef.current *= Math.exp(-2.0 * delta);
      orbitVelocityRef.current += 0.0001; // 最低公転速度を維持

      orbitAngleRef.current += orbitVelocityRef.current * delta;
      orbitGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * orbitRadius;
      orbitGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * orbitRadius;

      // 自転（1公転 = 365自転）
      const selfSpeed = orbitVelocityRef.current * 365;
      setAngularVelocity(0, selfSpeed);
    }

    // 毎フレーム、地球位置を通知
    if (orbitGroupRef.current) {
      orbitGroupRef.current.getWorldPosition(earthPosTemp.current);
      onEarthPositionChange(earthPosTemp.current);
    }
  });

  return (
    <>
      {/* 太陽（公転モードのみ） */}
      {mode === 'orbit' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}

      {/* 地球 */}
      <group ref={orbitGroupRef} position={mode === 'orbit' ? [10, 0, 0] : [0, 0, 0]}>
        <group rotation={[0, 0, TILT_ANGLE]}>
          <group ref={rotationGroupRef}>
            <points geometry={pointsGeometry}>
              <pointsMaterial color="white" size={0.03} sizeAttenuation={true} />
            </points>
            <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 'gray' }))} />
          </group>
        </group>
      </group>
    </>
  );
}