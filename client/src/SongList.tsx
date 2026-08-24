import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import AudioPlayer from './AudioPlayer'

// Define the TypeScript interface for our song object structure
interface Song {
  id: number;
  song_name: string;
  description: string;
  duration: string;
  filename: string;
  image: string;
}

interface SongListProps {
  refreshTrigger: boolean;
  isAuthenticated: boolean;
}

export default function SongList({ refreshTrigger, isAuthenticated }: SongListProps) {

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [playingIndex, setPlayingIndex] = useState<number>(0);
  const [bgImage, setBgImage] = useState<string>('');
  //  const audioRef = useRef<HTMLAudioElement | null>(null);

  const navigate = useNavigate();

  // Fetch songs from Express API
  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (!response.ok) {
        throw new Error('Failed to fetch songs from server');
      }
      const data = await response.json();
      setSongs(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const songClicked = (index: number) => {

    if (index == playingIndex) {
      // play the player
      //  audioRef.current && audioRef.current.play().catch(err => console.log('error playing: ', err));
      //      setIsPlaying(true);
    } else {
      setPlayingIndex(index);
      updateImage(index);
      //      if (audioRef.current) audioRef.current.src = '/api/mp3/'+songs[playingIndex].filename;
    }
    //    setIsPlaying(true);
  };

  const playingEnded = () => {
    if (!songs) return;
    // auto play next track
    console.log('playing ended, autoplaying next');
    if (playingIndex < songs.length - 1) {
      setPlayingIndex(playingIndex + 1);
      updateImage(playingIndex + 1);
    } else {
      console.log('no more songs to play, autoplay ended');
    }
  }; 

  // function to call when previous is clicked in the AudioPlayer component
  const previousClicked = () => {

    if (!songs) return;
    
    console.log('playing previous track');
    
    if (playingIndex >= 1) {      
      setPlayingIndex(playingIndex - 1);
      updateImage(playingIndex - 1);
    } else {
      console.log('no previous song to play');
    }
  }; 

  // function to call when next is clicked in the AudioPlayer component
  const nextClicked = () => {

    if (!songs) return;
    
    console.log('playing next track');
    
    if (playingIndex < songs.length - 1) {
      setPlayingIndex(playingIndex + 1);
      updateImage(playingIndex + 1);
    } else {
      console.log('no next song to play');
    }
  }; 

  const deleteClicked = async (id: number) => {
    try {
      const response = await fetch('/api/delete', {
	method: 'POST',
	headers: {
	  'Content-Type': 'application/json'
	},
	body: JSON.stringify({id: id})
      });
      if (!response.ok) {
        throw new Error('Failed to delete song from server');
      }
      const data = await response.json();
      fetchSongs();
    } catch (err: any) {
      setError(err.message || 'An error occurred deleting the song.');
    }    
  };

  const editClicked = (id: number) => {
    console.log(`edit clicked. id=${id}`);
    navigate(`/edit/${id}`);
  };

  const updateImage = (index: number) => {
    const song = songs[index];
    if (song) {
      const newBgImage = `data:image/png;base64,${song.image}`;
      setBgImage(newBgImage);
    }
  }

  useEffect(() => {
    fetchSongs();
  }, [refreshTrigger]);

  useEffect(() => {
    updateImage(0); // update slider track to the first track's waveform
  }, [songs]);

  /*  useEffect(() => {
    const song = songs[playingIndex];
    if (song) {
      const newBgImage = `data:image/png;base64,${song.image}`;
      setBgImage(newBgImage);
    }
    }, [playingIndex]); */

  if (loading) return <p style={{ textAlign: 'center' }}>Loading tracks...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;

  return (

    <>

      <div >	
	
	<div id="song-list" style={{ maxWidth: '600px', padding: '20px'}}>
	
	  <div style={{ display: 'block', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>

	    <div>
	      <h2>Audio Player</h2>
	    </div>


	    <div className="song" style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px' }}>
	        <div >
		  <AudioPlayer src={`${window.location.origin}/api/mp3/${songs[playingIndex].filename}`}
		    bgImage={bgImage} onPlayingEnded={playingEnded}
		    onPreviousClicked={previousClicked} onNextClicked={nextClicked}/>
		</div>
	    </div>

            <div>
	      <h2>Available Tracks</h2>
	    </div>

	  </div>


      {songs.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No songs uploaded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

	  {songs.map((song, index) => (	    

	    <div className={index === playingIndex ? "song song-playing" : "song"} onClick={() => {songClicked(index)}} key={song.id} style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px' }}>
	      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
		<strong style={{ fontSize: '1.1em' }}>{song.song_name}</strong>
		<span style={{ color: '#666', fontSize: '0.9em' }}>⏱ {song.duration}</span>
	      </div>
    
    {song.description && (
      <p style={{ margin: '4px 0', color: '#444', fontSize: '0.95em' }}>{song.description}</p>
    )}

	      <small style={{ display: 'block', marginTop: '8px', color: '#888', fontSize: '0.8em' }}>
													File: <a href={'/api/mp3/'+song.filename} download>{song.filename}</a>
	      </small>

	      {song.image && <img className="waveform" src={`data:image/png;base64,${song.image}`} />}

	      {isAuthenticated === true && <button onClick={() => {editClicked(song.id)}}>Edit</button>}	      
	      {isAuthenticated === true && <button onClick={() => {deleteClicked(song.id)}}>Delete</button>}

	    </div>
))}
        </div>
      )}
	</div>
	</div>
    </>
  );
}
