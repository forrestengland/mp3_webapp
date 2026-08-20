import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  src: string;
  isPlaying: boolean;
  onPlayStateChanged: (playState: boolean) => void;
}

export default function AudioPlayer({ src, isPlaying, onPlayStateChanged }: AudioPlayerProps) {

  const audioRef = useRef<HTMLAudioElement | null>(null);

  //  const audioCtx = new AudioContext();

  const playingEnded = () => {
    onPlayStateChanged(false);
  };

  // start playing when a new file is loaded - works
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load(); // Forces the player to load the new track
      audioRef.current.play().catch((err) => {
        console.log("Playback interrupted or blocked by browser:", err);
      });
    } 
  }, [src]); // Triggers every time this state changes 

  // start playing when requested - only works first time, blocked after user presses pause
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.load(); // Forces the player to load the new track
      audioRef.current.play().catch((err) => {
        console.log("Playback interrupted or blocked by browser:", err);
      });
    } 
  }, [isPlaying]); // Triggers every time this state changes 

  return (

    <>

	<div style={{ marginTop: '12px' }}>
	  <audio ref={audioRef} onEnded={playingEnded}
            controls 
            src={src} 
            style={{ width: '100%' }}
	  >
             Your browser does not support the audio element.
	  </audio>
	</div>

    
    </>
  );
}
