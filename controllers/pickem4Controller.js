const Pickem4 = require('../models/pickem4Model');
const factoryController = require('./factoryController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require('axios');

exports.getAllPicks = factoryController.getAll(Pickem4);

exports.getAllFilteredPicks = catchAsync(async (req, res, next) => {
  docs = await Pickem4.find();

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: docs,
  });
});

exports.getPick = factoryController.getOne(Pickem4);
exports.createPick = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return next(new AppError(400, 'Request has to be an array'));
  }

  const picks = req.body;

  const resultPicks = await Promise.all(
    picks.map(async (pick) => {
      return Pickem4.create(pick);
    })
  );

  res.status(200).json({
    status: 'success',
    results: resultPicks.length,
    data: resultPicks,
  });
});

exports.getUsersPicks = catchAsync(async (req, res, next) => {
  const username = req.body.username;
  const docs = await Pickem4.find({ participantsUsername: username });

  res.status(200).json({
    status: 'success',
    results: docs.length,
    docs,
  });
});

exports.getUsersUnfilteredPicks = catchAsync(async (req, res, next) => {
  const username = req.body.username;
  const docs = await Pickem4.find({
    participantsUsername: username,
  }).select(
    '+teamPicked +spreadLine +league +pickType +selectedGameId +email'
  );

  res.status(200).json({
    status: 'success',
    results: docs.length,
    docs,
  });
});

exports.betPredictionResolver = catchAsync(async (req, res) => {
  const pickem4Url = req.body.url; // Get the URL from the request body
  const oddsApiTemplate =
    'https://api.the-odds-api.com/v4/sports/{league}/scores/?apiKey=402f2e4bba957e5e98c7e1a178393c8c&daysFrom=3&dateFormat=iso';

  // Fetch picks from Sure Odds API
  const fetchPicks = async () => {
    try {
      return await axios.get(
        `${pickem4Url}/api/v1/pickem4/getPicksForPredicter`
      );
    } catch (error) {
      console.log(error);
    }
  };

  const response = await fetchPicks();

  const picks = response.data.data;

  const resolvedPicks = [];

  for (const [index, pick] of picks.entries()) {
    console.log('pickType: ' + pick.pickType);
    console.log('isSixHoursOld: ' + isSixHoursOld(pick.gameCommenceTime));
    console.log('betResults: ' + pick.betResult);

    if (
      pick.pickType === 'money line' &&
      isSixHoursOld(pick.gameCommenceTime) &&
      pick.betResult === null
    ) {
      const league = pick.league;
      const gameId = pick.selectedGameId;
      const pickedTeam = pick.teamPicked;

      // Fetch scores from Odds API for the correct league
      const scoresUrl = oddsApiTemplate.replace('{league}', league);
      const scoresResponse = await axios.get(scoresUrl);
      const scores = scoresResponse.data;

      const game = scores.find((g) => g.id === gameId);
      if (!game || !game.completed) {
        console.log(`Game ${gameId} is not completed. Skipping...`);
        continue; // Skip this iteration and move to the next pick
      }

      const winningTeam = getWinningTeam(scores, gameId);
      const result = winningTeam === pickedTeam ? 'won' : 'lost';
      console.log(
        'Pick for game ' +
          gameId +
          ' on ' +
          league +
          ': ' +
          pickedTeam +
          ' ' +
          result
      );

      const updateData = {
        betResult: result,
      };

      try {
        // Send PATCH request to update betResult
        const patchResponse = await Pickem4.findByIdAndUpdate(
          pick._id,
          updateData,
          { new: true }
        );
        const updatedPick = patchResponse;
        resolvedPicks.push(updatedPick);
        console.log('Updated pick: ' + JSON.stringify(updatedPick));
      } catch (error) {
        console.log('Error updating row: ' + error);
      }
    } else if (
      pick.pickType === 'spread' &&
      isSixHoursOld(pick.gameCommenceTime) &&
      pick.betResult === null
    ) {
      const league = pick.league;
      const gameId = pick.selectedGameId;
      const pickedTeam = pick.teamPicked;
      const spreadLine = pick.spreadLine; // Spread line for the pick
      const odds = pick.odds; // Odds (if needed for future logic)

      // Fetch scores from Odds API for the correct league
      const scoresUrl = oddsApiTemplate.replace('{league}', league);
      const scoresResponse = await axios.get(scoresUrl);
      const scores = scoresResponse.data;

      const game = scores.find((g) => g.id === gameId && g.completed);

      if (game) {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;
        const homeScore = game.scores.find(
          (score) => score.name === homeTeam
        ).score;
        const awayScore = game.scores.find(
          (score) => score.name === awayTeam
        ).score;

        let result;

        if (pickedTeam === homeTeam) {
          result =
            parseFloat(homeScore) + spreadLine > parseFloat(awayScore)
              ? 'won'
              : 'lost';
        } else if (pickedTeam === awayTeam) {
          result =
            parseFloat(awayScore) + spreadLine > parseFloat(homeScore)
              ? 'won'
              : 'lost';
        } else {
          result = 'invalid'; // Fallback case
        }

        console.log(
          `Pick for game ${gameId} on ${league}: ${pickedTeam} ${result}`
        );

        const updateData = { betResult: result };

        try {
          const patchResponse = await Pickem4.findByIdAndUpdate(
            pick._id,
            updateData,
            { new: true }
          );
          resolvedPicks.push(patchResponse);
          console.log('Updated pick: ' + JSON.stringify(patchResponse));
        } catch (error) {
          console.log('Error updating row: ' + error);
        }
      }
    }
  }

  res.status(200).json({
    status: 'success',
    data: resolvedPicks,
  });

  // Helper function to check if the date is six hours old
  function isSixHoursOld(dateString) {
    // const pickDate = new Date(dateString);
    // const sixHoursAgo = new Date();
    // sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    // return pickDate < sixHoursAgo; // Returns true if pickDate is more than 6 hours old
    return true;
  }

  // Helper function to get the winning team from the scores
  function getWinningTeam(scores, gameId) {
    for (let i = 0; i < scores.length; i++) {
      const game = scores[i];
      console.log('gameId: ' + gameId);
      console.log('game.completed: ' + game.completed);
      if (game.id === gameId && game.completed) {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;
        const homeScore = game.scores.find(
          (score) => score.name === homeTeam
        ).score;
        const awayScore = game.scores.find(
          (score) => score.name === awayTeam
        ).score;

        if (parseInt(homeScore) > parseInt(awayScore)) {
          return homeTeam;
        } else if (parseInt(homeScore) < parseInt(awayScore)) {
          return awayTeam;
        } else {
          return 'Draw';
        }
      }
    }
    return null;
  }
});
