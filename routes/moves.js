'use strict'
// want to get all possible legal moves for a player
class GameState {
  constructor(game, current) {
    // extract the VISIBLE information

    // the current player
    this.game = game;
    this.player = game.players[current];
    this.deckSize = game.deck.length;
    this.jackNum = game.pool['black'];
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
      default:
      return {kind: 'Skip'};
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
      moves.push({kind: 'Lead', cards: [i], role: this.player.hand[i].color == 'black' ? 'purple' : this.player.hand[i].color});
    }
    moves.push({kind: 'Refill'});
    moves.push({kind: 'Draw One'});
    if (this.jackNum > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves[0];
  }

  follow() {
    var moves = [];
    for (var i = 0; i < this.player.hand.length; i++) {
      if (
          this.player.hand[i].color == this.player.actions[0].color
      ||  this.player.hand[i].color == 'black') 
      {
        moves.push({kind: 'Follow', index: i});
      }
    }
    moves.push({kind: 'Refill'});
    moves.push({kind: 'Draw One'});
    if (this.jackNum > 0) {
      moves.push({kind: 'Take Jack'});
    }
    return moves[0];
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
      moves.push({kind: 'Patron', color: 'purple'});
    }
    moves.push({kind: 'Skip'});
    return moves[0];
  }

  merchant() {
    var moves = [];
    for (var i = 0; i < this.player.stockpile.length; i++) {
      moves.push({kind: 'Merchant', data: {material: this.player.stockpile[i], index: i}});
    }
    moves.push({kind: 'Skip'});
    return moves[0];
  }

  laborer() {
    var moves = [];
    if (this.game.pool['blue']) {
      moves.push({kind: 'Laborer', color: 'blue'});
    }
    if (this.game.pool['purple']) {
      moves.push({kind: 'Laborer', color: 'purple'});
    }
    if (this.game.pool['green']) {
      moves.push({kind: 'Laborer', color: 'green'});
    }
    if (this.game.pool['grey']) {
      moves.push({kind: 'Laborer', color: 'grey'});
    }
    if (this.game.pool['red']) {
      moves.push({kind: 'Laborer', color: 'red'});
    }
    if (this.game.pool['yellow']) {
      moves.push({kind: 'Laborer', color: 'yellow'});
    }
    moves.push({kind: 'Skip'});
    return moves[0];
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

    return moves[0];
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

    return moves[0];
  }
}

module.exports = function(game, current) {
  var g = new GameState(game, current);
  return g.moveset();
}