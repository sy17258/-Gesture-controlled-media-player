
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface HandGestureProps {
  position: [number, number, number];
  gesture: string;
}

const HandGesture = ({ position, gesture }: HandGestureProps) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
      // Subtle floating motion
      ref.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });
  
  // Simplified hand model - just a placeholder for demonstration
  // In a real implementation, you would use a proper 3D hand model
  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base Palm */}
      <mesh position={[0, 0, 0]} scale={hovered ? 1.1 : 1}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={hovered ? "#33C3F0" : "#8B5CF6"} />
      </mesh>
      
      {/* Fingers - adjusted based on gesture */}
      {gesture === "play" && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.08 * (i - 2), 0.3, 0]} scale={[0.05, 0.2, 0.05]}>
              <boxGeometry />
              <meshStandardMaterial color="#8B5CF6" />
            </mesh>
          ))}
        </>
      )}
      
      {gesture === "pause" && (
        <>
          {[0, 1].map((i) => (
            <mesh key={i} position={[0.15 * (i === 0 ? -1 : 1), 0.3, 0]} scale={[0.08, 0.25, 0.08]}>
              <boxGeometry />
              <meshStandardMaterial color="#0EA5E9" />
            </mesh>
          ))}
        </>
      )}
      
      {gesture === "volumeUp" && (
        <>
          <mesh position={[0, 0.35, 0]} scale={[0.1, 0.3, 0.1]} rotation={[0, 0, Math.PI * 0.1]}>
            <boxGeometry />
            <meshStandardMaterial color="#0EA5E9" />
          </mesh>
        </>
      )}
      
      {gesture === "volumeDown" && (
        <>
          <mesh position={[0, 0.35, 0]} scale={[0.1, 0.3, 0.1]} rotation={[0, 0, -Math.PI * 0.1]}>
            <boxGeometry />
            <meshStandardMaterial color="#0EA5E9" />
          </mesh>
        </>
      )}
      
      {gesture === "next" && (
        <>
          <mesh position={[0.2, 0.2, 0]} scale={[0.1, 0.2, 0.1]} rotation={[0, 0, Math.PI * 0.25]}>
            <boxGeometry />
            <meshStandardMaterial color="#0EA5E9" />
          </mesh>
        </>
      )}
      
      {gesture === "previous" && (
        <>
          <mesh position={[-0.2, 0.2, 0]} scale={[0.1, 0.2, 0.1]} rotation={[0, 0, -Math.PI * 0.25]}>
            <boxGeometry />
            <meshStandardMaterial color="#0EA5E9" />
          </mesh>
        </>
      )}
      
      {/* Label */}
      {hovered && (
        <Html position={[0, 0.6, 0]} center className="pointer-events-none">
          <div className="bg-black/80 px-2 py-1 rounded text-white text-sm">
            {gesture}
          </div>
        </Html>
      )}
    </group>
  );
};

export default HandGesture;
