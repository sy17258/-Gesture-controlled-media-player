
# Background UI Effects Guide

This guide explains how to use the background UI effects from the "Gesture Controlled Media Player" project in your own projects.

## Required Dependencies

- react
- framer-motion
- @react-three/fiber
- @react-three/drei
- three

## CSS Requirements

Make sure to include these CSS utility classes in your project:

```css
.glass-morphism {
  @apply backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)];
}

.neo-blur {
  @apply backdrop-blur-2xl bg-black/40 border border-white/10;
}

.text-gradient {
  @apply bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent;
}
```

## Components Overview

1. **BackgroundEffect**: Main component that renders the 3D scene with particles and hand gestures.
2. **GlassMorphismCard**: A simple card component with glass morphism styling.
3. **SceneContainer**: A wrapper for Three.js Canvas.
4. **ParticleField**: Creates a field of animated particles.
5. **HandGesture**: Renders 3D hand gestures with animations.

## Usage Example

```jsx
import BackgroundEffect from './components/ui/BackgroundEffect';
import GlassMorphismCard from './components/ui/GlassMorphismCard';

const YourComponent = () => {
  return (
    <div className="relative min-h-screen">
      {/* Background Effect */}
      <BackgroundEffect 
        particleCount={600} 
        particleColor="#8B5CF6" 
        showHandGestures={true} 
      />
      
      {/* Your content with glass morphism effect */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center">
        <GlassMorphismCard className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            Your Project Title
          </h1>
          <p className="text-xl text-gray-300">
            Your project description goes here.
          </p>
        </GlassMorphismCard>
      </div>
    </div>
  );
};

export default YourComponent;
```

## Customization

- **BackgroundEffect**:
  - `particleCount`: Number of particles in the background.
  - `particleColor`: Color of the particles.
  - `showHandGestures`: Whether to show hand gesture animations.

- **GlassMorphismCard**:
  - `className`: Additional CSS classes to apply.

## Implementation Notes

1. The background effect works best with a dark background color.
2. These components are designed to work with Tailwind CSS.
3. For best performance, avoid having too many 3D scenes on a single page.
