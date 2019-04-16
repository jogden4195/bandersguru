
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const router = express.Router();
const fs = require('fs');
const games = mongoose.model('GameData');

let gameData = fs.readFileSync('scenarios.json');
let scenarios = JSON.parse(gameData)

// router.get('/', (req, res) => {
//   res.render('form', { title: 'Bandersguru Home Screen' });
// });

router.get('/scenarios', (req, res) => {
  res.send({ "scenarios": Object.keys(scenarios) });
});

router.post('/game', (req, res) => {
  const gameid = uuidv4();
  const s = req.body.scenarios
  const choices = [];
  scenarios[s]['nodes']['initial']['choices'].forEach(function(entry) {
          let c = _.pick(entry, 'line');
          choices.push(c);
        });
  let newGameData = { 'id': gameid, 'scenario': s, 'currentStep': 'initial', 'choices': choices }
  let newGame = new games(newGameData);
  newGame.save()
    .then(() => { res.send({ "id": gameid, "scenario": s, "currentStep": "initial" }); })
    .catch(() => { res.send('Sorry! Something went wrong.'); });
});

router.get('/game/:id', (req, res) => {
  games.findOne({ id: req.params.id} )
    .then((game) => {
      const choices = [];
      scenarios[game.scenario]["nodes"][game.currentStep]["choices"].forEach(function(entry) {
        let c = _.pick(entry, 'line');
        choices.push(c);
      });
      res.send({ "id": game.id, "scenario": game.scenario, "currentStep": game.currentStep, "choices": choices })
    })
    .catch(() => { 
      res.send('Something went wrong'); 
    });
});

router.post('/game/:id', (req, res) => {
  games.findOne({ id: req.params.id } )
    .then((game) => {
      const choice = scenarios[game.scenario]["nodes"][game.currentStep]["choices"][req.body.choiceIndex]
      const next = choice['goto'];
      if (next === "failure") {
        const reason = choice['reason'];
        res.send(reason + ' Sorry, no job for you :(');
      } else {
        const choices = [];
        scenarios[game.scenario]["nodes"][next]["choices"].forEach(function(entry) {
          let c = _.pick(entry, 'line');
          choices.push(c);
        });
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



// router.post('/game', (req, res) => {
//   res.render('form', {title: req.params.scenario, id: req.params.id, scenario: req.params.scenario, currentStep: req.params.nodes});
// });

module.exports = router;
