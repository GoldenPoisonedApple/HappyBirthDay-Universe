import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export function usePointerDrag(
  onDragStart: () => void,
  onDragMove: (deltaX: number) => void,
  onDragEnd: () => void,
  onVerticalDrag?: (deltaY: number) => void
) {
	// ドラッグ状態
  const isDragging = useRef(false);
	// 前回のポインタ位置
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      onDragStart();	// ドラッグ開始時の処理
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousPointerPosition.current.x;
      const deltaY = e.clientY - previousPointerPosition.current.y;
      onDragMove(deltaX);
      if (onVerticalDrag) onVerticalDrag(deltaY);
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
      onDragEnd(); // ドラッグ終了時の処理
    };

		// イベントリスナーをキャンバスとウィンドウに追加
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, onDragStart, onDragMove, onDragEnd, onVerticalDrag]);
}