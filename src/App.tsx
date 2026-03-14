// メインアプリケーションファイル
// 3Dシーン全体を管理し、カメラ制御とモード切替を行う
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
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
function AppContent({
  mode,
  setMode,
  setDisplayTime,
}: {
  mode: 'rotation' | 'orbit';
  setMode: (m: 'rotation' | 'orbit') => void;
  setDisplayTime: (time: string) => void;
}) {
  const modeRef = useRef(mode);
  const zoomTarget = useRef(0); // 0 = 自転モード（近距離）, 1 = 公転モード（遠距離）
  const zoom = useRef(0);
  const { camera } = useThree();

  // 初期日付
  const initialDate = useMemo(() => new Date(), []);

  // 地球のワールド座標を外部から受け取る
  const earthPosition = useRef(new THREE.Vector3(0, 0, 0));

  // カメラ注視点をシームレスに補間するための状態
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  // カメラオフセット（注視点からの距離）
  const currentOffset = useRef(new THREE.Vector3().copy(CLOSE_OFFSET));

  // 垂直ドラッグでズームを調整
  const handleVerticalDrag = useCallback((deltaY: number) => {
    zoomTarget.current = Math.max(0, Math.min(1, zoomTarget.current + deltaY * DRAG_SENSITIVITY_VERTICAL));
  }, []);

  // シミュレーション時間（秒）
  const currentSimulatedSeconds = useRef(0);

  // 時間の更新を処理
  const handleTimeUpdate = useCallback((simulatedSeconds: number) => {
    currentSimulatedSeconds.current = simulatedSeconds;
  }, []);

  // 地球の位置変更を処理
  const handleEarthPositionChange = useCallback((pos: THREE.Vector3) => {
    earthPosition.current.copy(pos);
  }, []);

  // 地球の公転角度変化を処理（削除：自転に基づいて時間を進めるため）

  // 日付表示フォーマット（YYYY/MM/DD HH:MM）
  const formatDate = useCallback((simulatedSeconds: number) => {
    // シミュレーション秒数から時間を計算
    const date = new Date(initialDate.getTime() + simulatedSeconds * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }, [initialDate]);

  // シミュレーション内の日時管理
  const timeAccumulator = useRef(0);

  // 初期日時の表示
  useEffect(() => {
    setDisplayTime(formatDate(0));
  }, [formatDate, setDisplayTime]);

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

    // 日付を自転角度に基づいて進める（両モード共通）
    // 自転1回転 = 1日、公転は自転に同期

    // 表示更新は0.05秒ごとに行う
    timeAccumulator.current += delta;
    if (timeAccumulator.current >= 0.05) {
      timeAccumulator.current = 0;
      setDisplayTime(formatDate(currentSimulatedSeconds.current));
    }
  });

  return (
    <InteractiveParticleSphere
      mode={mode}
      onVerticalDrag={handleVerticalDrag}
      onTimeUpdate={handleTimeUpdate}
      onEarthPositionChange={handleEarthPositionChange}
    />
  );
}

// アプリのエントリーポイント
// Canvasをセットアップして3Dシーンを表示
export default function App() {
  const [mode, setMode] = useState<'rotation' | 'orbit'>('rotation');
  const [displayTime, setDisplayTime] = useState('');

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none', position: 'relative', overflow: 'hidden' }}>
      {/* 2D UI Overlay (Canvasの外側に配置することでカメラ移動に影響されない) */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.95)',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '32px',
          fontWeight: '300',
          letterSpacing: '0.15em',
          textShadow: '0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(0, 150, 255, 0.4)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        {displayTime}
      </div>

      <Canvas camera={{ position: [0, 5, 10] }}>
        <AppContent mode={mode} setMode={setMode} setDisplayTime={setDisplayTime} />
      </Canvas>
    </div>
  );
}