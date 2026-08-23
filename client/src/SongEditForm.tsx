import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface SongEditFormProps {
  isAuthenticated: boolean;
}

export default function SongEditForm({ isAuthenticated }: SongEditFormProps) {

  const [songName, setSongName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  //  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const { id: songId } = useParams<{ id: string }>();

  const navigate = useNavigate();

  /*  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
    }; */

  const handleSubmit = async (e: FormEvent) => {

    e.preventDefault();

    console.log('edit submit clicked');

    updateSongInfo();

  };

  // Fetch song info from Express API
  const fetchSongInfo = async () => {
    try {
      const response = await fetch(`/api/song/${songId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch song info from server');
      }
      const data = await response.json();
      setSongName(data.song_name);
      setDescription(data.description);
    } catch (err: any) {
      setStatusMessage(err.message || 'An error occurred.');
    }    
  };

  const updateSongInfo = async () => {

    try {
      
      const response = await fetch(`/api/update`, {
	method: 'POST',
	headers: {
	  'Content-Type': 'application/json'
	},
	body: JSON.stringify({	id: songId,
	  song_name: songName,
	  description: description
	})
      });
      
      if (!response.ok) {
        throw new Error('Failed to update song info on the server');
      }

      const recData = await response.json();      
      
      if (response.ok) {
	setStatusMessage(recData.message);
      } else {
	setStatusMessage('Something went wrong updating');
      }
      
    } catch (err: any) {
      setStatusMessage(err.message || 'An error occurred.');
    }        
  };
  
  useEffect(() => {
    
    // don't let us view this page if we're not logged in
    if (!isAuthenticated) {
      navigate('/');
    }

    // get the requested id to edit
    console.log('edit form got id to edit: '+songId);

    // get the song details to edit
    fetchSongInfo();
    
  }, []);

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Edit Song</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block' }}>Song Title:</label>
          <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} required style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block' }}>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
        </div>

        <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Submit
        </button>
      </form>

      {statusMessage && <p style={{ marginTop: '12px', fontWeight: 'bold' }}>{statusMessage}</p>}
    </div>
  );
}
