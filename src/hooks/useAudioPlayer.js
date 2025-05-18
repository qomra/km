import { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';

export const useAudioPlayer = () => {
  const { currentRoot } = useDataContext();
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const audioRef = useRef(null);
  const pausedTimeRef = useRef(0);
  
  // Check if audio is available when the root changes
  useEffect(() => {
    if (!currentRoot) {
      setAudioAvailable(false);
      return;
    }
    
    const checkAudioAvailability = async () => {
      try {
        const response = await fetch(`/assets/audio/${currentRoot}.mp3`, { method: 'HEAD' });
        setAudioAvailable(response.ok);
        setError(null);
      } catch (err) {
        // Error handling without logging for performance
        setAudioAvailable(false);
        setError('Failed to check audio availability');
      }
    };
    
    checkAudioAvailability();
    
    // Clean up audio when root changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
    };
  }, [currentRoot]);
  
  // Play audio with specified speed
  const play = (speed = 1.0) => {
    if (!audioAvailable || !currentRoot) {
      setError('No audio available for this root');
      return;
    }
    
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    try {
      // Create new audio element
      const audio = new Audio(`/assets/audio/${currentRoot}.mp3`);
      audio.playbackRate = speed;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setIsPaused(false);
      });
      
      audio.addEventListener('error', (e) => {
        // Error handling without logging for performance
        setError('Failed to play audio');
        setIsPlaying(false);
        setIsPaused(false);
      });
      
      // Start playback
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
          setError(null);
        })
        .catch(err => {
          // Error handling without logging for performance
          setError('Failed to play audio: ' + err.message);
          setAudioAvailable(false);
        });
      
      audioRef.current = audio;
    } catch (err) {
      // Error handling without logging for performance
      setError('Failed to create audio player');
    }
  };
  
  // Pause audio
  const pause = () => {
    if (!isPlaying || !audioRef.current) return;
    
    try {
      audioRef.current.pause();
      pausedTimeRef.current = audioRef.current.currentTime;
      setIsPaused(true);
      setIsPlaying(false);
      setError(null);
    } catch (err) {
      // Error handling without logging for performance
      setError('Failed to pause audio');
    }
  };
  
  // Resume audio from paused position
  const resume = () => {
    if (!isPaused || !audioRef.current) return;
    
    try {
      audioRef.current.currentTime = pausedTimeRef.current;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
          setError(null);
        })
        .catch(err => {
          // Error handling without logging for performance
          setError('Failed to resume audio: ' + err.message);
        });
    } catch (err) {
      // Error handling without logging for performance
      setError('Failed to resume audio');
    }
  };
  
  // Stop audio completely
  const stop = () => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      pausedTimeRef.current = 0;
      setError(null);
    } catch (err) {
      // Error handling without logging for performance
      setError('Failed to stop audio');
    }
  };
  
  // Change playback speed
  const setPlaybackSpeed = (speed) => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.playbackRate = speed;
    } catch (err) {
      // Error handling without logging for performance
      setError('Failed to set playback speed');
    }
  };
  
  return {
    isPlaying,
    isPaused,
    audioAvailable,
    error,
    play,
    pause,
    resume,
    stop,
    setPlaybackSpeed
  };
};

export default useAudioPlayer;