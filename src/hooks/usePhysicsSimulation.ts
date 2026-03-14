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

    // --- 1. まず現在のシミュレーション時間から誕生日までの残り日数を計算し、スローモーション係数を決定する ---
    const initialDate = new Date();
    initialDate.setMonth(initialDate.getMonth() - 6); // 半年前を基準
    
    const currentDate = new Date(initialDate.getTime() + simulatedSeconds.current * 1000);
    const today = new Date();
    const thisYearBirthday = new Date(currentDate.getFullYear(), today.getMonth(), today.getDate());
    if (currentDate.getTime() > thisYearBirthday.getTime() + 24 * 60 * 60 * 1000) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    }
    
    const daysUntilBirthday = (thisYearBirthday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
    
    // 誕生日当日（当日の0時から24時の間）
    const isBirthdayToday = daysUntilBirthday <= 0 && daysUntilBirthday > -1;
    const isNearBirthday = daysUntilBirthday > 0 && daysUntilBirthday <= 7;

    // スローモーション係数（定常速度および慣性用）
    let autoTimeScaleMultiplier = 1.0;
    if (isBirthdayToday) {
      autoTimeScaleMultiplier = 0.01; // 誕生日は通常の100分の1の遅さ（ほぼ止まる）
    } else if (isNearBirthday) {
      // 7日前から当日に向けて徐々に遅くする（1.0 -> 0.01）
      autoTimeScaleMultiplier = 0.01 + (0.99 * (daysUntilBirthday / 7));
    }

    // --- 2. 決定した係数を使って時間を進める ---

    if (!isDragging.current) {
      // ドラッグしていない時は慣性を減衰させる
      timeVelocity.current *= Math.exp(-DAMPING_FACTOR * delta);
      
      // 速度が微小になったらゼロにする
      if (Math.abs(timeVelocity.current) < 1) {
        timeVelocity.current = 0;
      }
      
      // 慣性による時間の進行（ここにもスローモーションを適用！）
      simulatedSeconds.current += timeVelocity.current * autoTimeScaleMultiplier * delta;
    }

    // 常に定常速度で時間は進む（スローモーション係数を適用）
    simulatedSeconds.current += baseSpeed * autoTimeScaleMultiplier * delta;

    onTimeUpdate(simulatedSeconds.current);
  });

  const addSimulatedTime = useCallback((amountSeconds: number, deltaTime: number) => {
    // ドラッグによる時間の進みも、誕生日に近づくと重くなる（遅くなる）ようにする
    const initialDate = new Date();
    initialDate.setMonth(initialDate.getMonth() - 6);
    const currentDate = new Date(initialDate.getTime() + simulatedSeconds.current * 1000);
    const today = new Date();
    const thisYearBirthday = new Date(currentDate.getFullYear(), today.getMonth(), today.getDate());
    if (currentDate.getTime() > thisYearBirthday.getTime() + 24 * 60 * 60 * 1000) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    }
    const daysUntilBirthday = (thisYearBirthday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
    
    const isBirthdayToday = daysUntilBirthday <= 0 && daysUntilBirthday > -1;
    const isNearBirthday = daysUntilBirthday > 0 && daysUntilBirthday <= 7;

    let dragTimeScaleMultiplier = 1.0;
    if (isBirthdayToday) {
      dragTimeScaleMultiplier = 0.05; // ドラッグは少し動かしやすくしておく（1/20の遅さ）
    } else if (isNearBirthday) {
      dragTimeScaleMultiplier = 0.05 + (0.95 * (daysUntilBirthday / 7));
    }

    simulatedSeconds.current += amountSeconds * dragTimeScaleMultiplier;
    
    // ドラッグ終了後の慣性のために、現在のドラッグ速度を計算して保持
    if (deltaTime > 0) {
      // 急激な速度変化を和らげるための簡単なスムージング
      const instantaneousVelocity = (amountSeconds * dragTimeScaleMultiplier) / deltaTime;
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