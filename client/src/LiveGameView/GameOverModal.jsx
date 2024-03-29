import React, { useEffect, useState } from 'react';

const GameOverModal = ({ isOpen, onClose, directToGameReview, primaryMessage, secondaryMessage, gameReviewId }) => {
    const [gameReviewVisible, setGameReviewVisible] = useState(false);

    useEffect(() => {
        setGameReviewVisible(!!gameReviewId);
    }, [gameReviewId]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
            <div className="bg-stone-200 p-4 rounded shadow-lg relative">
                <button onClick={onClose} className="absolute top-2 right-2">
                    &times;
                </button>
                <div className="text-xl font-bold">{primaryMessage}</div>
                <div className="text-lg">{secondaryMessage}</div>
                {gameReviewVisible && <button onClick={directToGameReview} className="mt-4 px-4 py-2 bg-sky-700 text-white rounded">
                    Game Review
                </button>}
            </div>
        </div>
    );
};

export default GameOverModal;
