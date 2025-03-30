import React, { useState, useEffect } from 'react';
import VideoSelector from './components/VideoSelector';
import VideoPlayer from './components/VideoPlayer';
import CombinedDetector from './components/CombinedDetector';
// import { Vortex } from "./ui/vortex";

function App() {
  const [videos, setVideos] = useState([]); // List of video files
  const [currentIndex, setCurrentIndex] = useState(0); // Current video index
  const [isPlaying, setPlaying] = useState(false); // Play/pause state
  const [volume, setVolume] = useState(0.5); // Volume level
  const [cameraActive, setCameraActive] = useState(false); // Add camera state

  // Function to play/pause the video
  const togglePlay = () => {
    setPlaying(!isPlaying);
  };

  // Function to increase volume with bounds checking
  const increaseVolume = () => {
    setVolume(prev => Math.min(prev + 0.1, 1));
  };

  // Function to decrease volume with bounds checking
  const decreaseVolume = () => {
    setVolume(prev => Math.max(prev - 0.1, 0));
  };

  // Function to go to previous track with safety check
  const previousTrack = () => {
    if (videos.length > 0) {
      setCurrentIndex((currentIndex - 1 + videos.length) % videos.length);
    }
  };

  // Function to go to next track with safety check
  const nextTrack = () => {
    if (videos.length > 0) {
      setCurrentIndex((currentIndex + 1) % videos.length);
    }
  };

  // Add a more robust camera toggle function
  const toggleCamera = (state) => {
    // Only change state if it's different to prevent unnecessary re-renders
    if (state !== cameraActive) {
      console.log("Setting camera active state to:", state);
      setCameraActive(state);
    }
  };

  // Reset current index when videos change and start playing automatically
  useEffect(() => {
    if (videos.length > 0) {
      setCurrentIndex(0);
      setPlaying(true); // Automatically start playing when videos are loaded
    }
  }, [videos]);

  return (
    <div className="app-container" style={{ padding: '20px' }}>
      <h1>Gesture Controlled Media Player</h1>
      <VideoSelector setVideos={setVideos} />
      
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
      
      {videos.length > 0 ? (
        <VideoPlayer
          video={videos[currentIndex]}
          isPlaying={isPlaying}
          volume={volume}
        />
      ) : (
        <p>Please select video files to play</p>
      )}
      <div style={{ marginTop: '20px' }}>
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
        />
      </div>
    </div>
  );
}

export default App;