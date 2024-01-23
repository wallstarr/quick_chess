/**
 * ChessApp Server
 * This file sets up the Node Endpoints, Express server, Socket.IO, and MongoDB connection for the ChessApp application.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const ChessGame = require('./game/game.js');
const socketHandlers = require('./socket/socketHandlers.js');
const mongoose = require('mongoose');
const { instrument } = require("@socket.io/admin-ui");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "https://admin.socket.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
const port = 5001;

app.use(cors());
app.use(express.json());

// List of game rooms stored in the server
let rooms = {};

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('// MongoDB Connection Established //'))
  .catch(error => console.log(error));

// Game Schema
const gameSchema = new mongoose.Schema({
  history: [{}],
  playerOneData: Object,
  playerTwoData: Object,
  date: Date,
  result: String, // "White", "Black", or "Draw"
});

const Game = mongoose.model("Games", gameSchema);

// Initialize socketHandlers
socketHandlers.init(io, rooms, gameSchema, Game);

// Create a new game room
app.post('/createGame', (req, res) => {
  const newUniqueRoomNumber = () => {
    const roomNumber = Math.floor(Math.random() * 1000000);
    if (rooms[roomNumber]) {
      return newUniqueRoomNumber();
    } else {
      return roomNumber;
    }
  };
  const roomNumber = newUniqueRoomNumber();

  let timeControl = parseInt(req.body.minutesPerSide); // Time control in minutes

  if (!isNaN(timeControl)) {
    timeControl *= 60; // to seconds
  }

  let timeIncrement = parseInt(req.body.incrementInSeconds); // time increment in seconds

  // default time controlis 5 minutes + 0 seconds if not specified 
  if (isNaN(timeControl)) {
    timeControl = 5 * 60; // to seconds
  }

  if (isNaN(timeIncrement)) {
    timeIncrement = 0;
  }

  // max time control is 1 hour, max increment is +3 minutes
  if (
    timeControl < 1 * 60 ||
    timeControl > 60 * 60 ||
    timeIncrement < 0 ||
    timeIncrement > 180
  ) {
    return res
      .status(400)
      .json({ error: "Invalid time control or time increment" });
  }

  rooms[roomNumber] = {
    game: new ChessGame(),
    players: [],
    spectators: [],
    timers: {},
    timeControl: timeControl,
    increment: timeIncrement,
    currentPlayer: null,
    drawOffer: null,
    roomNumber: roomNumber,
  };

  res.send({ roomNumber });
});

app.get('/gamehistory/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const game = await Game.findById(gameId);
    res.json(game);
  } catch (error) {
    console.log(error)
    res.status(500).send('Server error');
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Admin UI instrumentation
instrument(io, {
  auth: false,
  mode: "development",
});

module.exports = app;
