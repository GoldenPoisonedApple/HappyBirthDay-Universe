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

import { Stars } from '@react-three/drei';

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
  const currentEarthRadius = useRef(EARTH_RADIUS_ORBIT);
  const currentOrbitRadius = useRef(ORBIT_RADIUS);
  
  // 惑星の位置を更新するためのRef
  const mercuryRef = useRef<THREE.Group>(null);
  const venusRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);

  // 公転アニメーションと位置更新
  const earthWorldPosition = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    // スムーズな遷移のための補間（1秒間に指定のスピードで近づく）
    currentEarthRadius.current += (targetEarthRadius - currentEarthRadius.current) * Math.min(1, delta * 6);
    currentOrbitRadius.current += (targetOrbitRadius - currentOrbitRadius.current) * Math.min(1, delta * 6);

    // 初期状態（半年前）が -π (180度) の位置から始まるように、シミュレーション時間に半年分の秒数をオフセットとして加える
    const HALF_YEAR_SECONDS = SECONDS_PER_YEAR / 2;
    const effectiveSimulatedSeconds = simulatedSeconds.current + HALF_YEAR_SECONDS;

    // 自転角度：1日(SECONDS_PER_DAY)で2π回転
    // 地球は西から東へ自転するので、Y軸周りに正の回転
    const rotationAngle = (effectiveSimulatedSeconds % SECONDS_PER_DAY) / SECONDS_PER_DAY * Math.PI * 2;
    
    // 公転角度：1年(SECONDS_PER_YEAR)で2π回転
    const orbitAngle = (effectiveSimulatedSeconds / SECONDS_PER_YEAR) * Math.PI * 2;

    // 惑星の位置更新（再レンダリングせずにRefを直接操作して軽量化）
    if (mode === 'orbit') {
      if (mercuryRef.current) {
        mercuryRef.current.position.x = Math.cos(orbitAngle * 4.15) * 6;
        mercuryRef.current.position.z = -Math.sin(orbitAngle * 4.15) * 6;
      }
      if (venusRef.current) {
        venusRef.current.position.x = Math.cos(orbitAngle * 1.62) * 11;
        venusRef.current.position.z = -Math.sin(orbitAngle * 1.62) * 11;
      }
      if (marsRef.current) {
        marsRef.current.position.x = Math.cos(orbitAngle * 0.53) * 26;
        marsRef.current.position.z = -Math.sin(orbitAngle * 0.53) * 26;
      }
    }

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
      orbitGroupRef.current.getWorldPosition(earthWorldPosition);
      onEarthPositionChange(earthWorldPosition);
    }
  });

  return (
    <>
      {/* 背景の星空 */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* 太陽（公転モードのみ） */}
      {mode === 'orbit' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
          <pointLight color="#ffffff" intensity={2} distance={100} />
        </mesh>
      )}

      {/* 他の惑星（公転モードのみ） */}
      {mode === 'orbit' && (
        <>
          {/* 水星 */}
          <group ref={mercuryRef}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>
          {/* 金星 */}
          <group ref={venusRef}>
            <mesh>
              <sphereGeometry args={[0.9, 32, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
          </group>
          {/* 火星 */}
          <group ref={marsRef}>
            <mesh>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
          </group>
        </>
      )}

      {/* 地球 */}
      <group ref={orbitGroupRef} position={[0, 0, 0]}>
        <group rotation={[0, 0, TILT_ANGLE]}>
          <group ref={rotationGroupRef}>
            <points geometry={pointsGeometry}>
              <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation={true} transparent opacity={0.8} />
            </points>
            <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }))} />
          </group>
        </group>
      </group>

      <ambientLight intensity={mode === 'orbit' ? 0.2 : 0.8} />
    </>
  );
}