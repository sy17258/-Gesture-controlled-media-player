import React, { useState, useEffect, useRef } from "react";

function GlitchEffect() {
  const [isGlitching, setIsGlitching] = useState(false);
  const audioRef = useRef(null);
  
  const playGlitchSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1.0;
      audioRef.current.play()
        .then(() => {
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), 800);
        })
        .catch(e => console.log('Audio play error:', e));
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        playGlitchSound();
      }
      
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Don't auto-play on load - this causes the NotAllowedError
  // useEffect(() => {
  //   const timer = setTimeout(playGlitchSound, 300);
  //   return () => clearTimeout(timer);
  // }, []);

  // Add a check to see if the image exists
  const [imageLoaded, setImageLoaded] = useState(true);
  const imagePath = 'https://cdn.pixabay.com/photo/2025/05/02/03/08/03-08-47-286_1280.png';
  const audioPath = '/assets/glitch-sound.mp3';

  return (
    <>
      <audio 
        ref={audioRef} 
        src={audioPath}
        preload="auto"
        playsInline
      />
      
      {imageLoaded && (
        <img
          id="glitch-animation"
          className="relative z-10"
          src={imagePath}
          alt="Glitch Animation"
          onError={() => {
            console.error("Failed to load glogo.png");
            setImageLoaded(false);
          }}
          style={{
            position: 'relative',
            animation: isGlitching 
              ? 'glitch-anim 0.2s steps(2) infinite, shake 0.5s cubic-bezier(.36,.07,.19,.97) both' 
              : 'glitch 1s infinite, blink 3s ease-in-out 2',
            filter: isGlitching 
              ? 'hue-rotate(90deg) contrast(1.5) brightness(1.2) saturate(1.5)' 
              : 'drop-shadow(2px 2px 0 rgba(0, 255, 255, 0.7))',
            transform: isGlitching ? 'scale(1.05)' : 'scale(1)',
            transition: 'filter 0.1s ease, transform 0.1s ease',
            pointerEvents: 'none' // Ensure it doesn't block interactions
          }}
        />
      )}

      {!imageLoaded && (
        <div className="relative z-10 text-center p-4">
          <p className="text-cyan-400">Logo image not found</p>
        </div>
      )}
    </>
  );
}

export default GlitchEffect;