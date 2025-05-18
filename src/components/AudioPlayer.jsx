import React, { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';

const AudioPlayer = () => {
  const { currentRoot } = useDataContext();
  
  // State
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const pausedTimeRef = useRef(0);
  
  // Check if audio file exists for the current root
  useEffect(() => {
    if (!currentRoot) {
      setAudioAvailable(false);
      return;
    }

    const checkAudioAvailability = async () => {
      try {
        const response = await fetch(`/assets/audio/${currentRoot}.mp3`, { method: 'HEAD' });
        setAudioAvailable(response.ok);
      } catch (error) {
        // Error handling without logging for performance
        setAudioAvailable(false);
      }
    };

    checkAudioAvailability();
    
    // Stop any playing audio when root changes
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [currentRoot]);

  // Handle playback speed change
  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value) || 1.0;
    setPlaybackSpeed(newSpeed);
    
    // Update playback rate if audio is already loaded
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Play audio
  const handlePlay = () => {
    if (!audioAvailable || !currentRoot) return;
    
    // If we already have an audio element, reset it
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Create a new audio element
    const audio = new Audio(`/assets/audio/${currentRoot}.mp3`);
    audio.playbackRate = playbackSpeed;
    
    // Set up event listeners
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setIsPaused(false);
    });
    
    audio.addEventListener('error', (e) => {
      // Error handling without logging for performance
      setIsPlaying(false);
      setIsPaused(false);
      setAudioAvailable(false);
    });
    
    // Start playback
    audio.play()
      .then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      })
      .catch(error => {
        // Error handling without logging for performance
        setAudioAvailable(false);
      });
    
    audioRef.current = audio;
  };

  // Pause audio
  const handlePause = () => {
    if (!isPlaying || !audioRef.current) return;
    
    audioRef.current.pause();
    pausedTimeRef.current = audioRef.current.currentTime;
    setIsPaused(true);
    setIsPlaying(false);
  };

  // Resume audio
  const handleResume = () => {
    if (!isPaused || !audioRef.current) return;
    
    audioRef.current.currentTime = pausedTimeRef.current;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      })
      .catch(error => {
        // Error handling without logging for performance
      });
  };

  // Stop audio
  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsPaused(false);
    pausedTimeRef.current = 0;
  };

  return (
    <div className="audio-player">
      <input 
        type="text" 
        className="speed-input" 
        value={playbackSpeed}
        onChange={handleSpeedChange} 
        title="سرعة التشغيل"
      />
      
      <button 
        onClick={handlePlay}
        disabled={!audioAvailable || isPlaying}
        className={!audioAvailable || isPlaying ? 'disabled' : ''}
      >
        تشغيل
      </button>
      
      <button 
        onClick={handlePause}
        disabled={!isPlaying}
        className={!isPlaying ? 'disabled' : ''}
      >
        إيقاف مؤقت
      </button>
      
      <button 
        onClick={handleResume}
        disabled={!isPaused}
        className={!isPaused ? 'disabled' : ''}
      >
        استئناف
      </button>
      
      <button 
        onClick={handleStop}
        disabled={!isPlaying && !isPaused}
        className={!isPlaying && !isPaused ? 'disabled' : ''}
      >
        إيقاف
      </button>
      
      {!audioAvailable && currentRoot && (
        <span className="audio-status">
          لا يوجد ملف صوتي للجذر "{currentRoot}"
        </span>
      )}
    </div>
  );
};

export default AudioPlayer;