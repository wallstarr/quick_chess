/**
 * Push to Mongo and Manage Database
 * This module handles saving game data to MongoDB and managing the database size.
 */

const { MongoClient } = require("mongodb");
const { DATABASE } = require('../aliases');

// Maximum number of elements in the database
const MAX_ELEMENT_LIMIT = 1000;

/**
 * Push game data to MongoDB and manage the database size.
 * @param {Object} gameRoom - The game room object.
 * @param {Object} Game - The mongoose game model.
 * @param {Object} io - TODO: put description here
 */
async function pushToMongoAndManageDB(gameRoom, Game, io) {
  const gameHistory = gameRoom.game.getGameHistory();

  if (gameHistory.length < 2) { // push to mongo only if both players have made at least one move
    console.log('Not enough moves to save the game -- aborting save to database.');
    return;
  }

  const newGame = new Game({
    history: gameHistory,
    playerOneData: gameRoom.players[0],
    playerTwoData: gameRoom.players[1],
    date: new Date(),
    result: gameRoom.winner
  });

  console.log("Attempting to save game to database:")

  newGame.save()
    .then(() => console.log('-- Game successfully saved to database'))
    .catch(error => console.log(error));

  let gameCount = await Game.countDocuments();
  if (gameCount > MAX_ELEMENT_LIMIT) {
    console.log("Deleting oldest game from MongoDB, as the database is full:")
    const oldestGame = await Game.findOne().sort({ date: 1 });
    if (oldestGame) {
      Game.findByIdAndRemove(oldestGame._id)
        .then(() => console.log('-- Oldest game successfully deleted'))
        .catch(error => console.log(error));
    }
  }

  io.to(gameRoom.roomNumber.toString()).emit(DATABASE.GAME_LINK, newGame._id.toString());
}

module.exports = { pushToMongoAndManageDB }
