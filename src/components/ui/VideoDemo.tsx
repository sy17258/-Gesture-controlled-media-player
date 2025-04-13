
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, Camera, CameraOff, RefreshCw, Upload } from 'lucide-react';
import WebcamFeed from './WebcamFeed';
import { Button } from './button';
import { toast } from 'sonner';

const VideoDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraRetryKey, setCameraRetryKey] = useState(0); // For forcing webcam remount
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleGestureSimulation = (gesture: string) => {
    setCurrentGesture(gesture);
    
    if (!videoRef.current) return;
    
    // Simulate the gesture effect
    switch(gesture) {
      case 'play':
        videoRef.current.play();
        setIsPlaying(true);
        break;
      case 'pause':
        videoRef.current.pause();
        setIsPlaying(false);
        break;
      case 'next':
        videoRef.current.currentTime += 10; // Skip forward 10 seconds
        toast.info("Skipped forward 10 seconds");
        break;
      case 'previous':
        videoRef.current.currentTime -= 10; // Skip backward 10 seconds
        toast.info("Skipped backward 10 seconds");
        break;
      case 'volumeUp':
        videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
        toast.info(`Volume: ${Math.round(videoRef.current.volume * 100)}%`);
        break;
      case 'volumeDown':
        videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
        toast.info(`Volume: ${Math.round(videoRef.current.volume * 100)}%`);
        break;
      default:
        break;
    }
    
    // Reset gesture display after delay
    setTimeout(() => {
      setCurrentGesture(null);
    }, 2000);
  };

  const toggleCamera = () => {
    if (!isCameraActive) {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Your browser does not support camera access');
        return;
      }
      
      // Force remounting the component to reinitialize camera
      setCameraRetryKey(prev => prev + 1);
      
      // Attempting to activate camera
      toast.info('Activating camera...');
    } else {
      toast.info('Deactivating camera...');
    }
    
    setIsCameraActive(!isCameraActive);
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Create object URL for the video
    const videoUrl = URL.createObjectURL(file);
    setSelectedVideo(videoUrl);
    toast.success(`Video "${file.name}" loaded successfully`);

    // Auto-play the video when selected
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setIsPlaying(true);
        videoRef.current?.play();
      };
    }
  };

  // Clean up object URL when component unmounts or when a new video is selected
  useEffect(() => {
    return () => {
      if (selectedVideo) {
        URL.revokeObjectURL(selectedVideo);
      }
    };
  }, [selectedVideo]);
  
  return (
    <div className="glass-morphism rounded-lg p-6 w-full max-w-5xl mx-auto">
      
      <h1 className="button text-center m-2">
          <span>&nbsp;Gesture Controlled Media Player&nbsp;</span>
          <span className="hover-text" aria-hidden="true" data-text="&nbsp;Gesture Controlled Media Player&nbsp;">
            &nbsp;Gesture Controlled Media Player&nbsp;
          </span>
        </h1>
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
        
      
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          onClick={toggleCamera} 
          className="flex items-center gap-2 bg-[#00f2fe] hover:bg-[#00f2fe] text-black font-mono text-sm px-4 py-2 rounded-md border-2 border-[#00f2fe] hover:border-[#4facfe] transition-all duration-300 hover:shadow-[0_0_15px_#00f2fe]"
          variant={isCameraActive ? "destructive" : "default"}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="h-4 w-4" />
              <span>Stop Camera</span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              <span>Start Camera</span>
            </>
          )}
        </Button>
        
        <Button
          onClick={handleFileSelect}
          className="flex items-center gap-2 border-2 border-dashed border-blue-400 hover:border-blue-300 transition-colors animate-pulse"
          variant="secondary"
        >
          <Upload className="h-4 w-4" />
          <span>Select Video</span>
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side: Video Player */}
        <div className="aspect-video bg-gray-900 rounded-md overflow-hidden relative mb-3">
          {selectedVideo ? (
            <video
              ref={videoRef}
              src={selectedVideo}
              className="w-full h-full object-contain"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white opacity-70">Select a video to play</p>
            </div>
          )}
          
          {/* Gesture Indicator Overlay */}
          {currentGesture && (
            <motion.div 
              className="absolute top-4 right-4 glass-morphism px-3 py-1 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-white font-medium">
                {currentGesture} gesture detected
              </p>
            </motion.div>
          )}

          {/* Video controls overlay */}
          {selectedVideo && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex space-x-2 glass-morphism rounded-full px-3 py-1">
                <button onClick={() => handleGestureSimulation('previous')} className="text-white">
                  <SkipBack size={18} />
                </button>
                <button onClick={() => handleGestureSimulation(isPlaying ? 'pause' : 'play')} className="text-white">
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => handleGestureSimulation('next')} className="text-white">
                  <SkipForward size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side: Camera Feed */}
        <div className={isCameraActive ? "" : "flex items-center justify-center aspect-video bg-gray-800 rounded-md"}>
          {isCameraActive ? (
            <WebcamFeed 
              key={cameraRetryKey} // Force remount when this key changes
              onGestureDetected={handleGestureSimulation} 
              isActive={isCameraActive} 
            />
          ) : (
            <p className="text-white text-center opacity-70">Camera is off. Click "Start Camera" to enable hand gesture recognition.</p>
          )}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-6">
        <button 
          className="flex flex-col items-center glass-morphism p-3 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => handleGestureSimulation('previous')}
        >
          <SkipBack className="h-8 w-8 text-white mb-1" />
          <span className="text-white text-xs">Previous</span>
        </button>
        
        <button 
          className="flex flex-col items-center glass-morphism p-3 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => handleGestureSimulation(isPlaying ? 'pause' : 'play')}
        >
          {isPlaying ? (
            <>
              <Pause className="h-8 w-8 text-white mb-1" />
              <span className="text-white text-xs">Pause</span>
            </>
          ) : (
            <>
              <Play className="h-8 w-8 text-white mb-1" />
              <span className="text-white text-xs">Play</span>
            </>
          )}
        </button>
        
        <button 
          className="flex flex-col items-center glass-morphism p-3 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => handleGestureSimulation('next')}
        >
          <SkipForward className="h-8 w-8 text-white mb-1" />
          <span className="text-white text-xs">Next</span>
        </button>
        
        <button 
          className="flex flex-col items-center glass-morphism p-3 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => handleGestureSimulation('volumeDown')}
        >
          <Volume1 className="h-8 w-8 text-white mb-1" />
          <span className="text-white text-xs">Volume Down</span>
        </button>
        
        <button 
          className="flex flex-col items-center glass-morphism p-3 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => handleGestureSimulation('volumeUp')}
        >
          <Volume2 className="h-8 w-8 text-white mb-1" />
          <span className="text-white text-xs">Volume Up</span>
        </button>
      </div>
      
      <p className="text-center text-gray-400 mt-6 text-sm">
        {isCameraActive 
          ? "Use hand gestures or click the buttons above to control the player" 
          : "Click the buttons above to control the player or enable camera for gesture control"}
      </p>
    </div>
  );
};

export default VideoDemo;
