'use strict'

// AI that plays each action according to basic rules of thumb
// want to get all possible legal moves for a player
class BasicAI {
  constructor(data, current) {
    // extract the VISIBLE information

    // the current player
    var game = data.game;
    this.game = game;
    this.player = this.game.players[this.game.currentPlayer];
    this.actions = require('../public/js/actions.js');
    this.colors = ['yellow', 'green', 'grey', 'red', 'purple', 'blue'];
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
    
    var moves = [];
    var jackConsidered = false;
    for (var i = 0; i < this.player.hand.length; i++) {
      if (this.player.hand[i].color === 'black' && !jackConsidered) {
        jackConsidered = true;
        this.colors.forEach(function(color) {
          moves.push({kind: 'Lead', cards: [i], role: color});
        });
      } else if (this.player.hand[i].color !== 'black') {
        moves.push({kind: 'Lead', cards: [i], role: this.player.hand[i].color});
      }
    }
    moves.push({kind: 'Refill'});
    if (this.game.pool['black'] > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves;
  }

  follow() {
    var moves = [];
    for (var i = 0; i < this.player.hand.length; i++) {
      if (this.player.actions[0].role === this.player.hand[i].color) moves.push({kind: 'Follow', cards: [i]});
    }
    moves.push({kind: 'Refill'});
    if (this.game.pool['black'] > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves;
  }

  patron() {
    var moves = [];
    if (this.actions.clienteleLimit(this.player) > this.player.clientele.length && !this.player.actions[0].takenFromPool) {
      this.colors.forEach(function(color) {
        if (this.game.pool[color] > 0) {
          moves.push({kind: 'Patron', color: color});
        }
      }, this);
    }
    moves.push({kind: 'Skip'});
    return moves;
  }

  merchant() {
    var moves = [];
    if (this.actions.vaultLimit(this.player) > this.player.vault.length && !this.player.actions[0].takenFromStockpile) {
      var considered = {'yellow': false, 'green': false, 'red': false, 'grey': false, 'blue': false, 'purple': false};
      for (var i = 0; i < this.player.stockpile.length; i++) {
        // not checking vault limit
        if (!considered[this.player.stockpile[i].color]) {
          moves.push({kind: 'Merchant', data: {material: this.player.stockpile[i], index: i}});
          considered[this.player.stockpile[i].color] = true;
        }
      }
    }
    moves.push({kind: 'Skip'});
    return moves;
  }

  laborer() {
    var moves = [];
    if (!this.player.actions[0].takenFromPool) {
      this.colors.forEach(function(color) {
        if (this.game.pool[color] > 0) {
          moves.push({kind: 'Laborer', color: color});
        }
      }, this);
    }
    moves.push({kind: 'Skip'});
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
      if (this.player.hand[i].color !== 'black') {
        if (this.game.sites[this.player.hand[i].color] > 6 - this.game.players.length) {
          var alreadyHas = false;
          this.player.buildings.forEach(function(b) {
            if (b.name === this.player.hand[i].name) alreadyHas = true;
          }, this);
          if (!alreadyHas) moves.push({kind: 'Lay', index: i, color: this.player.hand[i].color});
        }
      }
    }
    moves.push({kind:'Skip'});

    return moves;
  }

  architect() {
    var moves = [];
    if (!this.player.actions[0].usedRegularArchitect) {
      // check if can add anything to structures
      for (var i = 0; i < this.player.stockpile.length; i++) {
        for (var j = 0; j < this.player.buildings.length; j++) {
          if (
              this.player.stockpile[i] == this.player.buildings[j].siteColor
          && !this.player.buildings[j].done) {
            moves.push({kind: 'Fill from Stockpile', stockpile: i, building: j, data: {material: this.player.stockpile[i], index: i}, player: this.game.currentPlayer});
          }
        }
      }
      // check if can lay foundation
      for (var i = 0; i < this.player.hand.length; i++) {
        if (this.player.hand[i].color !== 'black') {
          if (this.game.sites[this.player.hand[i].color] > 6 - this.game.players.length) {
            var alreadyHas = false;
            this.player.buildings.forEach(function(b) {
              if (b.name === this.player.hand[i].name) alreadyHas = true;
            }, this);
            if (!alreadyHas) moves.push({kind: 'Lay', index: i, color: this.player.hand[i].color});
          }
        }
      }
    }
    moves.push({kind:'Skip'});

    return moves;
  }

  legionary() {
    var moves = [];
    for (var i = 0; i < this.player.hand.length; i++) {
      if (!this.player.hand[i].selected) {
        if (this.player.hand[i].color != 'black') {
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