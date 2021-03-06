'use strict'

// AI that plays each action according to basic rules of thumb
// want to get all possible legal moves for a player
class BasicAI {
  constructor(data, current) {
    // extract the VISIBLE information

    // the current player
    var clone = require('clone');
    var game = clone(data.game);
    this.game = game;
    this.player = game.players[this.game.currentPlayer];
    this.deckSize = game.deck.length;
    this.actions = require('../public/js/actions.js');
  }

  moveset() {

    switch(this.player.actions[0].kind) {
      case 'Lead':
      return this.lead();
      case 'Follow':
      return this.follow();
      case 'Patron':
      return this.patron();
      case 'Merchant':
      return this.merchant();
      case 'Laborer':
      return this.laborer();
      case 'Craftsman':
      return this.craftsman();
      case 'Architect':
      return this.architect();
      case 'Legionary':
      return this.legionary();
      case 'Rome Demands':
      return this.romeDemands();
      default:
      return [{kind: 'Skip'}];
    }
  }

  // return possible moves for leading
  lead() {
    // these are play each card for its role
    // play 3 cards as any role
    // play a jack as any role
    // or think - take one card, refill hand, take a jack
    var moves = [];
    for (var i = 0; i < this.player.hand.length; i++) {
      if (this.player.hand[i].color == 'blue' && this.player.stockpile.length > 0) {
        var inf = 2;
        this.player.buildings.forEach(function(building) {
          if (building.done && (building.siteColor == 'green' || building.siteColor == 'yellow')) {
            inf += 1;
          } else if (building.done && (building.siteColor == 'red' || building.siteColor == 'grey')) {
            inf += 2;
          } else if (building.done && (building.siteColor == 'blue' || building.siteColor == 'purple')) {
            inf += 3;
          }
        });
        if (this.player.vault.length < inf) {
          moves.push({kind: 'Lead', cards: [i], role: 'blue'});
        }
      }
      else if (this.player.hand[i].color == 'yellow' && this.game.pool['green'] + this.game.pool['yellow'] + this.game.pool['red'] + this.game.pool['grey'] + this.game.pool['purple'] + this.game.pool['blue'] > 0) {
        moves.push({kind: 'Lead', cards: [i], role: 'yellow'});
      }
      else if (this.player.hand[i].color == 'green' && this.player.hand.length > 4) {
        moves.push({kind: 'Lead', cards: [i], role: 'green'});
      }
      else if (this.player.hand[i].color == 'grey') {
        var unfinished = 0;
        this.player.buildings.forEach(function(building) {
          if (!building.done) unfinished++;
        });
        if (unfinished < 3 || this.player.stockpile.length > 0) {
          moves.push({kind: 'Lead', cards: [i], role: 'grey'});
        }
      }
      else if (this.player.hand[i].color == 'red' && this.player.hand.length > 3) {
        moves.push({kind: 'Lead', cards: [i], role: 'red'});
      }
      else if (this.player.hand[i].color == 'purple') {
        var inf = 2;
        this.player.buildings.forEach(function(building) {
          if (building.done && (building.siteColor == 'green' || building.siteColor == 'yellow')) {
            inf += 1;
          } else if (building.done && (building.siteColor == 'red' || building.siteColor == 'grey')) {
            inf += 2;
          } else if (building.done && (building.siteColor == 'blue' || building.siteColor == 'purple')) {
            inf += 3;
          }
        });
        if (this.player.clientele.length < inf) {
          moves.push({kind: 'Lead', cards: [i], role: 'purple'});
        }
      }
      else if (this.player.hand[i].color == 'black' && this.player.hand.length > 4) {
        moves.push({kind: 'Lead', cards: [i], role: 'green'});
      }
      
    }
    moves.push({kind: 'Refill'});
    moves.push({kind: 'Draw One'});
    if (this.game.pool['black'] > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves;
  }

  follow() {
    var moves = [];
    for (var i = 0; i < this.player.hand.length; i++) {
      if (this.player.hand[i].color == this.player.actions[0].color || this.player.hand[i].color == 'black') {
        if (this.player.actions[0].color == 'blue' && this.player.stockpile.length > 0) {
          moves.push({kind: 'Follow', cards: [i]});
        }
        else if (this.player.actions[0].color == 'yellow' && this.game.pool['green'] + this.game.pool['yellow'] + this.game.pool['red'] + this.game.pool['grey'] + this.game.pool['purple'] + this.game.pool['blue'] > 0) {
          moves.push({kind: 'Follow', cards: [i]});
        }
        else if (this.player.actions[0].color == 'green' && this.player.hand.length > 4) {
          moves.push({kind: 'Follow', cards: [i]});
        }
        else if (this.player.actions[0].color == 'grey') {
          var unfinished = 0;
          this.player.buildings.forEach(function(building) {
            if (building.done) unfinished++;
          });
          if (unfinished < 3 || this.player.stockpile.length > 0) {
            moves.push({kind: 'Follow', cards: [i]});
          }
        }
        else if (this.player.actions[0].color == 'red' && this.player.hand.length > 3) {
          moves.push({kind: 'Follow', cards: [i]});
        }
        else if (this.player.actions[0].color == 'purple') {
          var inf = 2;
          this.player.buildings.forEach(function(building) {
            if (building.done && (building.siteColor == 'green' || building.siteColor == 'yellow')) {
              inf += 1;
            } else if (building.done && (building.siteColor == 'red' || building.siteColor == 'grey')) {
              inf += 2;
            } else if (building.done && (building.siteColor == 'blue' || building.siteColor == 'purple')) {
              inf += 3;
            }
          });
          if (this.player.clientele.length < inf) {
            moves.push({kind: 'Follow', cards: [i]});
          }
        }
      }
      
    }
    moves.push({kind: 'Refill'});
    moves.push({kind: 'Draw One'});
    if (this.game.pool['black'] > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves;
  }

  patron() {
    var moves = [];
    if (this.game.pool['blue']) {
      moves.push({kind: 'Patron', color: 'blue'});
    }
    if (this.game.pool['green']) {
      moves.push({kind: 'Patron', color: 'green'});
    }
    if (this.game.pool['purple']) {
      moves.push({kind: 'Patron', color: 'purple'});
    }
    if (this.game.pool['grey']) {
      moves.push({kind: 'Patron', color: 'grey'});
    }
    if (this.game.pool['red']) {
      moves.push({kind: 'Patron', color: 'red'});
    }
    if (this.game.pool['yellow']) {
      moves.push({kind: 'Patron', color: 'yellow'});
    }
    moves.push({kind: 'Skip'});
    return moves;
  }

  merchant() {
    var moves = [];
    for (var i = 0; i < this.player.stockpile.length; i++) {
      // not checking vault limit
      moves.push({kind: 'Merchant', data: {material: this.player.stockpile[i], index: i}});
    }
    if (!moves.length) moves.push({kind: 'Skip'});
    return moves;
  }

  laborer() {
    var moves = [];
    var wants = {'yellow': false, 'green': false, 'red': false, 'grey': false, 'blue': false, 'purple': false};
    // prioritise materials for which the player has an unfinished building
    for (var i = 0; i < this.player.buildings.length; i++) {
      if (
         !this.player.buildings[i].done
      && !wants[this.player.buildings[i].siteColor] 
      &&  this.game.pool[this.player.buildings[i].siteColor])
      {
        wants[this.player.buildings[i].siteColor] = true;
        moves.push({kind: 'Laborer', color: this.player.buildings[i].siteColor});
      }
    }
    if (!wants['blue'] && this.game.pool['blue']) {
      moves.push({kind: 'Laborer', color: 'blue'});
    }
    if (!wants['purple'] && this.game.pool['purple']) {
      moves.push({kind: 'Laborer', color: 'purple'});
    }
    if (!wants['grey'] && this.game.pool['grey']) {
      moves.push({kind: 'Laborer', color: 'grey'});
    }
    if (!wants['red'] && this.game.pool['red']) {
      moves.push({kind: 'Laborer', color: 'red'});
    }
    if (!wants['green'] && this.game.pool['green']) {
      moves.push({kind: 'Laborer', color: 'green'});
    }
    if (!wants['yellow'] && this.game.pool['yellow']) {
      moves.push({kind: 'Laborer', color: 'yellow'});
    }
    if (!moves.length) moves.push({kind: 'Skip'});
    return moves;
  }

  craftsman() {
    var moves = [];
    // first check if can add anything to a structure
    // loop over cards in hand, and for each, loop over buildings
    for (var i = 0; i < this.player.hand.length; i++) {
      for (var j = 0; j < this.player.buildings.length; j++) {
        if (
            this.player.hand[i].color == this.player.buildings[j].siteColor
        && !this.player.buildings[j].done) {
          moves.push({kind: 'Fill from Hand', hand: i, building: j, data: {card: this.player.hand[i], index: i}});
        }
      }
    }
    // check if can lay foundation
    for (var i = 0; i < this.player.hand.length; i++) {
      if (6 - this.game.sites[this.player.hand[i].color] < this.game.players.length) {
        moves.push({kind: 'Lay', index: i, color: this.player.hand[i].color});
      }
    }
    moves.push({kind:'Skip'});

    return moves;
  }

  architect() {
    var moves = [];
    // check if can add anything to structures
    for (var i = 0; i < this.player.stockpile.length; i++) {
      for (var j = 0; j < this.player.buildings.length; j++) {
        if (
            this.player.stockpile[i] == this.player.buildings[j].siteColor
        && !this.player.buildings[j].done) {
          moves.push({kind: 'Fill from Stockpile', stockpile: i, building: j, data: {material: this.player.stockpile[i], index: i}});
        }
      }
    }
    // check if can lay foundation
    for (var i = 0; i < this.player.hand.length; i++) {
      if (6 - this.game.sites[this.player.hand[i].color] < this.game.players.length) {
        moves.push({kind: 'Lay', index: i, color: this.player.hand[i].color});
      }
    }
    moves.push({kind:'Skip'});

    return moves;
  }

  legionary() {
    var moves = [];
    var wants = {'yellow': false, 'green': false, 'red': false, 'grey': false, 'blue': false, 'purple': false};
    // prioritise materials for which the player has an unfinished building
    for (var i = 0; i < this.player.buildings.length; i++) {
      if (
         !this.player.buildings[i].done
      && !wants[this.player.buildings[i].siteColor] 
      &&  this.game.pool[this.player.buildings[i].siteColor])
      {
        wants[this.player.buildings[i].siteColor] = true;
      }
    }
    for (var i = 0; i < this.player.hand.length; i++) {
      if (!this.player.hand[i].selected) {
        if (this.player.hand[i].color != 'black' && (wants[this.player.hand[i].color] || this.game.pool[this.player.hand[i].color])) {
          moves.push({kind: 'Legionary', data: {card: this.player.hand[i], index: i}});
        }
      }
    }
    for (var i = 0; i < this.player.hand.length; i++) {
      if (!this.player.hand[i].selected) {
        if (this.player.hand[i].color != 'black' && (!wants[this.player.hand[i].color] && !this.game.pool[this.player.hand[i].color])) {
          moves.push({kind: 'Legionary', data: {card: this.player.hand[i], index: i}});
        }
      }
    }

    moves.push({kind: 'Skip'});

    return moves;
  }

  romeDemands() {
    var moves = [];
    var color = this.player.actions[0].material;
    for (var i = 0; i < this.player.hand.length; i++) {
      if (this.player.hand[i].color == color) {
        moves.push({kind: 'Rome Demands', index: i, data: {index: i, card: this.player.hand[i]}});
      }
    }
    if (moves.length == 0) moves.push({kind: 'Skip'});

    return moves;
  }
}

module.exports = function(game, current) {
  var g = new BasicAI(game, current);
  return g.moveset();
}