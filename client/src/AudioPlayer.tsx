import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  src: string;
  isPlaying: boolean;
  onPlayStateChanged: (playState: boolean) => void;
}

export default function AudioPlayer({ src, isPlaying, onPlayStateChanged }: AudioPlayerProps) {

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playingEnded = () => {
    onPlayStateChanged(false);
  };

  /*    useEffect(() => {
      if (audioRef.current) {
	// start playing if requested
	if (isPlaying) {
	  audioRef.current.load(); // Forces the player to load the new track
	  audioRef.current.play().catch((err) => {
            console.log("Playback interrupted or blocked by browser:", err);
	  });
	}
	}, [isPlaying]); // Triggers every time this state changes */

      useEffect(() => {
	if (audioRef.current) {
	  audioRef.current.load(); // Forces the player to load the new track
	  audioRef.current.play().catch((err) => {
            console.log("Playback interrupted or blocked by browser:", err);
	  });
	} 
      }, [src]); // Triggers every time this state changes 


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
