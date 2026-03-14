import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type PhysicsMode = 'rotation' | 'orbit';

export function usePhysicsSimulation(
  rotationGroupRef: React.RefObject<THREE.Group | null>,
  mode: PhysicsMode
) {
  const angularVelocity = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useFrame((_, delta: number) => {
    if (!rotationGroupRef.current) return;

    // 現在の角速度をオブジェクトの回転に加算（オイラー積分）
    rotationGroupRef.current.rotation.x += angularVelocity.current.x;
    rotationGroupRef.current.rotation.y += angularVelocity.current.y;

    // rotationモードのみ、減衰や定常回転を行う
    if (mode === 'rotation' && !isDragging.current) {
      // フレームレート非依存の指数減衰 (Exponential Decay)
      const dampingFactor = 5.0; // 減衰係数（大きいほど早く止まる）
      const decay = Math.exp(-dampingFactor * delta);

      angularVelocity.current.x *= decay;
      angularVelocity.current.y *= decay;

      // 速度が微小になったら0に丸め、無駄な浮動小数点演算を停止する
      if (Math.abs(angularVelocity.current.x) < 0.0001) angularVelocity.current.x = 0;
      if (Math.abs(angularVelocity.current.y) < 0.0001) angularVelocity.current.y = 0;

      // 常に少し回転させるための一定の角速度を加算
      angularVelocity.current.y += 0.01 * delta;
    }
  });

  const setAngularVelocity = (x: number, y: number) => {
    angularVelocity.current = { x, y };
  };

  const resetAngularVelocity = () => {
    angularVelocity.current = { x: 0, y: 0 };
  };

  const setIsDragging = (dragging: boolean) => {
    isDragging.current = dragging;
  };

  return { setAngularVelocity, resetAngularVelocity, setIsDragging };
}