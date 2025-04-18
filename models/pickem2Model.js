const mongoose = require('mongoose');

const pickem2Schema = new mongoose.Schema({
  league: {
    type: String,
    // required: [true, 'a pick must have a league'],
  },
  odds: {
    type: Number,
    // required: [true, 'a pick must have odds'],
  },
  pickType: {
    type: String,
    // required: [true, 'a pick must have a pick type'],
  },
  selectedGameId: {
    type: String,
    // required: [true, 'a pick must have a GameId'],
  },
  teamPicked: {
    type: String,
    select: false,
    // required: [true, 'a pick must have a team'],
  },
  spreadLine: {
    type: Number,
    select: false,
    // required: [true, 'a pick must have a prop line'],
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

const Pickem2 = new mongoose.model('Pickem2', pickem2Schema);
module.exports = Pickem2;
