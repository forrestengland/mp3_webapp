import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  src: string;
  isPlaying: boolean;
  onPlayStateChanged: (playState: boolean) => void;
}

export default function AudioPlayer({ src, isPlaying, onPlayStateChanged }: AudioPlayerProps) {

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // keep track of whether the user pressed play which means we can autoplay
  const [userPlayRequested, setUserPlayRequested] = useState<boolean>(false);

  // const audioCtx = new AudioContext();

  const playingEnded = () => {
    onPlayStateChanged(false);
  };

  const playClicked = () => {
    
    setUserPlayRequested(true);
    audioRef.current.load(); // Forces the player to load the new track
    audioRef.current.play();
    console.log('play clicked, playing');
  };

  const pauseClicked = () => {

    setUserPlayRequested(false);
    
    audioRef.current.pause();
    console.log('pause clicked');
  };

  // start playing when a new file is loaded
  // user has to start play manually?
  useEffect(() => {

    // do nothing if we don't have the audio ref yet
    if (!audioRef.current) return;
    
    console.log('src changed. prev: '+audioRef.current.src+' current: '+src);
    // do nothing if the src is the same. we could set it to the same thing and this will fire
    
    if (audioRef.current.src === src) {
      
      console.log('src is the same, return without setting');
      return;
      
    } else {

      console.log('new src set, attempting to load');

      audioRef.current.src = src;

      audioRef.current.load(); // Forces the player to load the new track

      // do nothing if the user didn't request playback
      if (userPlayRequested) {

	console.log("audio src change. user requested play");
      
	audioRef.current.play().catch((err) => {
          console.log("Playback interrupted or blocked by browser when src changed:", err);
	  // couldn't start playback - override play request
	  //	if (onPlayStateChanged) onPlayStateChanged(false);
	  console.log('load and start play failed');
	  return;
	});
      } else {
	console.log("user didn't request playback, skipping");
      }

      console.log('load audio src succeeded');
    } 
  }, [src]); // Triggers every time this state changes 

  // start playing when requested - if user clicks the first song when the page first loads, blocked otherwise
  // not used
  /*  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.load(); // Forces the player to load the new track
      // TODO - this is called when the page loads, we shouldn't start to play on load
      audioRef.current.play().catch((err) => {
        console.log("Playback interrupted or blocked by browser when isPlaying changed:", err);
	// couldn't start playback - override play request - doesn't work
	//	if (onPlayStateChanged) onPlayStateChanged(false);
      });
    } 
    }, [isPlaying]); // Triggers every time this state changes  */

  return (

    <>

	<div style={{ marginTop: '12px' }}>
	  <audio ref={audioRef} onEnded={playingEnded}
            controls 
            style={{ width: '100%' }}
	  >
             Your browser does not support the audio element.
	  </audio>
	</div>

      <div>
	<button onClick={playClicked}>Play</button>
	<button onClick={pauseClicked}>Pause</button>	
      </div>
    </>
  );
}
