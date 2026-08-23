// custom audio player component

import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  src: string;
  onPlayingEnded: () => void;
  onPreviousClicked: () => void;
  onNextClicked: () => void;
}

export default function AudioPlayer({ src, onPlayingEnded, onPreviousClicked, onNextClicked }: AudioPlayerProps) {

  const audioRef = useRef<HTMLMediaElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // keep track of whether the user pressed play which means we can autoplay
  const [userPlayRequested, setUserPlayRequested] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [contextCreated, setContextCreated] = useState<boolean>(false);

  let audioContext : AudioContext | null = null;
  let analyserNode : AnalyserNode | null = null;  
  let sourceNode: MediaElementAudioSourceNode | null = null;

  const playAudio = () => {

    console.log('playing audio. ', audioRef.current);

    if (contextCreated === false) {

      audioContext = new AudioContext();

      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 64;

      if (audioRef.current !== null) {
	sourceNode = audioContext.createMediaElementSource(audioRef.current);
      }

      // Connect the pipeline: Source -> Analyser -> Speakers (destination)
      sourceNode && sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      setContextCreated(true); // do this once

      console.log('created analyser');
    } else {
      console.log('analyser already created, skipping');
    }

    //    audioContext.resume();
    audioRef.current && audioRef.current.load();
    audioRef.current && audioRef.current.play().catch((err) => {
      console.log("Playback interrupted or blocked by browser when src changed:", err);
      console.log('load and start play failed');
      return;
    });
  };

  const animate = () => {

    if (!audioContext || !analyserNode) {
      console.log("audioContext or analyserNode missing. can't draw the visualizer frame");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("canvasRef.current is null, can't draw visualizer frame");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log("canvas context is null, can't draw visualizer");
    }

    // Set internal canvas dimensions to match its display size
    //    canvas.width = canvas.clientWidth;
    //    canvas.height = canvas.clientHeight;


    const bufferLength = analyserNode.frequencyBinCount; // Equal to half of fftSize
    const dataArray = new Uint8Array(bufferLength);    

    const scopeBufferLength = 64;
    const scopeDataArray = new Uint8Array(scopeBufferLength);    

    // 1. Clear the canvas for the new frame
    if (ctx) {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Fetch the latest audio data
      analyserNode.getByteFrequencyData(dataArray);

      // 3. Calculate how wide each bar should be based on screen size
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      // 4. Loop through the audio data array and draw each bar
      for (let i = 0; i < bufferLength; i++) {
	// Value is 0-255. Normalize it to fit the canvas height.
	const percent = dataArray[i] / 255;
	barHeight = canvas.height * percent;

	// Optional: Make bars change color based on their height/intensity
	const r = barHeight + (25 * (i / bufferLength));
	const g = 250 * (i / bufferLength);
	const b = 50;
	ctx.fillStyle = `rgb(${r},${g},${b})`;

	// Draw the bar (x-coordinate, y-coordinate, width, height)
	// Subtracting from canvas.height makes the bars grow from the bottom up
	ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
	
	// Move to the next bar's starting position
	x += barWidth;
      }
    }

    analyserNode.getByteTimeDomainData(scopeDataArray);

    if (ctx) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00ff88";
      ctx.beginPath();
    }

    const sliceWidth = canvas.width / scopeBufferLength;
    let x = 0;

    for (let i = 0; i < scopeBufferLength; i++) {

      const x = (i / (bufferLength - 1)) * canvas.width;
      // Convert 0–255 into a vertical canvas position
      const y = (scopeDataArray[i] / 255) * canvas.height;

      if (i === 0) {
	ctx && ctx.moveTo(x, y);
      } else {
	ctx && ctx.lineTo(x, y);
      }

    }

    ctx && ctx.stroke();    

    requestAnimationFrame(animate);
  };

  // update state when audio file metadata loads
  const metadataLoaded = () => {

    if (!audioRef.current) return;

    setDuration(audioRef.current.duration);
    
  };

  const currentTimeChanged = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const currentTimeSliderChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const playingEnded = () => {
    console.log('audio element finished playing, calling onPlayEnded');
    onPlayingEnded();
  };

  const playClicked = () => {
    
    setUserPlayRequested(true);

    if (audioRef.current) {
      audioRef.current.load();
      //      audioRef.current.play();
      playAudio();
    }
      
    animate(); // start the visualizer
    
    console.log('play clicked, playing and visualizing');
  };

  const pauseClicked = () => {

    setUserPlayRequested(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    console.log('pause clicked');
  };

  const previousClicked = () => {
    console.log('previous clicked');
    onPreviousClicked();
  };

  const nextClicked = () => {
    console.log('next clicked');
    onNextClicked();
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
      
	/*	audioRef.current.play().catch((err) => {
          console.log("Playback interrupted or blocked by browser when src changed:", err);
	  console.log('load and start play failed');
	  return;
	  }); */
	playAudio();
	
      } else {
	console.log("user didn't request playback, skipping");
      }

      console.log('load audio src succeeded');
    } 
  }, [src]); // Triggers every time this state changes 

  return (

    <>

      <div style={{ marginTop: '12px' }}>
	
	  <audio ref={audioRef} onEnded={playingEnded}
	    onLoadedMetadata={metadataLoaded}
            onTimeUpdate={currentTimeChanged}
            style={{ width: '100%' }}
	  >
             Your browser does not support the audio element.
	  </audio>
	</div>

      <div>
	<button onClick={playClicked}>Play</button>
	<button onClick={pauseClicked}>Pause</button>
	<button onClick={previousClicked}>Previous</button>
	<button onClick={nextClicked}>Next</button>		
      </div>

      {/* Custom Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{formatTime(currentTime)}</span>
        
        <input
          type="range"
          min="0"
          max={duration || 100} 
          value={currentTime}
          onChange={currentTimeSliderChanged}
          style={{ flexGrow: 1 }}
        />
        
        <span>{formatTime(duration)}</span>
      </div>

      <canvas ref={canvasRef} id="visualizer"></canvas>
    </>
  );
}
