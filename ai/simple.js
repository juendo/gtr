class SimpleAI {
  constructor(data, current) {
    // extract the VISIBLE information

    // the current player
    var game = JSON.parse(JSON.stringify(data.game));
    this.game = game;
    this.player = game.players[current];
    this.deckSize = game.deck.length;
    this.jackNum = game.pool['black'];
    this.actions = require('../public/js/actions.js');
  }
}