// メインアプリケーションファイル
// 3Dシーン全体を管理し、カメラ制御とモード切替を行う
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import InteractiveParticleSphere from './components/InteractiveParticleSphere';
import {
  CLOSE_OFFSET,
  FAR_OFFSET,
  ZOOM_INTERPOLATION_SPEED,
  TARGET_INTERPOLATION_SPEED,
  ORBIT_MODE_THRESHOLD,
  DRAG_SENSITIVITY_VERTICAL,
} from './constants';

// 3Dシーンのメインコンテンツコンポーネント
// カメラ制御とモード管理を行う
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
  const currentOffset = useRef(new THREE.Vector3().copy(CLOSE_OFFSET));

  // 垂直ドラッグでズームを調整
  const handleVerticalDrag = (deltaY: number) => {
    zoomTarget.current = Math.max(0, Math.min(1, zoomTarget.current + deltaY * DRAG_SENSITIVITY_VERTICAL));
  };

  // 地球の位置変更を処理
  const handleEarthPositionChange = (pos: THREE.Vector3) => {
    earthPosition.current.copy(pos);
  };

  // カメラの注視点を計算（ズームに応じて地球と太陽の間を補間）
  const getTargetPosition = () => {
    return earthPosition.current.clone().lerp(new THREE.Vector3(0, 0, 0), zoom.current);
  };

  // 毎フレームの更新処理
  useFrame((_, delta) => {
    // ズームの滑らかな遷移
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, delta * ZOOM_INTERPOLATION_SPEED);

    // 注視点のスムーズ移動
    targetPosition.current.copy(getTargetPosition());
    currentTarget.current.lerp(targetPosition.current, Math.min(1, delta * TARGET_INTERPOLATION_SPEED));

    // カメラ距離の補間
    currentOffset.current.lerpVectors(CLOSE_OFFSET, FAR_OFFSET, zoom.current);
    camera.position.copy(currentTarget.current).add(currentOffset.current);
    camera.lookAt(currentTarget.current);

    // ズームに応じてモード切替
    const nextMode = zoom.current > ORBIT_MODE_THRESHOLD ? 'orbit' : 'rotation';
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

// アプリのエントリーポイント
// Canvasをセットアップして3Dシーンを表示
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <AppContent />
      </Canvas>
    </div>
  );
}