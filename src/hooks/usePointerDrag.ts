import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export function usePointerDrag(
  onDragStart: () => void,
  onDragMove: (deltaX: number, deltaY: number, deltaTime: number) => void,
  onDragEnd: () => void
) {
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const previousTime = useRef(0);
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      previousTime.current = performance.now();
      onDragStart();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const currentTime = performance.now();
      // 時間差分（秒）。0除算を防ぐため最小値を設定
      const deltaTime = Math.max((currentTime - previousTime.current) / 1000, 0.001);

      const deltaX = e.clientX - previousPointerPosition.current.x;
      const deltaY = e.clientY - previousPointerPosition.current.y;
      
      onDragMove(deltaX, deltaY, deltaTime);
      
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      previousTime.current = currentTime;
    };

    const onPointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        onDragEnd();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, onDragStart, onDragMove, onDragEnd]);
}