
import React, { useRef, useEffect } from 'react';

function VideoPlayer({ video, isPlaying, volume }) {
  const videoRef = useRef(null);
  const lastVideoRef = useRef(null);
  const objectUrlRef = useRef(null);

  // Handle volume and play/pause controls
  useEffect(() => {
    if (videoRef.current) {
      // Ensure volume is within valid range (0-1)
      videoRef.current.volume = Math.min(Math.max(volume, 0), 1);
      
      // Reset the video source when video changes
      if (video) {
        const videoUrl = URL.createObjectURL(video);
        videoRef.current.src = videoUrl;
        
        // Clean up the URL object when component unmounts or video changes
        return () => {
          URL.revokeObjectURL(videoUrl);
        };
      }
      
      try {
        if (isPlaying && video) {
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
        } else {
          videoRef.current.pause();
        }
      } catch (error) {
        console.error("Video control error:", error);
      }
    }
  }, [isPlaying, volume, video]);

  // Handle video source changes separately to prevent conflicts with play/pause
  useEffect(() => {
    if (videoRef.current && video) {
      // Only update the source if the video has changed
      if (lastVideoRef.current !== video) {
        lastVideoRef.current = video;
        
        // Revoke previous object URL to prevent memory leaks
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        
        // Create a new object URL for the video
        const videoUrl = URL.createObjectURL(video);
        objectUrlRef.current = videoUrl;
        
        // Update the video source
        videoRef.current.src = videoUrl;
      }
    }
    
    // Clean up the object URL when component unmounts or video changes
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [video]);

  return (
    <div className="video-player">
      <video
        x-webkit-airplay="allow"
        type="video/mp4"
        ref={videoRef}
        controls={true}
        style={{ width: '100%', height: 'auto', boxShadow: '0 0 15px #00f2fe', borderRadius: '20px'}}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer;