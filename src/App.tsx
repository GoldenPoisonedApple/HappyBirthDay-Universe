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
  INITIAL_MONTH_OFFSET,
} from './constants';

// 3Dシーンのメインコンテンツコンポーネント
// カメラ制御とモード管理を行う
function AppContent({
  mode,
  setMode,
  setDisplayTime,
  setShowBirthday,
  showBirthday,
  setDaysUntil,
}: {
  mode: 'rotation' | 'orbit';
  setMode: (m: 'rotation' | 'orbit') => void;
  setDisplayTime: (time: string) => void;
  setShowBirthday: (show: boolean) => void;
  showBirthday: boolean;
  setDaysUntil: (days: number | null) => void;
}) {
  const modeRef = useRef(mode);
  const zoomTarget = useRef(1); // 初期値を 1(公転モード) に変更
  const zoom = useRef(1); // 現在のズーム値も 1 に初期化
  const { camera } = useThree();

  // 初期日付を現在時刻のINITIAL_MONTH_OFFSETヶ月前に設定する
  const initialDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - INITIAL_MONTH_OFFSET);
    return date;
  }, []);

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

  // 誕生日かどうかを判定する関数
  const isBirthday = useCallback((date: Date) => {
    const today = new Date();
    // 日付と月だけを比較する（年が違っても誕生日と判定する）
    return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }, []);

  // 日付表示フォーマット（YYYY/MM/DD HH:MM）
  const formatDate = useCallback((simulatedSeconds: number) => {
    // シミュレーション秒数から時間を計算
    const date = new Date(initialDate.getTime() + simulatedSeconds * 1000);
    
    // 誕生日チェック
    if (isBirthday(date)) {
      setShowBirthday(true);
    } else {
      setShowBirthday(false);
    }
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }, [initialDate, isBirthday, setShowBirthday]);

  // シミュレーション内の日時管理
  const timeAccumulator = useRef(0);

  // 初期日時の表示
  useEffect(() => {
    setDisplayTime(formatDate(0));
  }, [formatDate, setDisplayTime]);

  // 毎フレームの更新処理
  useFrame((_, delta) => {
    // 現在のシミュレーション時間から日付を計算
    const currentDate = new Date(initialDate.getTime() + currentSimulatedSeconds.current * 1000);
    const today = new Date();
    
    // 誕生日（今日）までの残り日数を計算
    // 同じ年の誕生日を計算
    const thisYearBirthday = new Date(currentDate.getFullYear(), today.getMonth(), today.getDate());
    // もしすでに今年の誕生日を過ぎていたら、来年の誕生日をターゲットにする
    if (currentDate.getTime() > thisYearBirthday.getTime() + 24 * 60 * 60 * 1000) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    }
    
    const daysUntilBirthday = (thisYearBirthday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);

    // 誕生日までの残り日数を親コンポーネントに伝える（表示用）
    // 1週間前から表示する
    if (daysUntilBirthday > 0 && daysUntilBirthday <= 7) {
      setDaysUntil(Math.ceil(daysUntilBirthday));
    } else {
      setDaysUntil(null);
    }

    // 誕生日1週間前（7日以内）になったら強制的に自転モード（近距離）へズームイン
    if (daysUntilBirthday > 0 && daysUntilBirthday <= 7) {
      zoomTarget.current = 0; // 自転モードへ
    }

    // ズームの滑らかな遷移
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, delta * ZOOM_INTERPOLATION_SPEED);

    // 注視点のスムーズ移動
    targetPosition.current.copy(earthPosition.current.clone().lerp(new THREE.Vector3(0, 0, 0), zoom.current));
    currentTarget.current.lerp(targetPosition.current, Math.min(1, delta * TARGET_INTERPOLATION_SPEED));

    // スマホなどアスペクト比が縦長の場合のカメラオフセット補正
    // 画面幅が狭い場合、カメラをより遠くに配置して被写体が画面に収まるようにする
    const aspect = window.innerWidth / window.innerHeight;
    let distanceMultiplier = 1.0;
    if (aspect < 1.0) {
      // 縦長画面の場合、アスペクト比に応じてカメラを遠ざける (最大で2倍程度まで)
      distanceMultiplier = Math.min(2.0, 1.0 / aspect);
    }

    // カメラ距離の補間
    currentOffset.current.lerpVectors(CLOSE_OFFSET, FAR_OFFSET, zoom.current);
    
    // 補正を適用してカメラ位置を設定
    const adjustedOffset = currentOffset.current.clone().multiplyScalar(distanceMultiplier);
    camera.position.copy(currentTarget.current).add(adjustedOffset);
    
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
      showBirthday={showBirthday}
    />
  );
}

// アプリのエントリーポイント
// Canvasをセットアップして3Dシーンを表示
export default function App() {
  const [mode, setMode] = useState<'rotation' | 'orbit'>('orbit');
  const [displayTime, setDisplayTime] = useState('');
  const [showBirthday, setShowBirthday] = useState(false);
  const [daysUntil, setDaysUntil] = useState<number | null>(null);

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
          transition: 'opacity 1s ease-in-out',
          opacity: showBirthday ? 0 : 1,
        }}
      >
        {displayTime}
      </div>

      {/* 誕生日までのカウントダウン（1週間前から表示） */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.8)',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '20px',
          fontWeight: '300',
          letterSpacing: '0.2em',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10,
          opacity: (daysUntil !== null && !showBirthday) ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
        }}
      >
        {daysUntil !== null ? `BIRTHDAY IN ${daysUntil} DAY${daysUntil > 1 ? 'S' : ''}` : ''}
      </div>

      {/* 誕生日演出用のオーバーレイ */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: showBirthday ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.5)',
          color: '#ffffff',
          fontFamily: "'Playfair Display', 'Courier New', serif",
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 20,
          opacity: showBirthday ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: showBirthday ? 'blur(0px)' : 'blur(20px)',
        }}
      >
        <div style={{
          fontSize: '8vw',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.6), 0 0 120px rgba(255, 215, 0, 0.4)',
          marginBottom: '10px'
        }}>
          <div style={{ animation: showBirthday ? 'float 6s ease-in-out infinite' : 'none' }}>HAPPY</div>
          <div style={{ animation: showBirthday ? 'float 6s ease-in-out infinite 3s' : 'none' }}>BIRTHDAY</div>
        </div>
        
        {/* 日付表示（誕生日のときだけ表示される） */}
        <div style={{
          fontSize: '3vw',
          fontWeight: '300',
          letterSpacing: '0.3em',
          marginTop: '30px',
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
          animation: showBirthday ? 'float 6s ease-in-out infinite 1.5s' : 'none'
        }}>
          {displayTime.split(' ')[0]} {/* 時刻部分を切り捨てて日付部分だけを表示 */}
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      <Canvas camera={{ position: [0, 5, 10] }}>
        <AppContent 
          mode={mode} 
          setMode={setMode} 
          setDisplayTime={setDisplayTime} 
          setShowBirthday={setShowBirthday} 
          showBirthday={showBirthday} 
          setDaysUntil={setDaysUntil}
        />
      </Canvas>
    </div>
  );
}