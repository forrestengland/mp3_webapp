import React, { useEffect, useState } from 'react';

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
}

export default function SongList({ refreshTrigger }: SongListProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    fetchSongs();
  }, [refreshTrigger]);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading tracks...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Available Tracks</h2>
        <button onClick={fetchSongs} style={{ padding: '6px 12px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {songs.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No songs uploaded yet.</p>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

	      {songs.map((song) => (
  <div key={song.id} style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', background: '#f9f9f9', marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <strong style={{ fontSize: '1.1em' }}>{song.song_name}</strong>
      <span style={{ color: '#666', fontSize: '0.9em' }}>⏱ {song.duration}</span>
    </div>
    
    {song.description && (
      <p style={{ margin: '8px 0', color: '#444', fontSize: '0.95em' }}>{song.description}</p>
    )}

    {/* AUDIO PLAYER COMPONENT SECTION */}
    <div style={{ marginTop: '12px' }}>
      <audio 
        controls 
        src={`/api/mp3/${song.filename}`} 
        style={{ width: '100%' }}
      >
        Your browser does not support the audio element.
      </audio>
    </div>

    <small style={{ display: 'block', marginTop: '8px', color: '#888', fontSize: '0.8em' }}>
      File: {song.filename}
    </small>
  </div>
))}
        </div>
      )}
    </div>
  );
}
