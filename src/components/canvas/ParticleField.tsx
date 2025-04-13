
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
}

const ParticleField = ({ 
  count = 500, 
  color = '#33C3F0', 
  size = 0.02,
  speed = 0.1 
}: ParticleFieldProps) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Create particles
  const particlesPosition = new Float32Array(count * 3);
  const particlesSpeed = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlesPosition[i3] = (Math.random() - 0.5) * 10;
    particlesPosition[i3 + 1] = (Math.random() - 0.5) * 10;
    particlesPosition[i3 + 2] = (Math.random() - 0.5) * 10;
    
    particlesSpeed[i] = Math.random();
  }
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Create subtle wave movement
      positions[i3 + 1] += Math.sin(time + particlesSpeed[i]) * speed * 0.01;
      
      // Reset particles that go too far
      if (positions[i3 + 1] > 5) positions[i3 + 1] = -5;
      if (positions[i3 + 1] < -5) positions[i3 + 1] = 5;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Slowly rotate the entire particle field
    meshRef.current.rotation.y = time * 0.05;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        sizeAttenuation
        transparent
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleField;
