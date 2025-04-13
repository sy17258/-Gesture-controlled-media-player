
import { motion } from 'framer-motion';
import SceneContainer from '../canvas/SceneContainer';
import ParticleField from '../canvas/ParticleField';
import HandGesture from '../canvas/HandGesture';

interface BackgroundEffectProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  showHandGestures?: boolean;
}

const BackgroundEffect = ({
  className = '',
  particleCount = 10000,
  particleColor = "#33C3F0",
  showHandGestures = true
}: BackgroundEffectProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className={`absolute inset-0 z-0 ${className}`}
    >
      <SceneContainer controls={false} cameraPosition={[0, 0, 8]}>
        <ParticleField count={particleCount} color={particleColor} />
        {showHandGestures && (
          <group position={[0, 0, 0]}>
            <HandGesture position={[-3, 0, 0]} gesture="play" />
            <HandGesture position={[-1.5, 0.5, 0]} gesture="pause" />
            <HandGesture position={[0, 1, 0]} gesture="volumeUp" />
            <HandGesture position={[1.5, 0.5, 0]} gesture="volumeDown" />
            <HandGesture position={[3, 0, 0]} gesture="next" />
          </group>
        )}
      </SceneContainer>
    </motion.div>
  );
};

export default BackgroundEffect;
