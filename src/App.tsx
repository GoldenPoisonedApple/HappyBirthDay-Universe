import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// 1つのメッシュ（立方体）を定義するコンポーネント
function SpinningCube() {
  // メッシュへの参照を取得。Three.jsのMeshクラスのインスタンスが格納される
  const meshRef = useRef<THREE.Mesh>(null);

  // useFrameは、レンダリングのフレーム（通常60fps）ごとに呼び出されるフック
  useFrame((state, delta) => {
    if (meshRef.current) {
      // デルタ時間（前フレームからの経過時間）を加算して回転させることで、
      // 実行環境のフレームレートへの依存を排除し、一定の速度で回転させる
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    // <mesh> は new THREE.Mesh() に対応
    <mesh ref={meshRef}>
      {/* <boxGeometry> は new THREE.BoxGeometry() に対応。
          argsはコンストラクタ引数 [width, height, depth] を表す */}
      <boxGeometry args={[1, 3, 1]} />
      
      {/* <meshStandardMaterial> は new THREE.MeshStandardMaterial() に対応。
          物理ベースレンダリング(PBR)を行い、光源の影響を受ける */}
      <meshStandardMaterial color="black" />
    </mesh>
  );
}

// アプリケーションのエントリポイント
export default function App() {
  return (
    // <Canvas>コンポーネントが内部で WebGLRenderer, Scene, PerspectiveCamera の初期化を隠蔽して実行する
    // 親要素のサイズに合わせてキャンバスがリサイズされる
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        {/* 環境光。シーン全体を均一に照らし、陰影の完全な黒潰れを防ぐ */}
        <ambientLight intensity={0.5} />
        
        {/* ディレクショナルライト（平行光源）。太陽光のような特定の方向からの強い光 */}
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* コンポーネントの配置 */}
        <SpinningCube />
      </Canvas>
    </div>
  );
}