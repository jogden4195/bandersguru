/*
index.js
--------
This file contains all of the necessary routes in order to run this game
*/

const _ = require('lodash');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const games = mongoose.model('GameData');
const router = express.Router();
const uuidv4 = require('uuid/v4');

// Opening scenarios.json file to get game scenarios
const gameData = fs.readFileSync('scenarios.json');
const scenarios = JSON.parse(gameData)

// Route for home screen
router.get('/', (req, res) => {
  res.render('home', { title: 'Bandersguru' });
});

/*
/scenarios GET route
--------------------
Simple GET request that renders scenarios template
RETURN:
  Array of top level keys in scenarios.json
*/

router.get('/scenarios', (req, res) => {
  res.render('scenarios', { title: 'Bandersguru: Scenarios', scenarios: Object.keys(scenarios) });
});

/*
/game POST route
----------------
POST request to /game that starts a new game
PARAMS:
  name - (str) name of the user
  scenario - (str) name of the scenario that the user would like to play
RETURN: 
  JSON that contains the id, scenario, and currentStep of the new game
  */

router.post('/game', (req, res) => {
  const name = req.body.name;
  const gameid = uuidv4();    //generate the new game's id
  const s = req.body.scenario; 
  const choices = scenarios[s]['nodes']['initial']['choices']; // create an array of the currentStep's choices (all obj with line key)
  const newGameData = { 'name': name, 'id': gameid, 'scenario': s, 'currentStep': 'initial', 'choices': choices } // obj of game data to be returned
  const newGame = new games(newGameData); // create new game model for Mongo database
  newGame.save()
    .then(() => { 
      res.redirect('/game/'+ gameid);
    }) 
    .catch(() => { res.send('Sorry! Something went wrong.'); });
});

/*
/game/:id GET route
-------------------
GET request that returns a specific game's data
RETURN:
  Specified game's data
*/

router.get('/game/:id', (req, res) => {
  games.findOne({ id: req.params.id} ) //Finds the first game in the DB with a matching id
    .then((game) => {
      const story = scenarios[game.scenario]['nodes'][game.currentStep]['story']
      const choices = scenarios[game.scenario]["nodes"][game.currentStep]["choices"]; //creates the choices array
      res.render('game', { title: "BandersGuru: Let's Interview!", story: story, choices: choices, id: req.params.id, reason: game.reason, name: game.name}); //sends the game's data
    })
    .catch(() => { 
      res.send('Something went wrong'); 
    });
});

/*
POST route
--------------------
POST route that takes in a choice index and proceeds the game based on where that
choice leads to
PARAMS:
  choiceIndex - (int) index of the choice the player wants to make
RETURN:
  updates the gameData with the choosen path's choices and currentStep. if the player
  comes accross a failure, they are shown a failure message.
*/

router.post('/game/:id', (req, res) => {
  games.findOne({ id: req.params.id } )
    .then((game) => {
      const choice = scenarios[game.scenario]["nodes"][game.currentStep]["choices"][Number(req.body.choiceIndex)];
      const next = choice['goto'];
      const reason = choice['reason'];
      if (next === "failure") {
        res.render("failure", {"title":"BandersGuru: Try Again!", reason:reason});
      } else if (next === "success") {
        res.send(reason); 
      } else {  
        const choices = scenarios[game.scenario]["nodes"][next]["choices"];
        game.currentStep = next;
        game.choices = choices;
        game.reason = reason;
        game.save();
        res.redirect('http://localhost:8080/game/' + game.id);
      };
    })
    .catch(() => {
      res.send('Something went wrong');
    });
});

module.exports = router;
