import { useEffect, useState } from 'react'

import './App.css'
import SongUploadForm from './SongUploadForm'
import SongList from './SongList'

interface ApiResponse {
    message: string;
}

function App() {
    
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

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
	    <>
	    <p>Backend says: {data?.message}</p>
	    <SongUploadForm />
	    <SongList />
	    </>
    );
}

export default App
