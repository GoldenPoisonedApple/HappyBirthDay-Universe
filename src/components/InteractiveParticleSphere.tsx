// インタラクティブなパーティクル球コンポーネント
// 地球のパーティクル表示、回転/公転アニメーション、ドラッグ操作を管理
import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TILT_ANGLE } from '../constants';
import { createParticleSphereGeometry, createAxisLineGeometry } from '../utils/geometry';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { usePhysicsSimulation } from '../hooks/usePhysicsSimulation';
import {
  EARTH_RADIUS_ROTATION,
  EARTH_RADIUS_ORBIT,
  ORBIT_RADIUS,
  DRAG_SENSITIVITY_HORIZONTAL,
  POINTS_COUNT,
  SELF_ROTATION_RATIO,
} from '../constants';

interface Props {
  mode: 'rotation' | 'orbit';
  onVerticalDrag: (deltaY: number) => void;
  onRotationChange?: (deltaRotation: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
}

// 地球をパーティクルで表現し、インタラクティブな操作を提供するメインコンポーネント
export default function InteractiveParticleSphere({ mode, onVerticalDrag, onRotationChange, onEarthPositionChange }: Props) {
  const rotationGroupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0);
  const earthWorldPosition = useRef(new THREE.Vector3());

  // ジオメトリを共通化（半径1で作成し、スケールで調整）
  const { pointsGeometry, lineGeometry } = useMemo(() => ({
    pointsGeometry: createParticleSphereGeometry(1, POINTS_COUNT),
    lineGeometry: createAxisLineGeometry(1),
  }), []);

  // 物理シミュレーションフックを使用
  const { setAngularVelocity, resetAngularVelocity, setIsDragging, angularVelocity } = usePhysicsSimulation(
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
    (deltaX: number, deltaY: number) => {
      if (mode === 'rotation') {
        // 自転モード：ドラッグで回転速度を変更
        setAngularVelocity(0, deltaX * DRAG_SENSITIVITY_HORIZONTAL);
      } else {
        // 公転モード：ドラッグで自転速度を調整（これが公転速度も決定）
        setAngularVelocity(0, deltaX * DRAG_SENSITIVITY_HORIZONTAL);
      }
      onVerticalDrag(deltaY);
    },
    [setAngularVelocity, mode, onVerticalDrag]
  );

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // ポインタドラッグフックを使用
  usePointerDrag(handleDragStart, handleDragMove, handleDragEnd);

  // モードに応じた目標値
  const targetEarthRadius = mode === 'orbit' ? EARTH_RADIUS_ORBIT : EARTH_RADIUS_ROTATION;
  const targetOrbitRadius = mode === 'orbit' ? ORBIT_RADIUS : 0;

  // 現在の値を保持するRef
  const currentEarthRadius = useRef(EARTH_RADIUS_ROTATION);
  const currentOrbitRadius = useRef(0);

  // 公転アニメーションと位置更新
  useFrame((_, delta) => {
    // スムーズな遷移のための補間（1秒間に指定のスピードで近づく）
    currentEarthRadius.current += (targetEarthRadius - currentEarthRadius.current) * Math.min(1, delta * 6);
    currentOrbitRadius.current += (targetOrbitRadius - currentOrbitRadius.current) * Math.min(1, delta * 6);

    if (orbitGroupRef.current) {
      if (mode === 'orbit' || currentOrbitRadius.current > 0.1) {
        // 自転速度に基づいて公転速度を計算（1公転 = 365自転）
        const currentRotationSpeed = angularVelocity.current.y;
        const orbitSpeed = currentRotationSpeed / SELF_ROTATION_RATIO;

        orbitAngleRef.current += orbitSpeed * delta;
      }
      
      orbitGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * currentOrbitRadius.current;
      orbitGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * currentOrbitRadius.current;
    }

    if (rotationGroupRef.current) {
      rotationGroupRef.current.scale.setScalar(currentEarthRadius.current);
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
      <group ref={orbitGroupRef} position={[0, 0, 0]}>
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