import React, { useState, ChangeEvent, FormEvent } from 'react';

interface LogoutProps {
    onLogoutSuccess: () => void;
}

export default function Logout({ onLogoutSuccess }: LogoutFormProps) {

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loggedOut, setLoggedOut] = useState<bool>(false);

  const logoutClicked = async (event: React.MouseEvent<HTMLButtonElement>) => {

    try {

      setStatusMessage('Logging out...');
      const response = await fetch('/api/logout', {
	method: 'POST',
      });

      const data = await response.json();

      if (data.success) {

	setStatusMessage('Success! You are now logged out');
	  
	onLogoutSuccess();
	setLoggedOut(true);
	  
      } else {
	  
	setStatusMessage('Something went wrong logging you out');
	  
      }
	
    } catch (error) {
      console.error(error);
      setStatusMessage('An error occurred while logging out');
    }
  };
    
  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Log Out</h2>

      {statusMessage && <p style={{ marginTop: '12px', fontWeight: 'bold' }}>{statusMessage}</p>}
      {!loggedOut && <button onClick={logoutClicked}>Log Out</button>}
    </div>
  );

}
