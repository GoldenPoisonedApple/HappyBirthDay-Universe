// メインアプリケーションファイル
// 3Dシーン全体を管理し、カメラ制御とモード切替を行う
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  ORBIT_TIME_SCALE,
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

  // 地球の回転角度変化を処理
  const handleRotationChange = (deltaRotation: number) => {
    // 自転1回転（2πラジアン）で1日進む
    const daysPerRotation = 1;
    const msPerDay = 24 * 60 * 60 * 1000; // 1日のミリ秒
    const deltaMs = (deltaRotation / (2 * Math.PI)) * daysPerRotation * msPerDay;
    simulatedTimeRef.current = new Date(simulatedTimeRef.current.getTime() + deltaMs);
  };

  // 日付表示フォーマット（YYYY-MM-DD HH:MM）
  function formatDate(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // シミュレーション内の日時管理
  const initialSimulatedDate = new Date();
  const simulatedTimeRef = useRef(initialSimulatedDate);
  const [displayTime, setDisplayTime] = useState(() => formatDate(initialSimulatedDate));
  const timeAccumulator = useRef(0);

  // 毎フレームの更新処理
  useFrame((_, delta) => {
    // ズームの滑らかな遷移
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, delta * ZOOM_INTERPOLATION_SPEED);

    // 注視点のスムーズ移動
    targetPosition.current.copy(earthPosition.current.clone().lerp(new THREE.Vector3(0, 0, 0), zoom.current));
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

    // 日付をモードに応じて進める（自転: ドラッグ/回転に基づく、公転: 一定速度）
    if (modeRef.current === 'orbit') {
      const timeScale = ORBIT_TIME_SCALE;
      const deltaMs = delta * 1000 * timeScale;
      simulatedTimeRef.current = new Date(simulatedTimeRef.current.getTime() + deltaMs);
    }

    // 表示更新は0.2秒ごとに行う
    timeAccumulator.current += delta;
    if (timeAccumulator.current >= 0.05) {
      timeAccumulator.current = 0;
      setDisplayTime(formatDate(simulatedTimeRef.current));
    }
  });

  return (
    <>
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            color: 'white',
            fontFamily: 'monospace',
            fontSize: 14,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div>{mode === 'rotation' ? '自転モード' : '公転モード'}</div>
          <div>{displayTime}</div>
        </div>
      </Html>

      <InteractiveParticleSphere
        mode={mode}
        onVerticalDrag={handleVerticalDrag}
        onEarthPositionChange={handleEarthPositionChange}
        onRotationChange={handleRotationChange}
      />
    </>
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