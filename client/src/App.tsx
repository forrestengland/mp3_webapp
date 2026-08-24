import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

import './App.css';
import SongUploadForm from './SongUploadForm';
import SongEditForm from './SongEditForm';
import SongList from './SongList';
import LoginForm from './LoginForm';
import Logout from './Logout';
import Navigation from './Navigation';

interface ApiResponse {
    message: string;
}

function App() {
    
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const triggerRefresh = () => {
	setRefreshTrigger(prev => !prev);
    };

    const onLogin = () => {
	setIsAuthenticated(true);
    }

    const onLogout = () => {
	setIsAuthenticated(false);
    }

  // do something after page is rendered
  useEffect(() => {
    
    fetch('/api/data')
      .then((res) => res.json())
      .then((data: ApiResponse) => {
	setData(data);
	setLoading(false);
      }).catch((err) => {
	console.error('Error fetching data:', err);
	setLoading(false);
      });
    
  }, []);

    if (loading) return <p>Loading data from backend...</p>;

    return (
      <BrowserRouter>

	<Navigation isAuthenticated={isAuthenticated} />

	    <Routes>
	      <Route path="/" element={<SongList refreshTrigger={refreshTrigger} isAuthenticated={isAuthenticated} />} />
	      <Route path="/edit/:id" element={<SongEditForm isAuthenticated={isAuthenticated} />} />	      
	      <Route path="/login" element={<LoginForm onLoginSuccess={onLogin}/>} />
	      <Route path="/logout" element={<Logout onLogoutSuccess={onLogout}/>} />	    
	      <Route path="/upload" element={<SongUploadForm onUploadSuccess={triggerRefresh} isAuthenticated={isAuthenticated}/>} />
	    </Routes>
	
	    </BrowserRouter>
    );
}

export default App
