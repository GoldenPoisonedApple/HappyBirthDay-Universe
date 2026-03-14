import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type CameraMode = 'rotation' | 'orbit';

export function useCameraController() {
  const { camera } = useThree();
  const zoomTarget = useRef(0);
  const zoom = useRef(0);

  const earthPosition = useRef(new THREE.Vector3(0, 0, 0));
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  const closeOffset = useRef(new THREE.Vector3(0, 2, 6));
  const farOffset = useRef(new THREE.Vector3(0, 18, 18));
  const currentOffset = useRef(new THREE.Vector3(0, 2, 6));

  const [mode, setMode] = useState<CameraMode>('rotation');
  const modeRef = useRef<CameraMode>('rotation');

  const setEarthPosition = (pos: THREE.Vector3) => {
    earthPosition.current.copy(pos);
  };

  const handleVerticalDrag = (deltaY: number) => {
    zoomTarget.current = Math.max(0, Math.min(1, zoomTarget.current + deltaY * 0.0015));
  };

  useFrame((_, delta) => {
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, delta * 6);

    // 注視点の補間
    targetPosition.current.copy(
      earthPosition.current.clone().lerp(new THREE.Vector3(0, 0, 0), zoom.current)
    );
    currentTarget.current.lerp(targetPosition.current, Math.min(1, delta * 6));

    // カメラオフセットの補間
    currentOffset.current.lerpVectors(closeOffset.current, farOffset.current, zoom.current);
    camera.position.copy(currentTarget.current).add(currentOffset.current);
    camera.lookAt(currentTarget.current);

    const nextMode: CameraMode = zoom.current > 0.55 ? 'orbit' : 'rotation';
    if (nextMode !== modeRef.current) {
      modeRef.current = nextMode;
      setMode(nextMode);
    }
  });

  return {
    mode,
    onVerticalDrag: handleVerticalDrag,
    setEarthPosition,
  };
}
