import { Canvas } from '@react-three/fiber';
import '@react-three/fiber';
import Scene from './components/Scene';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <Scene />
      </Canvas>
    </div>
  );
}