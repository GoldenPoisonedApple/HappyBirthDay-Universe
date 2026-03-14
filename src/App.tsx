import { Canvas } from '@react-three/fiber';
import '@react-three/fiber';
import InteractiveParticleSphere from './components/InteractiveParticleSphere';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <InteractiveParticleSphere />
      </Canvas>
    </div>
  );
}