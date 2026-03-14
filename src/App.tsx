import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const TILT_ANGLE = -23.4 * (Math.PI / 180);

function InteractiveParticleSphere() {
  const rotationGroupRef = useRef<THREE.Group>(null);
  
  // 物理演算用の状態管理
  // Reactの再レンダリング（パフォーマンス低下）を避けるため、全て useRef で状態を保持する
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const angularVelocity = useRef({ x: 0, y: 0 }); // 角速度ベクトル

  const { pointsGeometry, lineGeometry } = useMemo(() => {
    const radius = 2;
    const pointsCount = 1000;
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

    const line = new THREE.BufferGeometry();
    const linePositions = new Float32Array([0, radius * 1.2, 0, 0, -radius * 1.2, 0]);
    line.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    return { pointsGeometry: points, lineGeometry: line };
  }, []);

  // DOMイベントを利用した入力の取得
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      // 操作介入時に角速度をリセット（ピタッと止める）
      angularVelocity.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousPointerPosition.current.x;

      // 移動量を角速度に変換（感度調整係数として 0.005 を乗算）
      // Y方向のドラッグでX軸回転、X方向のドラッグでY軸回転となる
      angularVelocity.current.y = deltaX * 0.005;

      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    // pointerdownはキャンバス上でのみ発火
    canvas.addEventListener('pointerdown', onPointerDown);
    // pointermoveとupは、ドラッグ中にカーソルが画面外に出た場合を考慮し window に登録
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl]);

  // 物理シミュレーション (毎フレームの更新)
  useFrame((state, delta) => {
    if (!rotationGroupRef.current) return;

    // 現在の角速度をオブジェクトの回転に加算（オイラー積分）
    rotationGroupRef.current.rotation.x += angularVelocity.current.x;
    rotationGroupRef.current.rotation.y += angularVelocity.current.y;

    // ドラッグ中でない場合、角速度を減衰させる（慣性の表現）
    if (!isDragging.current) {
      // フレームレート非依存の指数減衰 (Exponential Decay)
      const dampingFactor = 5.0; // 減衰係数（大きいほど早く止まる）
      const decay = Math.exp(-dampingFactor * delta);
      
      angularVelocity.current.x *= decay;
      angularVelocity.current.y *= decay;

      // 速度が微小になったら0に丸め、無駄な浮動小数点演算を停止する
      if (Math.abs(angularVelocity.current.x) < 0.0001) angularVelocity.current.x = 0;
      if (Math.abs(angularVelocity.current.y) < 0.0001) angularVelocity.current.y = 0;
    }
  });

  return (
    // 23.4度の傾斜は維持
    <group rotation={[0, 0, TILT_ANGLE]}>
      <group ref={rotationGroupRef}>
        <points geometry={pointsGeometry}>
          <pointsMaterial color="white" size={0.03} sizeAttenuation={true} />
        </points>
        <line geometry={lineGeometry}>
          <lineBasicMaterial color="gray" />
        </line>
      </group>
    </group>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none' }}>
      {/* OrbitControlsは完全に削除。カメラは初期位置で固定される */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <InteractiveParticleSphere />
      </Canvas>
    </div>
  );
}