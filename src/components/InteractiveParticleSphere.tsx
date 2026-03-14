// インタラクティブなパーティクル球コンポーネント
// 地球のパーティクル表示、回転/公転アニメーション、ドラッグ操作を管理
import { useRef, useMemo, useCallback, useState } from 'react';
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

import { Stars, Sparkles, Trail } from '@react-three/drei';

interface Props {
  mode: 'rotation' | 'orbit';
  onVerticalDrag: (deltaY: number) => void;
  onTimeUpdate: (simulatedSeconds: number) => void;
  onEarthPositionChange: (pos: THREE.Vector3) => void;
  showBirthday: boolean;
}

// 花火を管理するコンポーネント
function Fireworks() {
  const [particles, setParticles] = useState<{ id: number; position: THREE.Vector3; velocity: THREE.Vector3; age: number; lifespan: number; color: string; size: number }[]>([]);
  const lastSpawnTime = useRef(0);

  const colors = ['#ff3366', '#33ccff', '#ffcc00', '#ffffff', '#ff99ff'];

  useFrame((state, delta) => {
    // ランダムな間隔で花火を打ち上げる
    if (state.clock.elapsedTime - lastSpawnTime.current > 0.8 + Math.random() * 1.5) {
      lastSpawnTime.current = state.clock.elapsedTime;
      
      // 打ち上げ位置（地球の近くの空間）
      const originX = (Math.random() - 0.5) * 40;
      const originY = (Math.random() - 0.5) * 30 + 10; // 少し上の方
      const originZ = (Math.random() - 0.5) * 40;
      const origin = new THREE.Vector3(originX, originY, originZ);
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const numParticles = 30 + Math.floor(Math.random() * 30); // 30〜60個のパーティクル
      
      const newParticles: { id: number; position: THREE.Vector3; velocity: THREE.Vector3; age: number; lifespan: number; color: string; size: number }[] = [];
      for (let i = 0; i < numParticles; i++) {
        // 球状に広がるランダムな速度ベクトル
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 5 + Math.random() * 15;
        
        const velocity = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        );

        newParticles.push({
          id: Math.random(),
          position: origin.clone(),
          velocity,
          age: 0,
          lifespan: 1.0 + Math.random() * 1.0, // 1.0〜2.0秒
          color,
          size: 0.1 + Math.random() * 0.2
        });
      }
      
      setParticles(prev => [...prev, ...newParticles]);
    }

    // パーティクルの更新
    setParticles(prev => {
      const nextParticles: { id: number; position: THREE.Vector3; velocity: THREE.Vector3; age: number; lifespan: number; color: string; size: number }[] = prev.map(p => {
        // 重力による落下と空気抵抗
        const newVel = p.velocity.clone();
        newVel.y -= 9.8 * delta; // 重力
        newVel.multiplyScalar(0.95); // 空気抵抗

        const newPos = p.position.clone().addScaledVector(newVel, delta);
        return { ...p, position: newPos, velocity: newVel, age: p.age + delta };
      }).filter(p => p.age <= p.lifespan);
      return nextParticles;
    });
  });

  return (
    <group>
      {particles.map(p => (
        <mesh key={p.id} position={p.position}>
          <sphereGeometry args={[p.size]} />
          <meshBasicMaterial 
            color={p.color} 
            transparent 
            opacity={Math.max(0, 1 - (p.age / p.lifespan))} // 徐々に消える
          />
        </mesh>
      ))}
    </group>
  );
}

// 流れ星を管理するコンポーネント
function ShootingStars() {
  const [stars, setStars] = useState<{ id: number, position: THREE.Vector3, velocity: THREE.Vector3, age: number, lifespan: number, color: string }[]>([]);
  const lastSpawnTime = useRef(0);

  // 流れ星の色のバリエーション（純白、青白、金など）
  const starColors = ['#ffffff', '#ffffff', '#ffffff', '#ccffff', '#ffeeaa'];

  useFrame((state, delta) => {
    // ランダムに流れ星を生成 (毎秒平均2〜3個程度)
    if (state.clock.elapsedTime - lastSpawnTime.current > 0.1) {
      lastSpawnTime.current = state.clock.elapsedTime;
      
      if (Math.random() < 0.4) {
        const startX = (Math.random() - 0.5) * 60 + 10;
        const startY = (Math.random() - 0.5) * 40 + 20;
        const startZ = (Math.random() - 0.5) * 60;
        
        const newStar = {
          id: Math.random(),
          position: new THREE.Vector3(startX, startY, startZ),
          velocity: new THREE.Vector3(
            -30 - Math.random() * 20, // 左へ速く流れる
            -20 - Math.random() * 20, // 下へ速く流れる
            (Math.random() - 0.5) * 10
          ),
          age: 0,
          lifespan: Math.random() * 0.4 + 0.4, // 0.4〜0.8秒で消える
          color: starColors[Math.floor(Math.random() * starColors.length)]
        };
        
        setStars(prev => [...prev, newStar]);
      }
    }

    // 流れ星の更新と削除
    setStars(prev => {
      const nextStars = prev.map(star => {
        const newPos = star.position.clone().addScaledVector(star.velocity, delta);
        return { ...star, position: newPos, age: star.age + delta };
      }).filter(star => star.age <= star.lifespan);

      return nextStars;
    });
  });

  return (
    <>
      {stars.map(star => (
        <Trail
          key={star.id}
          width={1.5} // 尾の太さ
          length={4}  // 尾の長さ
          color={new THREE.Color(star.color)} // 星の色
          attenuation={(t) => t * t} // 先端に向かって細くなる
        >
          <mesh position={star.position}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={star.color} transparent opacity={1 - (star.age / star.lifespan)} />
          </mesh>
        </Trail>
      ))}
    </>
  );
}

// 地球をパーティクルで表現し、インタラクティブな操作を提供するメインコンポーネント
export default function InteractiveParticleSphere({ mode, onVerticalDrag, onTimeUpdate, onEarthPositionChange, showBirthday }: Props) {
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

  // 毎フレーム、地球位置を通知
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

      {/* 流星（シューティングスター）の演出 */}
      {showBirthday && <ShootingStars />}

      {/* 花火の演出 */}
      {showBirthday && <Fireworks />}

      {/* 空間全体を漂う光の粒子（Sparkles） */}
      <Sparkles count={200} scale={50} size={10} speed={0.4} opacity={0.2} color="#ffffff" />

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