import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import './App.css'
import SongUploadForm from './SongUploadForm'
import SongList from './SongList'

interface ApiResponse {
    message: string;
}

function App() {
    
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);

    const triggerRefresh = () => {
	setRefreshTrigger(prev => !prev);
    };

    useEffect(() => {
	fetch('/api/data')
	    .then((res) => res.json())
	    .then((data: ApiResponse) => {
		setData(data);
		setLoading(false);
	    }).catch((err) => {
		console.error('Error fetching data:', err);
		setLoading(false);
	    })
	
    }, []);

    if (loading) return <p>Loading data from backend...</p>;

    return (
	    <BrowserRouter>

	    <p>Backend says: {data?.message}</p>

	    <nav>
	    <Link to="/">Songs</Link>
	    <Link to="/upload">Upload</Link>
	    </nav>

	    <Routes>
	    <Route path="/" element={<SongList refreshTrigger={refreshTrigger} />} />
	    <Route path="/upload" element={<SongUploadForm onUploadSuccess={triggerRefresh}/>} />
	    </Routes>
	
	    </BrowserRouter>
    );
}

export default App
