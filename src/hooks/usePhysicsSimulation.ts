import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BASE_TIME_SPEED_ROTATION,
  BASE_TIME_SPEED_ORBIT,
  DAMPING_FACTOR,
} from '../constants';

export type PhysicsMode = 'rotation' | 'orbit';

// 物理シミュレーションではなく、絶対的な「時間（Time）」をシミュレーションするフック
export function useTimeSimulation(
  mode: PhysicsMode,
  onTimeUpdate: (simulatedSeconds: number) => void
) {
  const simulatedSeconds = useRef(0);
  const timeVelocity = useRef(0); // ドラッグによる追加の速度（慣性用）
  const isDragging = useRef(false);

  useFrame((_, delta: number) => {
    const baseSpeed = mode === 'orbit' ? BASE_TIME_SPEED_ORBIT : BASE_TIME_SPEED_ROTATION;

    if (!isDragging.current) {
      // ドラッグしていない時は慣性を減衰させる
      timeVelocity.current *= Math.exp(-DAMPING_FACTOR * delta);
      
      // 速度が微小になったらゼロにする
      if (Math.abs(timeVelocity.current) < 1) {
        timeVelocity.current = 0;
      }
      
      // 慣性による時間の進行
      simulatedSeconds.current += timeVelocity.current * delta;
    }

    // 常に定常速度で時間は進む
    simulatedSeconds.current += baseSpeed * delta;

    onTimeUpdate(simulatedSeconds.current);
  });

  const addSimulatedTime = useCallback((amountSeconds: number, deltaTime: number) => {
    simulatedSeconds.current += amountSeconds;
    
    // ドラッグ終了後の慣性のために、現在のドラッグ速度を計算して保持
    if (deltaTime > 0) {
      // 急激な速度変化を和らげるための簡単なスムージング
      const instantaneousVelocity = amountSeconds / deltaTime;
      timeVelocity.current = timeVelocity.current * 0.5 + instantaneousVelocity * 0.5;
    }
  }, []);

  const setIsDragging = useCallback((dragging: boolean) => {
    isDragging.current = dragging;
    if (dragging) {
      // ドラッグ開始時に慣性をリセット
      timeVelocity.current = 0;
    }
  }, []);

  return {
    addSimulatedTime,
    setIsDragging,
    simulatedSeconds,
  };
}