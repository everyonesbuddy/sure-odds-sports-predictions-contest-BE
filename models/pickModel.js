const mongoose = require('mongoose');

const pickem1Schema = new mongoose.Schema({
  league: {
    type: String,
    // required: [true, 'a pick must have a league'],
  },
  market: {
    type: String,
    // required: [true, 'a pick must have a market'],
  },
  odds: {
    type: Number,
    // required: [true, 'a pick must have odds'],
  },
  pickType: {
    type: String,
    // required: [true, 'a pick must have a pick type'],
  },
  playerPicked: {
    type: String,
  },
  selectedGameId: {
    type: String,
    // required: [true, 'a pick must have a GameId'],
  },
  teamPicked: {
    type: String,
    // required: [true, 'a pick must have a team'],
  },
  propLine: {
    type: Number,
    // required: [true, 'a pick must have a prop line'],
  },
  propOverOrUnder: {
    type: String,
    // required: [true, 'a pick must have a prop over or under'],
  },
  participantsUsername: {
    type: String,
    // required: [true, 'a pick must have a perticipant username'],
  },
  postedTime: {
    type: Date,
    // required: [true, 'a pick must have a posted time'],
  },
  gameCommenceTime: {
    type: Date,
    // required: [true, 'a pick must have a game commence time'],
  },
  email: {
    type: String,
    // required: [true, 'a pick must have an email'],
  },
  betResult: {
    type: String,
    enum: [null, 'won', 'lost'],
    default: null,
  },
});

const Pickem1 = new mongoose.model('Pickem1', pickem1Schema);
module.exports = Pickem1;
