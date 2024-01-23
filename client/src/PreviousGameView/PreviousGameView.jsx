import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LOCALHOST_SERVER } from '../constants'

const PreviousGameView = () => {
    const { gameId } = useParams(); 
    const [gameData, setGameData] = useState(null);

    useEffect(() => {
        const fetchGameData = async () => {
            let backendURL = process.env.REACT_APP_BACKEND_URL || LOCALHOST_SERVER
            try {
                const response = await axios.get(`${backendURL}/gamehistory/${gameId}`);
                setGameData(response.data);
            } catch (error) {
                console.error('Error fetching game data:', error);
            }
        };
        fetchGameData();
    }, [gameId]);

    if (!gameData) {
        return <div>loading some stuff</div>;
    }

    return (
        <div className='bg-gray-900'>
            <h1>Previous Game Vieww</h1>
            <pre>{JSON.stringify(gameData, null, 2)}</pre>
        </div>
    );
};

export default PreviousGameView;
