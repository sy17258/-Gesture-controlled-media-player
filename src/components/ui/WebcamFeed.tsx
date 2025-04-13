import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FilesetResolver, HandLandmarker, GestureRecognizer } from '@mediapipe/tasks-vision';
import { useFullscreen } from '../../hooks/use-fullscreen';

declare global {
  interface Window {
    offscreenCanvas: HTMLCanvasElement;
  }
}

interface WebcamFeedProps {
  onGestureDetected?: (gesture: string) => void;
  isActive?: boolean;
}

const WebcamFeed = ({ onGestureDetected, isActive = false }: WebcamFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<any>(null);
  const [gestureRecognizer, setGestureRecognizer] = useState<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastGesture, setLastGesture] = useState('None');
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  const handPositionRef = useRef({
    current: { x: null, y: null },
    previous: { x: null, y: null },
    lastGestureTime: 0,
  });

  const debounceTime = 300;

  const drawConnections = (ctx, landmarks, width, height) => {
    const connections = [
      [0, 5], [0, 17], [5, 9], [9, 13], [13, 17],
      [0, 1], [1, 2], [2, 3], [3, 4],
      [5, 6], [6, 7], [7, 8],
      [9, 10], [10, 11], [11, 12],
      [13, 14], [14, 15], [15, 16],
      [17, 18], [18, 19], [19, 20],
    ];

    ctx.strokeStyle = "#33C3F0";
    ctx.lineWidth = 2;

    for (const [start, end] of connections) {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * width, startPoint.y * height);
        ctx.lineTo(endPoint.x * width, endPoint.y * height);
        ctx.stroke();
      }
    }
  };

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !handLandmarker || !gestureRecognizer || !isActive) {
      if (isActive) {
        requestAnimationFrame(processFrame);
      }
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!window.offscreenCanvas) {
          window.offscreenCanvas = document.createElement('canvas');
          window.offscreenCanvas.width = canvas.width;
          window.offscreenCanvas.height = canvas.height;
        }

        const offscreenCanvas = window.offscreenCanvas;
        const offscreenContext = offscreenCanvas.getContext('2d');

        if (!offscreenContext) return;

        offscreenContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
        offscreenContext.fillRect(0, 0, canvas.width, canvas.height);

        offscreenContext.save();
        offscreenContext.scale(-1, 1);
        offscreenContext.translate(-canvas.width, 0);
        offscreenContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        offscreenContext.restore();

        const nowInMs = Date.now();

        frameCountRef.current++;
        if (frameCountRef.current >= 30) {
          if (lastTimeRef.current) {
            const deltaTime = (nowInMs - lastTimeRef.current) / 1000;
            const calculatedFps = Math.round(frameCountRef.current / deltaTime);
            setFps(calculatedFps);
          }
          lastTimeRef.current = nowInMs;
          frameCountRef.current = 0;
        }

        let handResults;
        try {
          handResults = handLandmarker.detectForVideo(video, nowInMs);
        } catch (err) {
          console.error("Error in hand detection:", err);
          handResults = { landmarks: [] };
        }

        let gestureResults = null;
        if (handResults.landmarks && handResults.landmarks.length > 0) {
          setHandDetected(true);

          try {
            gestureResults = gestureRecognizer.recognizeForVideo(video, nowInMs);
          } catch (err) {
            console.error("Error in gesture recognition:", err);
            gestureResults = { gestures: [] };
          }

          for (const landmarks of handResults.landmarks) {
            drawConnections(offscreenContext, landmarks, canvas.width, canvas.height);

            for (let i = 0; i < landmarks.length; i++) {
              const landmark = landmarks[i];
              const cx = Math.round(landmark.x * canvas.width);
              const cy = Math.round(landmark.y * canvas.height);

              if (i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
                offscreenContext.beginPath();
                offscreenContext.arc(cx, cy, 5, 0, 2 * Math.PI);
                offscreenContext.fillStyle = "#FFFFFF";
                offscreenContext.fill();
              }
            }
          }

          if (gestureResults && gestureResults.gestures && gestureResults.gestures.length > 0) {
            const gesture = gestureResults.gestures[0][0];
            const gestureName = gesture.categoryName;
            const gestureScore = gesture.score.toFixed(2);

            if (gesture.score > 0.7) {
              const currentTime = Date.now();
              const timeSinceLastGesture = currentTime - handPositionRef.current.lastGestureTime;

              if (timeSinceLastGesture > debounceTime) {
                setLastGesture(`${gestureName} (${gestureScore})`);

                let mappedGesture = '';
                switch (gestureName) {
                  case 'Closed_Fist':
                  case 'Closed_Hand':
                    mappedGesture = 'pause';
                    break;
                  case 'Open_Palm':
                  case 'Open_Hand':
                    mappedGesture = 'play';
                    break;
                  case 'Thumb_Up':
                  case 'Thumbs_Up':
                    mappedGesture = 'volumeUp';
                    break;
                  case 'Thumb_Down':
                  case 'Thumbs_Down':
                    mappedGesture = 'volumeDown';
                    break;
                  case 'Victory':
                  case 'Peace':
                    mappedGesture = 'next';
                    break;
                  case 'ILoveYou':
                    mappedGesture = 'previous';
                    break;
                  case 'Pointing_Up':
                    mappedGesture = 'fullscreen';
                    setTimeout(() => {
                      console.log("Toggling fullscreen mode");
                      toggleFullscreen();
                    }, 100);
                    break;
                  case 'Call_Me':
                  case 'Rock':
                    mappedGesture = 'selectFiles';
                    setTimeout(() => {
                      console.log("Opening file selection dialog");
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.multiple = true;
                      fileInput.accept = 'video/*,audio/*,image/*';
                      fileInput.click();
                      fileInput.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          console.log('Files selected:', files);
                          toast.success(`Selected ${files.length} files`);
                        }
                      };
                    }, 100);
                    break;
                }

                if (mappedGesture && onGestureDetected) {
                  console.log(`Detected gesture: ${mappedGesture}`);
                  onGestureDetected(mappedGesture);
                  handPositionRef.current.lastGestureTime = currentTime;
                }
              }
            }

            if (gestureResults.landmarks && gestureResults.landmarks.length > 0) {
              const handLandmarks = gestureResults.landmarks[0];
              let sumX = 0;
              let sumY = 0;

              for (const landmark of handLandmarks) {
                sumX += landmark.x;
                sumY += landmark.y;
              }

              const handCenter = {
                x: sumX / handLandmarks.length,
                y: sumY / handLandmarks.length,
              };

              handPositionRef.current.previous = { ...handPositionRef.current.current };
              handPositionRef.current.current = handCenter;

              if (handPositionRef.current.previous.x !== null) {
                const deltaX = handPositionRef.current.current.x - handPositionRef.current.previous.x;
                const deltaY = handPositionRef.current.current.y - handPositionRef.current.previous.y;
                const timeSinceLastGesture = Date.now() - handPositionRef.current.lastGestureTime;

                if (Math.abs(deltaX) > 0.03 && Math.abs(deltaY) < 0.02 && timeSinceLastGesture > debounceTime) {
                  if (deltaX < -0.03) {
                    if (onGestureDetected) {
                      onGestureDetected('next');
                      setLastGesture("Swipe Left");
                      handPositionRef.current.lastGestureTime = Date.now();
                    }
                  } else if (deltaX > 0.03) {
                    if (onGestureDetected) {
                      onGestureDetected('previous');
                      setLastGesture("Swipe Right");
                      handPositionRef.current.lastGestureTime = Date.now();
                    }
                  }
                }
              }
            }
          }
        } else {
          setHandDetected(false);
        }

        offscreenContext.fillStyle = "#ffffff";
        offscreenContext.font = "14px Arial";
        offscreenContext.fillText(`FPS: ${fps}`, 10, 20);
        offscreenContext.fillText(`Last Gesture: ${lastGesture}`, 10, 40);

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(offscreenCanvas, 0, 0);
      }

      requestAnimationFrame(processFrame);
    } catch (err) {
      console.error("Error processing frame:", err);
      requestAnimationFrame(processFrame);
    }
  }, [handLandmarker, gestureRecognizer, onGestureDetected, isActive, fps, lastGesture, debounceTime, toggleFullscreen]);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!isMounted) return;

        let handLandmarkerInstance;
        try {
          handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuError) {
          handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (!isMounted) return;

        let gestureRecognizerInstance;
        try {
          gestureRecognizerInstance = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-assets/gesture_recognizer.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuError) {
          gestureRecognizerInstance = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-assets/gesture_recognizer.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (!isMounted) return;

        setHandLandmarker(handLandmarkerInstance);
        setGestureRecognizer(gestureRecognizerInstance);
        setIsModelLoaded(true);
        setIsLoading(false);
      } catch (error: any) {
        if (isMounted) {
          setError(`Error loading models: ${error.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let frameId: number | null = null;

    if (isActive && isModelLoaded) {
      setupCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isActive, isModelLoaded]);

  const setupCamera = async () => {
    if (!videoRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      
      if (mediaStream.getVideoTracks().length === 0) {
        throw new Error("No video tracks found in media stream");
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        
        videoRef.current.style.display = 'block';
        videoRef.current.style.width = '100%';
        videoRef.current.style.height = '100%';
        videoRef.current.style.objectFit = 'cover';
        videoRef.current.style.opacity = '1';
        
        if (canvasRef.current) {
          canvasRef.current.width = 640;
          canvasRef.current.height = 480;
        }
        
        const loadingTimeout = setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
            setHasPermission(true);
          }
        }, 5000);
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsLoading(false);
            setHasPermission(true);
            clearTimeout(loadingTimeout);
            
            requestAnimationFrame(processFrame);
          } catch (err) {
            setError("Failed to play video after metadata loaded");
            setIsLoading(false);
            clearTimeout(loadingTimeout);
          }
        };
        
        try {
          await videoRef.current.play();
          setIsLoading(false);
          setHasPermission(true);
          toast.success("Camera activated successfully");
          
          requestAnimationFrame(processFrame);
        } catch (playError) {
          // Will try again after metadata loads
        }
      }
    } catch (accessError) {
      setIsLoading(false);
      setHasPermission(false);
      const errorMessage = accessError instanceof Error ? accessError.message : "Unknown error";
      setError(`Camera access failed: ${errorMessage}`);
      toast.error("Camera access denied. Please check browser permissions.");
    }
  };

  const stopCamera = () => {
    setError(null);
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} stopped:`, track.readyState);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load(); // Force release of media resources
    }
    
    setHandDetected(false);
    setHasPermission(null); // Reset permission state
    
    // Ensure any pending animation frames are canceled
    if (window.requestAnimationFrame) {
      const highestId = window.requestAnimationFrame(() => {});
      for (let id = highestId; id >= 0; id--) {
        window.cancelAnimationFrame(id);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && isActive) {
      const resizeObserver = new ResizeObserver(() => {
        if (canvasRef.current && videoRef.current) {
          const container = videoRef.current.parentElement;
          if (container) {
            canvasRef.current.width = container.clientWidth;
            canvasRef.current.height = container.clientHeight;
          }
        }
      });
      
      if (videoRef.current.parentElement) {
        resizeObserver.observe(videoRef.current.parentElement);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isActive]);

  return (
    <div className="glass-morphism rounded-lg p-3 relative">
      <h3 className="text-white text-lg font-medium mb-2">Hand Gesture Recognition</h3>
      <div className="relative aspect-video overflow-hidden rounded-md bg-black webcam-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: 'scaleX(-1)',
            display: 'block',
            opacity: '1',
            zIndex: '1',
          }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            zIndex: '2',
          }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 3 }}>
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tech-blue mb-2"></div>
              <p className="text-white text-sm">Initializing camera...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70" style={{ zIndex: 3 }}>
            <div className="text-center p-4">
              <p className="text-red-400 mb-2">Camera Error</p>
              <p className="text-white text-sm">{error}</p>
              <p className="text-white text-xs mt-2">Please refresh the page to try again</p>
            </div>
          </div>
        )}
        {handDetected && (
          <motion.div
            className="absolute top-2 right-2 bg-tech-blue/80 text-white text-xs px-2 py-1 rounded-full"
            style={{ zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Hand detected
          </motion.div>
        )}
        {isFullscreen && (
          <motion.div
            className="absolute top-2 left-2 bg-tech-blue/80 text-white text-xs px-2 py-1 rounded-full"
            style={{ zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Fullscreen Mode
          </motion.div>
        )}
        <div className="absolute bottom-2 left-2 text-white text-xs opacity-70" style={{ zIndex: 3 }}>
          FPS: {fps} | Last: {lastGesture}
        </div>
      </div>
      <div className="mt-2 text-gray-300 text-xs">
        <p>Move your hand in front of the camera to control the media player.</p>
        <p className="mt-1">✋ = Play | 👊 = Pause | 👍 = Volume Up | 👎 = Volume Down | ✌️ = Forward 10 sec | 🤟 = Backward 10 sec | ☝️ = Fullscreen | 🤘 = Select Files</p>
      </div>
    </div>
  );
};

export default WebcamFeed;