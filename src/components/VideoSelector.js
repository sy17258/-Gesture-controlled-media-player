import React, { useState } from 'react';

function VideoSelector({ setVideos }) {
  const [selectedCount, setSelectedCount] = useState(0);

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files
      .filter(file => file.type.match(/video\/*/));
    
    setVideos([...videoFiles]);
    setSelectedCount(videoFiles.length);
  };

  return (
    <div className="video-selector">
      <label className="file-input-label">
        <input
          type="file"
          webkitdirectory
          directory
          multiple
          accept="video/*"
          onChange={handleFolderSelect}
          style={{ display: 'none' }}
        />
        <span className="select-button">Select Video Folder</span>
      </label>
      {selectedCount > 0 && (
        <p className="selected-count">{selectedCount} video(s) loaded and ready to play</p>
      )}
    </div>
  );
}

export default VideoSelector;