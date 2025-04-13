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

  useEffect(() => {
    const timer = setTimeout(playGlitchSound, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <audio 
        ref={audioRef} 
        src="/src/assets/glitch-sound.mp3"
        preload="auto"
        playsInline
      />
      
      <img
        id="glitch-animation"
        className="relative"
        src="/src/assets/glogo.png"
        alt="Glitch Animation"
        style={{
          position: 'relative',
          animation: isGlitching 
            ? 'glitch-anim 0.2s steps(2) infinite, shake 0.5s cubic-bezier(.36,.07,.19,.97) both' 
            : 'glitch 1s infinite, blink 3s ease-in-out 2',
          filter: isGlitching 
            ? 'hue-rotate(90deg) contrast(1.5) brightness(1.2) saturate(1.5)' 
            : 'drop-shadow(2px 2px 0 rgba(0, 255, 255, 0.7))',
          transform: isGlitching ? 'scale(1.05)' : 'scale(1)',
          transition: 'filter 0.1s ease, transform 0.1s ease'
        }}
      />



    </>
  );
}

export default GlitchEffect;