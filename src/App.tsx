import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import InteractiveParticleSphere from './components/InteractiveParticleSphere';

function AppContent() {
  const [mode, setMode] = useState<'rotation' | 'orbit'>('rotation');
  const modeRef = useRef(mode);
  const zoomTarget = useRef(0); // 0 = 自転モード（近距離）, 1 = 公転モード（遠距離）
  const zoom = useRef(0);
  const { camera } = useThree();

  // 地球のワールド座標を外部から受け取る
  const earthPosition = useRef(new THREE.Vector3(0, 0, 0));

  // カメラ注視点をシームレスに補間するための状態
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  // カメラオフセット（注視点からの距離）
  const closeOffset = useRef(new THREE.Vector3(0, 2, 6));
  const farOffset = useRef(new THREE.Vector3(0, 18, 18));
  const currentOffset = useRef(new THREE.Vector3(0, 2, 6));

  const handleVerticalDrag = (deltaY: number) => {
    // 上下ドラッグで zoomTarget を調整
    zoomTarget.current = Math.max(0, Math.min(1, zoomTarget.current + deltaY * 0.0015));
  };

  const handleEarthPositionChange = (pos: THREE.Vector3) => {
    earthPosition.current.copy(pos);
  };

  const getTargetPosition = () => {
    // zoomが0に近いほど地球を中心にし、1に近いほど太陽（原点）を中心にする
    return earthPosition.current.clone().lerp(new THREE.Vector3(0, 0, 0), zoom.current);
  };

  useFrame((_, delta) => {
    // zoom の滑らかな遷移
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, delta * 6);

    // 注視点のスムーズ移動
    targetPosition.current.copy(getTargetPosition());
    currentTarget.current.lerp(targetPosition.current, Math.min(1, delta * 6));

    // カメラ距離の補間
    currentOffset.current.lerpVectors(closeOffset.current, farOffset.current, zoom.current);
    camera.position.copy(currentTarget.current).add(currentOffset.current);
    camera.lookAt(currentTarget.current);

    // モード切替
    const nextMode = zoom.current > 0.55 ? 'orbit' : 'rotation';
    if (nextMode !== modeRef.current) {
      modeRef.current = nextMode;
      setMode(nextMode);
    }
  });

  return (
    <InteractiveParticleSphere
      mode={mode}
      onVerticalDrag={handleVerticalDrag}
      onEarthPositionChange={handleEarthPositionChange}
    />
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <AppContent />
      </Canvas>
    </div>
  );
}