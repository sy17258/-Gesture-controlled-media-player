
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface TeamMemberProps {
  position: [number, number, number];
  name: string;
  role: string;
  color?: string;
  imageSrc?: string;
}

const TeamMember = ({ position, name, role, color = '#8B5CF6', imageSrc }: TeamMemberProps) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Generate image path based on member name if not provided
  const memberImagePath = imageSrc || `/team/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  
  // Load the texture
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      memberImagePath,
      (loadedTexture) => {
        // Configure texture for better fitting
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.minFilter = THREE.LinearFilter;
        
        // Center the image and ensure it covers the circle
        loadedTexture.center.set(0.5, 0.5);
        loadedTexture.repeat.set(1, 1);
        
        setTexture(loadedTexture);
        setImageLoaded(true);
      },
      undefined,
      (error) => {
        console.error(`Failed to load image for ${name}:`, error);
        setImageLoaded(false);
      }
    );
    
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [memberImagePath, name]);
  
  useFrame((state) => {
    if (ref.current) {
      // Floating animation
      ref.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5 + position[0]) * 0.1;
      
      // Rotate slightly when hovered
      if (hovered) {
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, Math.PI * 0.1, 0.1);
      } else {
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, 0, 0.1);
      }
      
      // Scale when clicked
      if (clicked) {
        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 1.2, 0.1);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 1.2, 0.1);
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 1.2, 0.1);
      } else {
        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 1, 0.1);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 1, 0.1);
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 1, 0.1);
      }
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card base */}
      <mesh scale={[1.2, 1.6, 0.1]} castShadow>
        <boxGeometry />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* Avatar with image texture */}
      <mesh position={[0, 0.4, 0.11]} scale={[0.9, 0.9, 0.05]}>
        <circleGeometry args={[0.5, 32]} />
        {texture && imageLoaded ? (
          <meshStandardMaterial 
            map={texture} 
            transparent={true}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial color="#222" />
        )}
      </mesh>
      
      {/* Name */}
      <Text
        position={[0, -0.3, 0.11]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
      >
        {name}
      </Text>
      
      {/* Role */}
      <Text
        position={[0, -0.5, 0.11]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
      >
        {role}
      </Text>
      
      {/* Info popup when clicked */}
      {clicked && (
        <Html position={[1.5, 0, 0]} center className="pointer-events-none">
          <div className="glass-morphism p-4 w-48 text-white">
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-gray-300">{role}</p>
            <p className="text-xs mt-2 text-gray-400">
              Working on gesture recognition and media control interfaces for our project.
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

export default TeamMember;
