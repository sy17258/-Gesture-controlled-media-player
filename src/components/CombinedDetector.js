import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, GestureRecognizer } from '@mediapipe/tasks-vision';

function CombinedDetector({ 
  maxHands = 1, 
  detectionConfidence = 0.7, 
  trackingConfidence = 0.7,
  togglePlay,
  increaseVolume,
  decreaseVolume,
  previousTrack,
  nextTrack,
  cameraActive = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [handLandmarks, setHandLandmarks] = useState([]);
  const [fps, setFps] = useState(0);
  const [lastGesture, setLastGesture] = useState('None');
  
  // For FPS calculation
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  
  // Use refs for hand tracking to persist between renders
  const handPositionRef = useRef({
    current: { x: null, y: null },
    previous: { x: null, y: null },
    lastGestureTime: 0
  });

  // Reduce debounce time for more responsive gestures
  const debounceTime = 300; // Reduced from 500ms to 300ms for better responsiveness
  
  // Function to draw connections between landmarks (simplified)
  const drawConnections = (ctx, landmarks, width, height) => {
    // Define essential hand connections only
    const connections = [
      [0, 5], [0, 17], [5, 9], [9, 13], [13, 17], // palm
      [0, 1], [1, 2], [2, 3], [3, 4],             // thumb
      [5, 6], [6, 7], [7, 8],                     // index finger
      [9, 10], [10, 11], [11, 12],                // middle finger
      [13, 14], [14, 15], [15, 16],               // ring finger
      [17, 18], [18, 19], [19, 20]                // pinky
    ];
    
    ctx.strokeStyle = "#00ff00";
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
  
  // Fix the processFrame function with proper dependencies and error handling
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !handLandmarker || !gestureRecognizer || !cameraActive) {
      // Skip processing if any required element is missing
      if (cameraActive) {
        // Continue the animation loop even when not processing
        requestAnimationFrame(processFrame);
      }
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Only process if video is playing and has enough data
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Create a persistent offscreen canvas instead of creating a new one each frame
        if (!window.offscreenCanvas) {
          window.offscreenCanvas = document.createElement('canvas');
          window.offscreenCanvas.width = canvas.width;
          window.offscreenCanvas.height = canvas.height;
        }
        
        const offscreenCanvas = window.offscreenCanvas;
        const offscreenContext = offscreenCanvas.getContext('2d');
        
        // Clear offscreen canvas with proper alpha to prevent flickering
        offscreenContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
        offscreenContext.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame on offscreen canvas
        offscreenContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get current timestamp for this frame
        const nowInMs = Date.now();
        
        // Calculate FPS (update every 30 frames to reduce state updates)
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
        
        // Process for hand landmarks with error handling
        let handResults;
        try {
          handResults = handLandmarker.detectForVideo(video, nowInMs);
        } catch (err) {
          console.error("Error in hand detection:", err);
          handResults = { landmarks: [] };
        }
        
        // Only process gestures if hands are detected
        let gestureResults = null;
        if (handResults.landmarks && handResults.landmarks.length > 0) {
          try {
            gestureResults = gestureRecognizer.recognizeForVideo(video, nowInMs);
          } catch (err) {
            console.error("Error in gesture recognition:", err);
            gestureResults = { gestures: [] };
          }
          
          // Process hand landmarks
          const processedLandmarks = handResults.landmarks.map((handLandmarks) => {
            // Draw hand landmarks if available
            drawConnections(offscreenContext, handLandmarks, canvas.width, canvas.height);
            // Process all landmarks for better accuracy
            return handLandmarks.map((landmark, id) => {
              const cx = Math.round(landmark.x * canvas.width);
              const cy = Math.round(landmark.y * canvas.height);
              
              // Draw key landmarks
              if (id === 0 || id === 4 || id === 8 || id === 12 || id === 16 || id === 20) {
                offscreenContext.beginPath();
                offscreenContext.arc(cx, cy, 5, 0, 2 * Math.PI);
                offscreenContext.fillStyle = "#ff00ff";
                offscreenContext.fill();
                
                // Add label for key points
                offscreenContext.fillStyle = "#ffffff";
                offscreenContext.font = "10px Arial";
                offscreenContext.fillText(`${id}`, cx + 10, cy);
              }
              
              return [id, cx, cy, landmark.z];
            });
          });
          
          // Use functional update to prevent state batching issues
          setHandLandmarks(prevLandmarks => {
            // Only update if there's a significant change to reduce rerenders
            if (JSON.stringify(prevLandmarks) !== JSON.stringify(processedLandmarks)) {
              return processedLandmarks;
            }
            return prevLandmarks;
          });
          
          // Process gestures with improved reliability
          if (gestureResults && gestureResults.gestures && gestureResults.gestures.length > 0) {
            // Get the most confident gesture
            const gesture = gestureResults.gestures[0][0]; // First hand, first gesture
            const gestureName = gesture.categoryName;
            const gestureScore = gesture.score.toFixed(2);
            
            // Only process high-confidence gestures
            if (gesture.score > 0.6) { // Lower threshold for better detection
              const currentTime = Date.now();
              const timeSinceLastGesture = currentTime - handPositionRef.current.lastGestureTime;
              
              if (timeSinceLastGesture > debounceTime) {
                setLastGesture(`${gestureName} (${gestureScore})`);
                
                // Handle gesture with improved reliability
                switch (gestureName) {
                  case 'Closed_Fist':
                  case 'Closed_Hand': // Alternative name
                    togglePlay();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  case 'Open_Palm':
                  case 'Open_Hand': // Alternative name
                    togglePlay();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  case 'Thumb_Up':
                  case 'Thumbs_Up': // Alternative name
                    increaseVolume();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  case 'Thumb_Down':
                  case 'Thumbs_Down': // Alternative name
                    decreaseVolume();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  case 'Victory':
                  case 'Peace': // Alternative name
                    nextTrack();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  case 'ILoveYou': // Hidden gesture
                    previousTrack();
                    handPositionRef.current.lastGestureTime = currentTime;
                    break;
                  default:
                    // Don't update lastGestureTime for unrecognized gestures
                    break;
                }
              }
            }
            
            // Track hand movement for swipe gestures with improved reliability
            if (gestureResults.landmarks && gestureResults.landmarks.length > 0) {
              const handLandmarks = gestureResults.landmarks[0]; // First hand landmarks
              let sumX = 0;
              let sumY = 0;
              
              for (const landmark of handLandmarks) {
                sumX += landmark.x;
                sumY += landmark.y;
              }
              
              const handCenter = {
                x: sumX / handLandmarks.length,
                y: sumY / handLandmarks.length
              };
              
              handPositionRef.current.previous = { ...handPositionRef.current.current };
              handPositionRef.current.current = handCenter;
              
              // Detect horizontal swipes with improved reliability
              if (handPositionRef.current.previous.x !== null) {
                const deltaX = handPositionRef.current.current.x - handPositionRef.current.previous.x;
                const deltaY = handPositionRef.current.current.y - handPositionRef.current.previous.y;
                
                const timeSinceLastGesture = Date.now() - handPositionRef.current.lastGestureTime;
                
                // Make swipe detection more reliable with lower thresholds
                if (Math.abs(deltaX) > 0.03 && Math.abs(deltaY) < 0.02 && timeSinceLastGesture > debounceTime) {
                  if (deltaX < -0.03) {
                    nextTrack();
                    setLastGesture("Swipe Left");
                    handPositionRef.current.lastGestureTime = Date.now();
                  } else if (deltaX > 0.03) {
                    previousTrack();
                    setLastGesture("Swipe Right");
                    handPositionRef.current.lastGestureTime = Date.now();
                  }
                }
              }
            }
          }
        } else {
          // Only update if currently showing landmarks
          if (handLandmarks && handLandmarks.length > 0) {
            setHandLandmarks([]);
          }
        }
        
        // Draw FPS and last detected gesture on offscreen canvas
        offscreenContext.fillStyle = "#ffffff";
        offscreenContext.font = "14px Arial";
        offscreenContext.fillText(`FPS: ${fps}`, 10, 20);
        offscreenContext.fillText(`Last Gesture: ${lastGesture}`, 10, 40);
        
        // Now draw the offscreen canvas to the visible canvas in one operation
        // This prevents flickering by updating the visible canvas only once per frame
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(offscreenCanvas, 0, 0);
      }
      
      // Continue processing frames with proper timing using RAF
      requestAnimationFrame(processFrame);
    } catch (err) {
      console.error("Error processing frame:", err);
      // Continue the animation loop even when errors occur
      requestAnimationFrame(processFrame);
    }
  }, [handLandmarker, gestureRecognizer, togglePlay, increaseVolume, decreaseVolume, nextTrack, previousTrack, debounceTime, cameraActive, fps, lastGesture, handLandmarks]);
  
  // In the camera handling useEffect
  useEffect(() => {
    let animationFrameId = null;
    let isMounted = true;
    const videoElement = videoRef.current;
    
    if (isModelLoaded && videoElement && canvasRef.current && cameraActive) {
      console.log("Starting camera with active state:", cameraActive);
      
      const startCamera = async () => {
        try {
          // Check if there's already an active stream to prevent duplicate streams
          if (videoElement.srcObject && videoElement.srcObject.active) {
            console.log("Camera already active, reusing stream");
            // If stream exists, just start processing frames
            animationFrameId = requestAnimationFrame(processFrame);
            return;
          }
          
          const constraints = {
            video: {
              width: 320,
              height: 240,
              facingMode: 'user',
              frameRate: { ideal: 30, max: 60 }
            }
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Check if component is still mounted and camera is still active
          if (!isMounted || !cameraActive) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          videoElement.srcObject = stream;
          
          videoElement.onloadedmetadata = () => {
            if (!isMounted || !cameraActive) return;
            
            videoElement.play().catch(err => {
              console.error("Error playing video:", err);
            });
            
            // Start processing frames after video starts playing
            animationFrameId = requestAnimationFrame(processFrame);
          };
        } catch (err) {
          console.error("Error accessing camera:", err);
          if (isMounted) {
            setError("Could not access camera. Please ensure you have granted camera permissions.");
          }
        }
      };
      
      startCamera();
    }
    
    // Clean up function - only stop camera if component is unmounting or camera is deactivated
    return () => {
      console.log("Cleanup function called");
      isMounted = false;
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cameraActive, processFrame, isModelLoaded]);
  
  // Add model loading effect inside the component
  useEffect(() => {
    let isMounted = true;
    
    const loadModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!isMounted) return;
        
        // Create hand landmarker with proper error handling
        const handLandmarkerInstance = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: maxHands,
            minHandDetectionConfidence: detectionConfidence,
            minHandPresenceConfidence: trackingConfidence,
            minTrackingConfidence: trackingConfidence
          }
        );
        
        if (!isMounted) return;
        
        // Create gesture recognizer with improved settings
        const gestureRecognizerInstance = await GestureRecognizer.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "/gesture_recognizer_model.tflite",
              delegate: "GPU" // Use GPU for better performance
            },
            runningMode: "VIDEO",
            numHands: maxHands,
            minHandDetectionConfidence: detectionConfidence * 0.9, // Slightly lower threshold
            minHandPresenceConfidence: trackingConfidence * 0.9, // Slightly lower threshold
            minTrackingConfidence: trackingConfidence * 0.9 // Slightly lower threshold
          }
        );
        
        if (!isMounted) return;
        
        setHandLandmarker(handLandmarkerInstance);
        setGestureRecognizer(gestureRecognizerInstance);
        setIsModelLoaded(true);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
        if (isMounted) {
          setError(`Error loading models: ${error.message}`);
        }
      }
    };
    
    loadModels();
    
    return () => {
      isMounted = false;
    };
  }, [maxHands, detectionConfidence, trackingConfidence]);
  
  return (
    <div className="combined-detector">
      <h3>Combined Hand Detection & Gesture Control</h3>
      {error && <div className="error-message">{error}</div>}
      <div style={{ position: 'relative', width: '320px', height: '240px' }}>
        <video 
          ref={videoRef} 
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.2, // Increased from 0.1 for better visibility
            display: 'none' // Hide the video element to prevent double rendering
          }}
          width="320" 
          height="240"
          playsInline
          muted
          autoPlay
        />
        <canvas 
          ref={canvasRef} 
          width="320" 
          height="240"
          style={{ 
            border: '1px solid #ccc',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)' // Add background color to canvas
          }}
        />
      </div>
      
      {/* Status indicator */}
      <div style={{ marginTop: '10px', padding: '5px', background: 'rgba(25, 30, 45, 0.7)', borderRadius: '5px' }}>
        <p>Camera: {cameraActive ? '✅ Active' : '❌ Inactive'}</p>
        <p>Models: {isModelLoaded ? '✅ Loaded' : '❌ Not loaded'}</p>
        <p>Last Gesture: {lastGesture}</p>
      </div>
      
      <div className="gesture-guide">
        <h4>Gesture Controls:</h4>
        <ul>
          <li><span className="emoji">👊</span> <strong>Closed Fist</strong> - Play/Pause</li>
          <li><span className="emoji">🖐️</span> <strong>Open Hand</strong> - Play/Pause</li>
          <li><span className="emoji">👍</span> <strong>Thumb Up</strong> - Increase Volume</li>
          <li><span className="emoji">👎</span> <strong>Thumb Down</strong> - Decrease Volume</li>
          <li><span className="emoji">✌️</span> <strong>Victory/Peace</strong> - Next Track</li>
          <li><span className="emoji">🤟</span> <strong>I Love You</strong> - Previous Track</li>
          <li><span className="emoji">👈</span> <strong>Swipe Right</strong> - Previous Track</li>
          <li><span className="emoji">👉</span> <strong>Swipe Left</strong> - Next Track</li>
        </ul>
      </div>
      <div className="detection-status">
        <h4>Detection Status:</h4>
        {handLandmarks.length > 0 ? (
          <p className="status-active">✅ Hand detected with {handLandmarks[0].length} landmarks</p>
        ) : (
          <p className="status-inactive">❌ No hand detected</p>
        )}
        <p>FPS: {fps}</p>
      </div>
    </div>
  );
}

export default CombinedDetector;