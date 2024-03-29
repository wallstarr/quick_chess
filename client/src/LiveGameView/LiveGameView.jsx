import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { color } from '../constants';
import ChessboardPanel from './ChessboardPanel.jsx'
import SidePanel from './SidePanel.jsx'
import { io } from 'socket.io-client';
import { DATABASE, EVENTS } from "../socket/aliases"
import { useNavigate } from 'react-router-dom';
import GameOverModal from './GameOverModal.jsx';

const LiveGameView = () => {
  const [isLoading, setIsLoading] = useState(true);

  // User related data
  const [timeForWhite, setTimeForWhite] = useState(300);
  const [timeForBlack, setTimeForBlack] = useState(300);
  const [usernameForWhite, setUserNameWhite] = useState("waiting..."); // TODO: make the ... a spinner
  const [usernameForBlack, setUserNameBlack] = useState("waiting...");
  const [orientation, setOrientation] = useState(color.WHITE);
  const [gameReviewId, setGameReviewId] = useState("")

  // Chess logic related data
  const [chess] = useState(new Chess()); // create a new chess.js instance
  const [fen, setFen] = useState(chess.fen()); // use FEN for board position
  const [moveHistory, setMoveHistory] = useState([]);

  // Game Over Modal
  const [isGameOverModalOpen, setGameOverModalOpen] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState({ primary: "", secondary: "" });

  // UI Related data
  const [boardHeight, setBoardHeight] = useState(0);
  const chessboardRef = useRef(null);
  const navigate = useNavigate();

  // Socket related data
  const socketRef = useRef();

  // Resign functionality
  const onResign = () => {
    console.log("Resigned")
  }

  // Offer draw functionality
  const onOfferDraw = () => {
    console.log("Offered draw")
  }

  useEffect(() => {
    if (chessboardRef.current) {
      setBoardHeight(chessboardRef.current.clientHeight);

      const resizeObserver = new ResizeObserver(() => {
        setBoardHeight(chessboardRef.current.clientHeight);
      });

      resizeObserver.observe(chessboardRef.current);

      // Cleanup function for the effect
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [chessboardRef]);


  useEffect(() => {
    connectToServerSocket();

    return () => {
      socketRef.current && socketRef.current.disconnect();
    };
  }, []);

  const connectToServerSocket = () => {
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001');

    socketRef.current.on('connect', () => {
      const roomNumber = window.location.pathname.split('/')[2];
      const username = `Anon${Math.floor(Math.random() * 999999)}`;
      socketRef.current.emit(EVENTS.JOIN_ROOM, roomNumber, username);
    });

    socketRef.current.on(EVENTS.USER_LIST_UPDATE, (userList) => {
      // Assuming the server sends an array of players, and each player has an `username` and `color` property
      userList.players.forEach(player => {
        if (player.color === color.WHITE) {
          setUserNameWhite(player.username);
        } else if (player.color === color.BLACK) {
          setUserNameBlack(player.username);
        }
      });
    });

    socketRef.current.on(EVENTS.FIRST_PLAYER_JOINED, (gameInfo) => {
      let playerInfo = gameInfo.players[0]

      if (playerInfo.color === color.WHITE) {
        setOrientation(color.WHITE);
        setUserNameWhite(playerInfo.username);
      } else {
        setOrientation(color.BLACK);
        setUserNameBlack(playerInfo.username);
      }

      setTimeForWhite(gameInfo.timeControl);
      setTimeForBlack(gameInfo.timeControl);
    });

    socketRef.current.on(EVENTS.START_GAME, (gameInfo) => {
      let whiteInfo = gameInfo.players[0].color === color.WHITE ? gameInfo.players[0] : gameInfo.players[1];
      let blackInfo = gameInfo.players[0].color === color.BLACK ? gameInfo.players[0] : gameInfo.players[1];

      if (whiteInfo.id === socketRef.current.id) {
        setOrientation(color.WHITE);
      } else {
        setOrientation(color.BLACK);
      }

      setTimeForWhite(gameInfo.timeControl);
      setTimeForBlack(gameInfo.timeControl);

      setUserNameWhite(whiteInfo.username);
      setUserNameBlack(blackInfo.username);
    });

    socketRef.current.on(EVENTS.TIME_UPDATES, (timeUpdate) => {
      setTimeForWhite(timeUpdate[color.WHITE].time);
      setTimeForBlack(timeUpdate[color.BLACK].time);
    });

    socketRef.current.on(EVENTS.MOVE_MADE, (sourceSquare, targetSquare, currentPlayerID, currentFen, history) => {
      if (socketRef.current.id !== currentPlayerID) {
        chess.move({
          from: sourceSquare,
          to: targetSquare
        });
        setFen(currentFen);
        setMoveHistory(history);
      }
    });

    socketRef.current.on(EVENTS.GAME_OVER_DRAW, (username, color) => {
      // TODO
    });

    socketRef.current.on(EVENTS.TIMEOUT, (username, color) => {
      // TODO
    });

    socketRef.current.on(EVENTS.CHECKMATE, (winnerUsername, winnerColor) => {
      console.log(winnerUsername)
      console.log(winnerColor)
      setGameOverMessage({
        primary: `${winnerUsername} (${winnerColor}) wins`,
        secondary: "by checkmate!"
      })
      setGameOverModalOpen(true);
    });

    socketRef.current.on(EVENTS.RESIGNATION, (username, color) => {
      // TODO
    });


    /**
     * TODO: Handle the following events:
     * Necessary Events:
     * - EVENTS.TIMEOUT
     *  - For this one:
     *    - We will want to know which player timed out
     *    - In general for all game over events, we will need a pop up that says who won and how
     * - EVENTS.CHECKMATE
     * - EVENTS.RESIGNATION
     * - EVENTS.GAME_OVER_DRAW
     * - EVENTS.DRAW_OFFERED
     * - EVENTS.DRAW_ACCEPTED
     * - EVENTS.DRAW_DECLINED
     * 
     * 
     * Dubious Events (either get rid of or change -- server side errors are a bit rough to handle on the client):
     * - ERROR
     * - ERROR_MOVING
     * - GAME_CURRENT_FEN
     */

    socketRef.current.on(EVENTS.ROOM_FULL, (room) => {
      alert(`Room ${room} is full!`);
      // TODO: Let them spectate
    });

    socketRef.current.on(EVENTS.ROOM_NOT_EXIST, () => {
      alert('This room does not exist.');
      navigate("/home")
    });

    socketRef.current.on(DATABASE.GAME_LINK, (gameId) => {
      setGameReviewId(gameId)
    })

    socketRef.current.on()
    setIsLoading(false);
  };

  // if the move was successful, return true
  const movePieceFromSourceToTarget = ({ sourceSquare, targetSquare }) => {
    try {
      const roomNumber = window.location.pathname.split('/')[2];
      chess.move({
        from: sourceSquare,
        to: targetSquare
      });
      socketRef.current.emit(EVENTS.MOVE, roomNumber, sourceSquare, targetSquare);
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  const handleDrop = ({ sourceSquare, targetSquare }) => {
    if (movePieceFromSourceToTarget({ sourceSquare, targetSquare })) {
      setFen(chess.fen());
      setMoveHistory(chess.history());
    }
  };

  const navigateToGameReview = () => {
    navigate(`/gamehistory/${gameReviewId}`)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="flex flex-row bg-transparent items-center" ref={chessboardRef}>
        <ChessboardPanel
          timeForWhite={timeForWhite}
          timeForBlack={timeForBlack}
          usernameForWhite={usernameForWhite}
          usernameForBlack={usernameForBlack}
          orientation={orientation}
          fen={fen}
          handleDrop={handleDrop}
        />
        <SidePanel
          moves={moveHistory}
          height={boardHeight}
          onResign={onResign}
          onOfferDraw={onOfferDraw}
        />
      </div>
      {isLoading && <div className="text-white mt-4">Loading...</div>}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        onClose={() => setGameOverModalOpen(false)}
        directToGameReview={navigateToGameReview}
        primaryMessage={gameOverMessage.primary}
        secondaryMessage={gameOverMessage.secondary}
        gameReviewId={gameReviewId}
      />
    </div>
  );
};

export default LiveGameView;
