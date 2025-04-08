import React, { useState, useEffect, useRef, lazy } from "react";
import VideoSelector from "./components/VideoSelector";
import VideoPlayer from "./components/VideoPlayer";
import gLogo from "./assets/glogo.png";
import glitchSound from "./assets/glitch-sound.mp3";

// Use lazy loading for the heavy CombinedDetector component
const CombinedDetector = lazy(() => import("./components/CombinedDetector"));

// Only initialize LocomotiveScroll when needed
function App() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [cameraActive, setCameraActive] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const audioRef = useRef(null);
  const locomotiveRef = useRef(null);

  // Initialize LocomotiveScroll only when needed
  useEffect(() => {
    // Only import and initialize when component mounts
    if (!locomotiveRef.current) {
      import('locomotive-scroll').then(({ default: LocomotiveScroll }) => {
        locomotiveRef.current = new LocomotiveScroll({
          // Reduce GPU usage with these options
          smooth: true,
          smoothMobile: false,
          lerp: 0.1, // Lower value = less GPU intensive
          smartphone: {
            smooth: false
          },
          tablet: {
            smooth: false
          }
        });
      });
    }

    // Cleanup function
    return () => {
      if (locomotiveRef.current) {
        locomotiveRef.current.destroy();
        locomotiveRef.current = null;
      }
    };
  }, []);

  // Simplified glitch sound function
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

  // User interaction listener
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

  // Play sound on load - with reduced timeout
  useEffect(() => {
    const timer = setTimeout(playGlitchSound, 300); // Reduced from 500ms
    return () => clearTimeout(timer);
  }, []);

  // Core player functions
  const togglePlay = () => setPlaying(!isPlaying);
  const increaseVolume = () => setVolume(prev => Math.min(prev + 0.1, 1));
  const decreaseVolume = () => setVolume(prev => Math.max(prev - 0.1, 0));
  const previousTrack = () => {
    if (videos.length > 0) {
      setCurrentIndex((currentIndex - 1 + videos.length) % videos.length);
    }
  };
  const nextTrack = () => {
    if (videos.length > 0) {
      setCurrentIndex((currentIndex + 1) % videos.length);
    }
  };
  const toggleCamera = (state) => {
    console.log("Camera toggle requested:", state);
    // Only update state if it's different from current state
    if (state !== cameraActive) {
      setCameraActive(state);
    }
  };

  // Auto-play when videos are loaded
  useEffect(() => {
    if (videos.length > 0) {
      setCurrentIndex(0);
      setPlaying(true);
    }
  }, [videos]);

  return (
    <>
      <audio 
        ref={audioRef} 
        src={glitchSound} 
        preload="auto"
        playsInline
      ></audio>
      
      <img
        id="front"
        className={`front ${isGlitching ? 'glitch-effect-intense' : 'glitch-effect'}`}
        src={gLogo}
        alt="Gesture Animation"
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
    
      <div className="app-container" style={{ padding: '20px' }}>
        <style>
          {`
          /* === removing default button style ===*/
          .button {
            margin: 0;
            height: auto;
            background: transparent;
            padding: 0;
            border: none;
            cursor: pointer;
          }

          /* button styling */
          .button {
            --border-right: 6px;
            --text-stroke-color: rgba(255,255,255,0.6);
            --animation-color: #00f2fe;
            --fs-size: 2em;
            letter-spacing: 3px;
            text-decoration: none;
            font-size: var(--fs-size);
            font-family: "Arial";
            position: relative;
            text-transform: uppercase;
            color: transparent;
            -webkit-text-stroke: 1px var(--text-stroke-color);
          }
          /* this is the text, when you hover on button */
          .hover-text {
            position: absolute;
            box-sizing: border-box;
            content: attr(data-text);
            color: var(--animation-color);
            width: 0%;
            inset: 0;
            border-right: var(--border-right) solid var(--animation-color);
            overflow: hidden;
            transition: 0.5s;
            -webkit-text-stroke: 1px var(--animation-color);
          }
          /* hover */
          .button:hover .hover-text {
            width: 100%;
            filter: drop-shadow(0 0 23px var(--animation-color))
          }
          `}
        </style>

        <h1 className="button">
          <span>&nbsp;Gesture Controlled Media Player&nbsp;</span>
          <span className="hover-text" aria-hidden="true" data-text="&nbsp;Gesture Controlled Media Player&nbsp;">
            &nbsp;Gesture Controlled Media Player&nbsp;
          </span>
        </h1>
        
        <div className="camera-controls">
          <button 
            className="camera-button"
            onClick={() => toggleCamera(true)} 
            disabled={cameraActive}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
            </svg>
            Open Camera
          </button>
          <button
            className="camera-button"
            onClick={() => toggleCamera(false)} 
            disabled={!cameraActive}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
              <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
              <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
            </svg>
            Close Camera
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%', 
          margin: '20px 0' 
        }}>
          <VideoSelector setVideos={setVideos} />
        </div>

        {/* Updated responsive layout for video player and detector */}
        <div className="player-container" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginTop: '20px'
        }}> 
          <div className="video-section" style={{
            flex: '1 1 500px',
            minWidth: '300px',
            maxWidth: '800px'
          }}>
            {videos.length > 0 ? (
              <VideoPlayer
                video={videos[currentIndex]}
                isPlaying={isPlaying}
                volume={volume}
              />
            ) : (
              <div style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '8px'
              }}>
                <p>Please select video files to play</p>
              </div>
            )}
            
            {videos.length > 0 && (
              <div className="player-controls" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                
              </div>
            )}
          </div>
          
          <div className="detector-section" style={{
            flex: '1 1 400px',
            minWidth: '280px',
            maxWidth: '500px',
            margin: '0 auto',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <CombinedDetector
              togglePlay={togglePlay}
              increaseVolume={increaseVolume}
              decreaseVolume={decreaseVolume}
              previousTrack={previousTrack}
              nextTrack={nextTrack}
              maxHands={1}
              detectionConfidence={0.7}
              trackingConfidence={0.7}
              cameraActive={cameraActive}
              isPlaying={isPlaying}
              toggleCamera={toggleCamera}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
