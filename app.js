const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running On http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
//Returns a list of all the players in the player table

const ConvertToEachPlayerObjectAPI1 = (eachObject) => {
  return {
    playerId: eachObject.player_id,
    playerName: eachObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const getPlayersQueryResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayersQueryResponse.map((eachObject) =>
      ConvertToEachPlayerObjectAPI1(eachObject)
    )
  );
});

//API 2
//get specific player based on playerId

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayer = `
    select *
    from player_details
    where player_id = ${playerId};`;
  const getSpecificPlayerResponse = await db.get(getSpecificPlayer);
  response.send(ConvertToEachPlayerObjectAPI1(getSpecificPlayerResponse));
});

//API 3
//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
    update player_details
    set player_name = '${playerName}'
    where player_id = ${playerId};`;
  const updatePlayerDetailsQueryResponse = await db.run(
    updatePlayerDetailsQuery
  );
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match

const getSpecificQueryAPI4 = (eachItem) => {
  return {
    matchId: eachItem.match_id,
    match: eachItem.match,
    year: eachItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select *
    from match_details
    where match_id = ${matchId};`;
  const getMatchQueryResponse = await db.get(getMatchQuery);
  response.send(getSpecificQueryAPI4(getMatchQueryResponse));
});

//API 5
//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `
    select match_id from player_match_score where player_id = ${playerId};`;
  const getMatchesOfPlayer = await db.all(getMatchesOfPlayerQuery);
  //get player id Array
  const matchIdsArray = getMatchesOfPlayer.map((eachMatch) => {
    return eachMatch.match_id;
  });
  //   console.log(`${matchIdsArray}`);
  const getMatchDetailsQuery = `select * from match_details where match_id in (${matchIdsArray});`;
  const getMatchDetails = await db.all(getMatchDetailsQuery);
  response.send(
    getMatchDetails.map((eachMatch) => getSpecificQueryAPI4(eachMatch))
  );
});

//API 6
//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    select *
    from player_match_score
        NATURAL JOIN player_details
    where match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => ConvertToEachPlayerObjectAPI1(eachPlayer))
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

const getEachPlayerScoresAPI7 = (playerName, objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: playerName,
    totalScore: objectItem.totalScore,
    totalFours: objectItem.totalFours,
    totalSixes: objectItem.totalSixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    select player_name from player_details where player_id = ${playerId};`;
  const getPlayerName = await db.get(getPlayerNameQuery);
  const getPlayersStatsQuery = `
    select player_id, 
    sum(score) as totalScore, 
    sum(fours) as totalFours, 
    sum(sixes) as totalSixes
    from player_match_score where player_id = ${playerId};`;
  const getPlayerStats = await db.get(getPlayersStatsQuery);
  response.send(
    getEachPlayerScoresAPI7(getPlayerName.player_name, getPlayerStats)
  );
});

module.exports = app;
