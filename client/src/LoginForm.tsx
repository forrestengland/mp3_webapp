import React, { useState, ChangeEvent, FormEvent } from 'react';

interface LoginFormProps {
    onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {

  const [password, setPassword] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {

      e.preventDefault();

      //      const formData = new FormData();
      //      formData.append('password', password);

      try {

	setStatusMessage('Logging in...');
	const response = await fetch('/api/login', {
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json'
	  },
	  body: JSON.stringify({ password: password })
	});

	const data = await response.json();

	if (response.ok) {

	  setStatusMessage('Success! You are now logged in');
	  setPassword('');
	  
	  onLoginSuccess();
	}
	
      } catch (error) {
	console.error(error);
	setStatusMessage('An error occurred while logging in');
      }
    };
    
  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block' }}>Password:</label>
          <input type="password" onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} />
        </div>

        <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log In
        </button>
      </form>

      {statusMessage && <p style={{ marginTop: '12px', fontWeight: 'bold' }}>{statusMessage}</p>}
    </div>
  );

}
