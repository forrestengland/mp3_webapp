import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'

import FileDrop from './FileDrop';

interface SongUploadFormProps {
  onUploadSuccess: () => void;
  isAuthenticated: boolean;
}

export default function SongUploadForm({ onUploadSuccess, isAuthenticated }: SongUploadFormProps) {

    const [songName, setSongName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const navigate = useNavigate();

  // make sure user is logged in or redirect
  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, []);


  // const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      console.log('got dropped files: ', files);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage('Please select an audio file to upload.');
      return;
    }

    // Wrap everything into FormData for proper binary boundary streams
    const formData = new FormData();
    formData.append('songFile', file);
    formData.append('songName', songName);
    formData.append('description', description);

    try {
      setStatusMessage('Uploading...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // Notice: Do not set Content-Type header manually here!
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage('Success! Song uploaded and saved.');
        // Clear out the input values
        setSongName('');
        setDescription('');
          setFile(null);

	  onUploadSuccess();
      } else {
        setStatusMessage(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('An error occurred while connecting to the server.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Upload New Song</h2>
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

	{/*        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block' }}>Audio File (.mp3, .wav):</label>
          <input type="file" accept="audio/*" onChange={handleFileChange} required />
          </div> */}

	<FileDrop onFilesChanged={handleFileChange} />

        <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
	  Upload
        </button>
      </form>

      {statusMessage && <p style={{ marginTop: '12px', fontWeight: 'bold' }}>{statusMessage}</p>}
    </div>
  );
}
