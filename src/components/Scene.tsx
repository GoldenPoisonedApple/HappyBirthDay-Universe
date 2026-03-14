import { useCameraController } from '../hooks/useCameraController';
import { SolarSystem } from './SolarSystem';

export default function Scene() {
  const { mode, onVerticalDrag, setEarthPosition } = useCameraController();

  return (
    <SolarSystem mode={mode} onVerticalDrag={onVerticalDrag} onEarthPositionChange={setEarthPosition} />
  );
}
