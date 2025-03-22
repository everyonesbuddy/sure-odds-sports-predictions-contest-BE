const Pickem1 = require('../models/pickModel');
const factoryController = require('./factoryController');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const axios = require('axios');

exports.getAllPicks = factoryController.getAll(Pickem1);
exports.getPick = factoryController.getOne(Pickem1);
exports.createPick = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return next(new AppError(400, 'Request has to be an array'));
  }

  const picks = req.body;

  const resultPicks = await Promise.all(
    picks.map(async (pick) => {
      return Pickem1.create(pick);
    })
  );

  res.status(200).json({
    status: 'success',
    results: resultPicks.length,
    data: resultPicks,
  });
});

exports.betPredictionResolver = catchAsync(async (req, res) => {
  const pickem1Url = req.body.url; // Get the URL from the request body
  const oddsApiTemplate =
    'https://api.the-odds-api.com/v4/sports/{league}/scores/?apiKey=402f2e4bba957e5e98c7e1a178393c8c&daysFrom=3&dateFormat=iso';
  const espnApiBaseUrl =
    'https://sports.core.api.espn.com/v3/sports/{sport}/{league}/athletes?limit=40000';
  const playerOverviewApiTemplate =
    'https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{playerId}/overview';

  // Fetch picks from Sure Odds API
  const fetchPicks = async () => {
    try {
      return await axios.get(`${pickem1Url}/api/v1/pickem1`);
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
        const patchResponse = await Pickem1.findByIdAndUpdate(
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
      pick.pickType === 'props' &&
      isSixHoursOld(pick.gameCommenceTime) &&
      pick.betResult === null
    ) {
      const league = pick.league;
      const playerPicked = pick.playerPicked;
      const market = pick.market;
      const propLine = parseFloat(pick.propLine);
      const propOverOrUnder = pick.propOverOrUnder;

      // Construct ESPN API URL based on league
      const leagueParts = league.split('_');
      let sport, leagueName;

      if (leagueParts[0] === 'americanfootball') {
        sport = 'football';
        leagueName = leagueParts[1]; // This would be "nfl"
      } else {
        sport = leagueParts[0];
        leagueName = leagueParts[1];
      }
      const espnApiUrl = espnApiBaseUrl
        .replace('{sport}', sport)
        .replace('{league}', leagueName);

      // Fetch player data from ESPN API
      const espnResponse = await axios.get(espnApiUrl);
      const playersData = espnResponse.data;

      // Find the player ID from ESPN API based on the player name
      const playerId = findPlayerId(playersData.items, playerPicked);

      if (playerId) {
        // Perform further actions with playerId (e.g., call another API)
        console.log('Player ID found: ' + playerId);

        // Construct the player overview API URL
        const playerOverviewApiUrl = playerOverviewApiTemplate
          .replace('{sport}', sport)
          .replace('{league}', leagueName)
          .replace('{playerId}', playerId);

        // Fetch player overview data from ESPN API
        const playerOverviewResponse = await axios.get(
          playerOverviewApiUrl
        );
        const playerOverviewData = playerOverviewResponse.data;

        console.log(
          'Player Overview Data: ' +
            JSON.stringify(playerOverviewData.gameLog.statistics)
        );

        // Extract the relevant statistics based on the market
        const marketStat = mapMarketToStat(market);
        const statisticsIndex = findStatisticsIndex(
          market,
          playerOverviewData.gameLog.statistics
        );
        const recentGameStats =
          playerOverviewData.gameLog.statistics[statisticsIndex].events[0];
        const recentGameStatsNames =
          playerOverviewData.gameLog.statistics[statisticsIndex].names;
        const playerStat = getPlayerStatForGame(
          recentGameStats,
          marketStat,
          recentGameStatsNames
        );

        console.log('recentGameStats: ' + JSON.stringify(recentGameStats));
        console.log(
          'recentGameStatsNames: ' + JSON.stringify(recentGameStatsNames)
        );
        console.log('marketStat: ' + marketStat);
        console.log('playerStat: ' + playerStat);
        console.log('index' + recentGameStatsNames.indexOf(marketStat));
        console.log(
          'values' +
            recentGameStats.stats[recentGameStatsNames.indexOf(marketStat)]
        );

        if (!isNaN(playerStat)) {
          // Compare playerStat with propLine and propOverOrUnder
          const result = compareProp(
            playerStat,
            propLine,
            propOverOrUnder
          );
          console.log(
            'Pick for player ' +
              playerPicked +
              ' on ' +
              league +
              ': ' +
              market +
              ' ' +
              result
          );

          const updateData = {
            betResult: result,
          };

          try {
            // Send PATCH request to update betResult
            const patchResponse = await Pickem1.findByIdAndUpdate(
              pick._id,
              updateData,
              { new: true }
            );
            const updatedPick = patchResponse;
            resolvedPicks.push(updatedPick);
            console.log('Updated row: ' + JSON.stringify(updatedPick));
          } catch (error) {
            console.log('Error updating row: ' + error);
          }
        } else {
          console.log('No statistics found for player: ' + playerPicked);
        }
      } else {
        console.log('Player ID not found for player: ' + playerPicked);
        // Handle case where player ID is not found
      }
    }
  }

  res.status(200).json({
    status: 'success',
    data: resolvedPicks,
  });

  function findStatisticsIndex(market, statistics) {
    if (market.startsWith('pitcher')) {
      for (let i = 0; i < statistics.length; i++) {
        if (statistics[i].displayName === 'Pitching') {
          return i;
        }
      }
    } else if (market.startsWith('batter')) {
      for (let i = 0; i < statistics.length; i++) {
        if (statistics[i].displayName === 'Batting') {
          return i;
        }
      }
    } else if (market.startsWith('player_pass')) {
      for (let i = 0; i < statistics.length; i++) {
        if (statistics[i].displayName === 'Passing') {
          return i;
        }
      }
    } else if (market.startsWith('player_rush')) {
      for (let i = 0; i < statistics.length; i++) {
        if (statistics[i].displayName === 'Rushing') {
          return i;
        }
      }
    } else if (market.startsWith('player_reception')) {
      for (let i = 0; i < statistics.length; i++) {
        if (statistics[i].displayName === 'Receiving') {
          return i;
        }
      }
    }
    // Default to 0 if no specific market is found
    return 0;
  }

  // Helper function to find player ID from ESPN API based on player name
  function findPlayerId(players, playerName) {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.fullName.toLowerCase() === playerName.toLowerCase()) {
        return player.id;
      }
    }
    return null; // Return null if player not found
  }

  // Helper function to check if the date is six hours old
  function isSixHoursOld(dateString) {
    const pickDate = new Date(dateString);
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    return pickDate < sixHoursAgo; // Returns true if pickDate is more than 6 hours old
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

  // Helper function to map the market to the corresponding statistic
  function mapMarketToStat(market) {
    const marketStatMap = {
      // Basketball markets
      player_points: 'points',
      player_rebounds: 'totalRebounds',
      player_assists: 'assists', //this also works for hockey assists
      player_threes: 'threePointPct', // Note: Adjust if you have exact threes made stat
      player_blocks: 'blocks',
      player_steals: 'steals',
      player_blocks_steals: ['blocks', 'steals'], // Combination
      player_turnovers: 'turnovers',
      player_points_rebounds_assists: [
        'points',
        'totalRebounds',
        'assists',
      ], // Combination
      player_points_rebounds: ['points', 'totalRebounds'], // Combination
      player_points_assists: ['points', 'assists'], // Combination
      player_rebounds_assists: ['totalRebounds', 'assists'], // Combination

      // Baseball markets
      batter_home_runs: 'homeRuns',
      batter_first_home_run: 'homeRuns', // Assuming first home run can be checked with home runs
      batter_hits: 'hits',
      batter_total_bases: 'totalBases', // You need to calculate this from hits, doubles, triples, and home runs
      batter_rbis: 'RBIs',
      batter_runs_scored: 'runs',
      batter_hits_runs_rbis: ['hits', 'runs', 'RBIs'], // Combination
      batter_singles: 'singles', // You need to calculate this from hits minus other hits
      batter_doubles: 'doubles',
      batter_triples: 'triples',
      batter_walks: 'walks',
      batter_strikeouts: 'strikeouts',
      batter_stolen_bases: 'stolenBases',
      pitcher_strikeouts: 'strikeouts',
      pitcher_record_a_win: 'wins', // You need to check the game result
      pitcher_hits_allowed: 'hits',
      pitcher_walks: 'walks',
      pitcher_earned_runs: 'earnedRuns',
      pitcher_outs: 'outs', //

      //hockey markets
      player_goals: 'goals',
      player_total_saves: 'saves',

      //nfl markets
      player_pass_attempts: 'passingAttempts',
      player_pass_completions: 'completions',
      player_pass_interceptions: 'interceptions',
      player_pass_yds: 'passingYards',
      player_rush_yds: 'rushingYards',
      player_rush_attempts: 'rushingAttempts',
      player_reception_yds: 'receivingYards',
      player_receptions: 'receptions',
      player_pass_tds: 'passingTouchdowns',
    };
    return marketStatMap[market] || null;
  }

  // Helper function to get the player statistic for the most recent game
  function getPlayerStatForGame(gameStat, marketStat, gameStatNames) {
    // Check if marketStat is an array (indicating combination stats)
    if (Array.isArray(marketStat)) {
      // Initialize totalStat to accumulate the combined statistics
      let totalStat = 0;
      // Loop through each statistic in the marketStat array
      marketStat.forEach(function (stat) {
        // Find the index of the current stat in the gameStatNames array
        const statIndex = gameStatNames?.indexOf(stat);
        // If the stat is found and is a valid number, add its value to totalStat
        if (statIndex !== -1 && !isNaN(gameStat.stats[statIndex])) {
          totalStat += parseFloat(gameStat.stats[statIndex]);
        }
      });
      // Return the combined total statistic value
      return totalStat;
    } else {
      // Handle special cases for specific market statistics
      if (marketStat === 'totalBases') {
        // Find the indices for hits, doubles, triples, and home runs
        const hitsIndex = gameStatNames?.indexOf('hits');
        const doublesIndex = gameStatNames?.indexOf('doubles');
        const triplesIndex = gameStatNames?.indexOf('triples');
        const homeRunsIndex = gameStatNames?.indexOf('homeRuns');
        // Calculate total bases using the formula:
        // total bases = hits + 2*doubles + 3*triples + 4*homeRuns
        return (
          (parseFloat(gameStat.stats[hitsIndex]) || 0) +
          (parseFloat(gameStat.stats[doublesIndex]) || 0) * 2 +
          (parseFloat(gameStat.stats[triplesIndex]) || 0) * 3 +
          (parseFloat(gameStat.stats[homeRunsIndex]) || 0) * 4
        );
      } else if (marketStat === 'singles') {
        // Find the indices for hits, doubles, triples, and home runs
        const hitsIndex = gameStatNames?.indexOf('hits');
        const doublesIndex = gameStatNames?.indexOf('doubles');
        const triplesIndex = gameStatNames?.indexOf('triples');
        const homeRunsIndex = gameStatNames?.indexOf('homeRuns');
        // Calculate singles using the formula:
        // singles = hits - doubles - triples - home runs
        return (
          (parseFloat(gameStat.stats[hitsIndex]) || 0) -
          (parseFloat(gameStat.stats[doublesIndex]) || 0) -
          (parseFloat(gameStat.stats[triplesIndex]) || 0) -
          (parseFloat(gameStat.stats[homeRunsIndex]) || 0)
        );
      } else if (marketStat === 'outs') {
        // Find the index for innings
        const inningsIndex = gameStatNames?.indexOf('innings');
        // Calculate outs using the formula: outs = innings * 3
        return parseFloat(gameStat.stats[inningsIndex]) * 3;
      } else {
        // Handle single stat lookup
        // Find the index of the marketStat in the gameStatNames array
        const statIndex = gameStatNames?.indexOf(marketStat);
        // If the stat is found, return its value
        if (statIndex !== -1) {
          return parseFloat(gameStat.stats[statIndex]);
        }
      }
    }
    // Return NaN if no valid statistic is found
    return NaN;
  }

  // Helper function to compare the player statistic with the prop line and over/under
  function compareProp(playerStat, propLine, propOverOrUnder) {
    if (propOverOrUnder === 'Over') {
      return playerStat > propLine ? 'won' : 'lost';
    } else if (propOverOrUnder === 'Under') {
      return playerStat < propLine ? 'won' : 'lost';
    }
    return 'lost'; // Default case if propOverOrUnder is not "Over" or "Under"
  }
});
