import React, { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LOCALHOST_SERVER } from '../constants';
import { Chess } from 'chess.js';

const PreviousGameView = () => {
    const { gameId } = useParams();
    const [gameData, setGameData] = useState(null);
    const [chessObject, setChessObject] = useState(new Chess());
    const [currentMove, setCurrentMove] = useState(0);
    const [orientation, setOrientation] = useState('white');

    useEffect(() => {
        const fetchGameData = async () => {
            let backendURL = process.env.REACT_APP_BACKEND_URL || LOCALHOST_SERVER;
            try {
                const response = await axios.get(`${backendURL}/gamehistory/${gameId}`);
                setGameData(response.data);
            } catch (error) {
                console.error('Error fetching game data:', error);
            }
        };
        fetchGameData();
    }, [gameId]);

    useEffect(() => {
        if (gameData && gameData.history) {
            replayMoves(gameData.history, currentMove);
        }
    }, [gameData, currentMove]);

    const replayMoves = (moves, upToMove) => {
        const newChessObject = new Chess();
        for (let i = 0; i < upToMove; i++) {
            newChessObject.move(moves[i]);
        }
        setChessObject(newChessObject);
    };

    const moveToStart = () => setCurrentMove(0);
    const moveToEnd = () => setCurrentMove(gameData?.history.length || 0);
    const stepBackward = () => setCurrentMove(current => Math.max(current - 1, 0));
    const stepForward = () => setCurrentMove(current => Math.min(current + 1, gameData?.history.length || 0));
    const flipBoard = () => setOrientation(ori => (ori === 'white' ? 'black' : 'white'));

    const getPlayerByUsername = (color) => {
        return color === 'White' ? gameData?.playerTwoData.username : gameData?.playerOneData.username;
    }

    const topPlayer = orientation === 'white' ? getPlayerByUsername('Black') : getPlayerByUsername('White');
    const bottomPlayer = orientation === 'white' ? getPlayerByUsername('White') : getPlayerByUsername('Black');

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (!gameData) {
        return <div>loading some stuff</div>;
    }

    return (
        <div className='flex flex-col items-center bg-gray-900 text-white p-4'>
            <h1 className='text-2xl font-bold mb-4'>Previous Game View</h1>
            <div className='text-lg mb-2'>{formatDate(gameData.date)}</div>
            <pre className='mb-4'>{JSON.stringify(gameData, null, 2)}</pre>

            <div className='mb-2'>{topPlayer}</div>
            <div className='pb-4'>
                <Chessboard
                    position={chessObject.fen()}
                    orientation={orientation}
                    width={400}
                />
            </div>
            <div className='mb-2'>{bottomPlayer}</div>

            <div className='flex gap-2 mb-4'>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={moveToStart}>&lt;&lt;</button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={stepBackward}>&lt;</button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={stepForward}>&gt;</button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={moveToEnd}>&gt;&gt;</button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={flipBoard}>⇄</button>
            </div>
        </div>
    );
};

export default PreviousGameView;
