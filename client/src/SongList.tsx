import React, { useEffect, useState, useRef } from 'react';

import AudioPlayer from './AudioPlayer'

// Define the TypeScript interface for our song object structure
interface Song {
  id: number;
  song_name: string;
  description: string;
  duration: string;
  filename: string;
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
  //  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);  

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
      //      if (audioRef.current) audioRef.current.src = '/api/mp3/'+songs[playingIndex].filename;
    }
    setIsPlaying(true);
  };

  const playStateChanged = (state: boolean) => {
    if (state)  {
      setIsPlaying(true);
      return; // only play the next song if the play state changed to stopped
    }
    if (!songs) return;
    if (playingIndex < songs.length - 1) {
      setPlayingIndex(playingIndex + 1);
    } else {
      setIsPlaying(false);
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

  useEffect(() => {
    fetchSongs();
  }, [refreshTrigger]);

  // play whenever playingIndex changes
  /* useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load(); // Forces the player to load the new track
      audioRef.current.play().catch((err) => {
        console.log("Playback interrupted or blocked by browser:", err);
      });
    } 
    }, [playingIndex]); // Triggers every time this state changes */

  if (loading) return <p style={{ textAlign: 'center' }}>Loading tracks...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;

  return (

    <>

      <AudioPlayer src={`${window.location.origin}/api/mp3/${songs[playingIndex].filename}`} isPlaying={isPlaying} onPlayStateChange={playStateChanged}/>

    
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
	
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
      <p style={{ margin: '8px 0', color: '#444', fontSize: '0.95em' }}>{song.description}</p>
    )}

    <small style={{ display: 'block', marginTop: '8px', color: '#888', fontSize: '0.8em' }}>
      File: {song.filename}
    </small>

		{isAuthenticated === true && <button onClick={() => {deleteClicked(song.id)}}>Delete</button>}

  </div>
))}
        </div>
      )}
    </div>
    </>
  );
}
