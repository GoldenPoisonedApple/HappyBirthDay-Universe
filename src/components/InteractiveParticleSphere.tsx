// インタラクティブなパーティクル球コンポーネント
// 地球のパーティクル表示、回転/公転アニメーション、ドラッグ操作を管理
import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { TILT_ANGLE } from '../constants';
import { createParticleSphereGeometry, createAxisLineGeometry } from '../utils/geometry';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { usePhysicsSimulation } from '../hooks/usePhysicsSimulation';
import {
  EARTH_RADIUS_ROTATION,
  EARTH_RADIUS_ORBIT,
  ORBIT_RADIUS,
  ORBIT_VELOCITY_DECAY_FACTOR,
  MIN_ORBIT_VELOCITY,
  SELF_ROTATION_RATIO,
  DRAG_SENSITIVITY_HORIZONTAL,
  DRAG_SENSITIVITY_ORBIT,
  POINTS_COUNT,
} from '../constants';

interface Props {
  mode: 'rotation' | 'orbit';
  onVerticalDrag: (deltaY: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
  onRotationChange?: (deltaRotation: number) => void;
}

// 地球をパーティクルで表現し、インタラクティブな操作を提供するメインコンポーネント
export default function InteractiveParticleSphere({ mode, onVerticalDrag, onEarthPositionChange, onRotationChange }: Props) {
  const rotationGroupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0);
  const orbitVelocityRef = useRef(0);
  const earthWorldPosition = useRef(new THREE.Vector3());

  // モードに応じて地球の半径を変更
  const earthRadius = mode === 'orbit' ? EARTH_RADIUS_ORBIT : EARTH_RADIUS_ROTATION;
  const orbitRadius = mode === 'orbit' ? ORBIT_RADIUS : 0;

  // パーティクルと軸線のジオメトリをメモ化
  const { pointsGeometry, lineGeometry } = useMemo(() => ({
    pointsGeometry: createParticleSphereGeometry(earthRadius, POINTS_COUNT),
    lineGeometry: createAxisLineGeometry(earthRadius),
  }), [earthRadius]);

  // 物理シミュレーションフックを使用
  const { setAngularVelocity, resetAngularVelocity, setIsDragging } = usePhysicsSimulation(
    rotationGroupRef,
    mode,
    onRotationChange
  );

  // ドラッグ開始時の処理
  const handleDragStart = useCallback(() => {
    resetAngularVelocity();
    setIsDragging(true);
  }, [resetAngularVelocity, setIsDragging]);

  // ドラッグ中の処理（水平方向）
  const handleDragMove = useCallback(
    (deltaX: number) => {
      if (mode === 'rotation') {
        // 自転モード：ドラッグで回転速度を変更
        setAngularVelocity(0, deltaX * DRAG_SENSITIVITY_HORIZONTAL);
      } else {
        // 公転モード：ドラッグで公転速度を調整
        orbitVelocityRef.current += deltaX * DRAG_SENSITIVITY_ORBIT;
      }
    },
    [setAngularVelocity, mode]
  );

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // ポインタドラッグフックを使用
  usePointerDrag(handleDragStart, handleDragMove, handleDragEnd, onVerticalDrag);

  // 公転アニメーションと位置更新
  useFrame((_, delta) => {
    if (mode === 'orbit' && orbitGroupRef.current) {
      // 公転速度を徐々に減衰させ、ゆっくりとした公転になる
      orbitVelocityRef.current *= Math.exp(-ORBIT_VELOCITY_DECAY_FACTOR * delta);
      orbitVelocityRef.current += MIN_ORBIT_VELOCITY; // 最低公転速度を維持

      orbitAngleRef.current += orbitVelocityRef.current * delta;
      orbitGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * orbitRadius;
      orbitGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * orbitRadius;

      // 自転（1公転 = 365自転）
      const selfRotationSpeed = orbitVelocityRef.current * SELF_ROTATION_RATIO;
      setAngularVelocity(0, selfRotationSpeed);
    }

    // 毎フレーム、地球位置を通知
    if (orbitGroupRef.current) {
      orbitGroupRef.current.getWorldPosition(earthWorldPosition.current);
      onEarthPositionChange(earthWorldPosition.current);
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