
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls, Environment, Loader } from '@react-three/drei';

interface SceneContainerProps {
  children: React.ReactNode;
  controls?: boolean;
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
}

const SceneContainer = ({ 
  children, 
  controls = true, 
  autoRotate = false,
  cameraPosition = [0, 0, 5] 
}: SceneContainerProps) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: cameraPosition }}
        dpr={[1, 2]}
        className="bg-transparent"
      >
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          {children}
        </Suspense>
        
        {controls && (
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>
      <Loader />
    </div>
  );
};

export default SceneContainer;
