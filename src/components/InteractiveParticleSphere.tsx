// インタラクティブなパーティクル球コンポーネント
// 地球のパーティクル表示、回転/公転アニメーション、ドラッグ操作を管理
import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TILT_ANGLE } from '../constants';
import { createParticleSphereGeometry, createAxisLineGeometry } from '../utils/geometry';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { useTimeSimulation } from '../hooks/usePhysicsSimulation';
import {
  EARTH_RADIUS_ROTATION,
  EARTH_RADIUS_ORBIT,
  ORBIT_RADIUS,
  DRAG_TIME_SENSITIVITY_ROTATION,
  DRAG_TIME_SENSITIVITY_ORBIT,
  POINTS_COUNT,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR,
} from '../constants';

interface Props {
  mode: 'rotation' | 'orbit';
  onVerticalDrag: (deltaY: number) => void;
  onTimeUpdate: (simulatedSeconds: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
}

// 地球をパーティクルで表現し、インタラクティブな操作を提供するメインコンポーネント
export default function InteractiveParticleSphere({ mode, onVerticalDrag, onTimeUpdate, onEarthPositionChange }: Props) {
  const rotationGroupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const earthWorldPosition = useRef(new THREE.Vector3());

  // ジオメトリを共通化（半径1で作成し、スケールで調整）
  const { pointsGeometry, lineGeometry } = useMemo(() => ({
    pointsGeometry: createParticleSphereGeometry(1, POINTS_COUNT),
    lineGeometry: createAxisLineGeometry(1),
  }), []);

  // 物理シミュレーションフックを使用
  const { addSimulatedTime, setIsDragging, simulatedSeconds } = useTimeSimulation(
    mode,
    onTimeUpdate
  );

  // ドラッグ開始時の処理
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, [setIsDragging]);

  // ドラッグ中の処理（水平方向）
  const handleDragMove = useCallback(
    (deltaX: number, deltaY: number, deltaTime: number) => {
      // 横方向のドラッグで時間を進める（右ドラッグで未来へ）
      const timeToAdd = mode === 'rotation' 
        ? deltaX * DRAG_TIME_SENSITIVITY_ROTATION 
        : deltaX * DRAG_TIME_SENSITIVITY_ORBIT;
      
      addSimulatedTime(timeToAdd, deltaTime);
      onVerticalDrag(deltaY);
    },
    [mode, addSimulatedTime, onVerticalDrag]
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

    const currentSimulatedSeconds = simulatedSeconds.current;

    // 自転角度：1日(SECONDS_PER_DAY)で2π回転
    // 地球は西から東へ自転するので、Y軸周りに正の回転
    const rotationAngle = (currentSimulatedSeconds % SECONDS_PER_DAY) / SECONDS_PER_DAY * Math.PI * 2;
    
    // 公転角度：1年(SECONDS_PER_YEAR)で2π回転
    const orbitAngle = (currentSimulatedSeconds % SECONDS_PER_YEAR) / SECONDS_PER_YEAR * Math.PI * 2;

    if (orbitGroupRef.current) {
      // 太陽を中心とした反時計回りの軌道（Z軸はマイナス方向が画面奥）
      orbitGroupRef.current.position.x = Math.cos(orbitAngle) * currentOrbitRadius.current;
      orbitGroupRef.current.position.z = -Math.sin(orbitAngle) * currentOrbitRadius.current;
    }

    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y = rotationAngle;
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