
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const router = express.Router();
const fs = require('fs');
const games = mongoose.model('GameData');
const mongoose = require('mongoose');
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
  const name = req.params.name;
  const gameid = uuidv4();       //generate the new game's id
  const s = req.body.scenarios; 
  const choices = choicesArr(scenarios[s]['nodes']['initial']['choices']); // create an array of the currentStep's choices (all obj with line key)
  const newGameData = { 'name': name, 'id': gameid, 'scenario': s, 'currentStep': 'initial', 'choices': choices } // obj of game data to be returned
  const newGame = new games(newGameData); // create new game model for Mongo database
  newGame.save()
    .then(() => { res.send({ "id": gameid, "scenario": s, "currentStep": "initial" }); })
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
      const choices = choicesArr(scenarios[game.scenario]["nodes"][game.currentStep]["choices"]); //creates the choices array
      res.send({ "id": game.id, "scenario": game.scenario, "currentStep": game.currentStep, "choices": choices }) //sends the game's data
    })
    .catch(() => { 
      res.send('Something went wrong'); 
    });
});

/*
/game/:id POST route
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
      const choice = scenarios[game.scenario]["nodes"][game.currentStep]["choices"][req.body.choiceIndex]
      const next = choice['goto'];
      if (next === "failure") {
        const reason = choice['reason'];
        res.send(reason + ' Sorry, no job for you :(');
      } else {  
        const choices = choicesArr(scenarios[game.scenario]["nodes"][next]["choices"]);
        game.currentStep = next;
        game.choices = choices;
        game.save();
        res.send({ "id": game.id, "scenario": game.scenario, "currentStep": game.currentStep, "choices": choices });
      };
    })
    .catch(() => {
      res.send('Something went wrong');
    });
});

/*
ChoicesArr
----------
Creates an array of choice objects with only the 'line' key
PARAMS:
  choices - (arr) an array of choice objects with all keys included
RETURN:
  a new array with the edited objects
*/

function choicesArr (choices) {
  const newArr = [];
  choices.forEach(function(entry) {
    let c = _.pick(entry, 'line');
    newArr.push(c);
  });
  return newArr;
};

// router.post('/game', (req, res) => {
//   res.render('form', {title: req.params.scenario, id: req.params.id, scenario: req.params.scenario, currentStep: req.params.nodes});
// });

module.exports = router;
