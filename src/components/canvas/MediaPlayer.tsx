
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MediaPlayerProps {
  position: [number, number, number];
  scale?: number;
}

const MediaPlayer = ({ position, scale = 1 }: MediaPlayerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const videoTexRef = useRef(new THREE.VideoTexture(document.createElement('video')));
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  
  // Dummy control for demo purposes
  const handlePlayPause = () => {
    setPlaying(!playing);
  };
  
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
      
      // Update progress for demo
      if (playing) {
        setVideoProgress((prev) => (prev + 0.001) % 1);
      }
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Screen */}
      <mesh position={[0, 0, 0]} scale={[2, 1.2, 0.05]}>
        <boxGeometry />
        <meshStandardMaterial color="#0c0c0c" />
        
        {/* Video Screen */}
        <mesh position={[0, 0, 0.6]}>
          <planeGeometry args={[1.95, 1.15]} />
          <meshBasicMaterial color={playing ? "#333" : "#121212"} />
          
          {/* Video Content Placeholder */}
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {playing ? "Now Playing" : "Media Player"}
          </Text>
        </mesh>
      </mesh>
      
      {/* Controls Base */}
      <mesh position={[0, -0.8, 0]} scale={[2, 0.4, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* Progress Bar */}
      <group position={[0, -0.7, 0.1]}>
        <mesh scale={[1.8, 0.05, 0.05]}>
          <boxGeometry />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        <mesh position={[-0.9 + videoProgress * 1.8, 0, 0]} scale={[videoProgress * 1.8, 0.05, 0.06]}>
          <boxGeometry />
          <meshStandardMaterial color="#33C3F0" />
        </mesh>
      </group>
      
      {/* Control Buttons */}
      {[
        { name: "prev", position: [-0.7, -0.85, 0.1] as [number, number, number], icon: "⏮" },
        { name: "play", position: [0, -0.85, 0.1] as [number, number, number], icon: playing ? "⏸" : "▶" },
        { name: "next", position: [0.7, -0.85, 0.1] as [number, number, number], icon: "⏭" },
      ].map((button) => (
        <group 
          key={button.name} 
          position={button.position}
          onClick={() => button.name === "play" && handlePlayPause()}
        >
          <mesh scale={[0.2, 0.2, 0.05]}>
            <cylinderGeometry args={[1, 1, 0.5, 32]} />
            <meshStandardMaterial 
              color={button.name === "play" ? "#33C3F0" : "#666"}
              emissive={button.name === "play" && hovered ? "#33C3F0" : "#000"}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {button.icon}
          </Text>
        </group>
      ))}
      
      {/* Volume Control */}
      <group position={[1.2, -0.85, 0.1]}>
        <mesh scale={[0.2, 0.2, 0.05]}>
          <cylinderGeometry args={[1, 1, 0.5, 32]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          🔊
        </Text>
      </group>
      
      {/* Interactive Help Tooltip */}
      {hovered && (
        <Html position={[0, 1, 0]} center className="pointer-events-none">
          <div className="bg-black/80 px-4 py-2 rounded text-white">
            Interactive Media Player
            <div className="text-xs text-gray-400 mt-1">
              Use hand gestures to control playback
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default MediaPlayer;
