// 物理シミュレーションを管理するカスタムフック
// オブジェクトの回転運動をシミュレートし、減衰や定常回転を適用
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DAMPING_FACTOR,
  CONSTANT_ROTATION_SPEED,
  VELOCITY_THRESHOLD,
  ORBIT_ROTATION_SPEED,
} from '../constants';

export type PhysicsMode = 'rotation' | 'orbit';

// 回転運動の物理シミュレーションを提供するフック
export function usePhysicsSimulation(
  rotationGroupRef: React.RefObject<THREE.Group | null>,
  mode: PhysicsMode,
  onRotationChange?: (rotationY: number) => void
) {
  const angularVelocity = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousRotationY = useRef(0);

  // 毎フレームの物理更新
  useFrame((_, delta: number) => {
    if (!rotationGroupRef.current) return;

    // 現在の角速度をオブジェクトの回転に加算（オイラー積分）
    rotationGroupRef.current.rotation.x += angularVelocity.current.x;
    rotationGroupRef.current.rotation.y += angularVelocity.current.y;

    // 回転角度の変化を通知（両モード共通）
    if (onRotationChange) {
      const currentRotationY = rotationGroupRef.current.rotation.y;
      const deltaRotation = currentRotationY - previousRotationY.current;
      if (Math.abs(deltaRotation) > 0) {
        onRotationChange(deltaRotation);
      }
      previousRotationY.current = currentRotationY;
    }

    // 自転モードのみ、減衰や定常回転を行う
    if (mode === 'rotation' && !isDragging.current) {
      // フレームレート非依存の指数減衰
      const decay = Math.exp(-DAMPING_FACTOR * delta);

      angularVelocity.current.x *= decay;
      angularVelocity.current.y *= decay;

      // 速度が微小になったら0に丸め、無駄な浮動小数点演算を停止する
      if (Math.abs(angularVelocity.current.x) < VELOCITY_THRESHOLD) angularVelocity.current.x = 0;
      if (Math.abs(angularVelocity.current.y) < VELOCITY_THRESHOLD) angularVelocity.current.y = 0;

      // 常に少し回転させるための一定の角速度を加算
      angularVelocity.current.y += CONSTANT_ROTATION_SPEED * delta;
    } else if (mode === 'orbit' && !isDragging.current) {
      // 公転モードでもドラッグしていないときは減衰
      const decay = Math.exp(-DAMPING_FACTOR * delta);

      angularVelocity.current.x *= decay;
      angularVelocity.current.y *= decay;

      // 速度が微小になったら0に丸め、無駄な浮動小数点演算を停止する
      if (Math.abs(angularVelocity.current.x) < VELOCITY_THRESHOLD) angularVelocity.current.x = 0;
      if (Math.abs(angularVelocity.current.y) < VELOCITY_THRESHOLD) angularVelocity.current.y = 0;

      // 公転モードでは定常回転を加算
      angularVelocity.current.y += ORBIT_ROTATION_SPEED * delta;
    }
  });

  // 角速度を設定
  const setAngularVelocity = (x: number, y: number) => {
    angularVelocity.current = { x, y };
  };

  // 角速度をリセット
  const resetAngularVelocity = () => {
    angularVelocity.current = { x: 0, y: 0 };
  };

  // ドラッグ状態を設定
  const setIsDragging = (dragging: boolean) => {
    isDragging.current = dragging;
  };

  return {
    setAngularVelocity,
    resetAngularVelocity,
    setIsDragging,
    angularVelocity,
  };
}