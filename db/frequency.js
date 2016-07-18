var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = process.env.PASS ? require('./password') : process.env.PASS;

var findMove = function(db, callback, move) {

  db.collection('ms').aggregate([
    {
      $match: {
        '_id.move': move
      }
    }
  ]).toArray(function(err, docs) {
    assert.equal(err, null);
    callback(docs);
  });
  
}

var translateMove = function(move, game) {
    switch (move.kind) {
      case 'Skip':
        return {kind: 'skip'};
      case 'Sewer':
        return {kind: 'sewer', color: move.data.card.color};
      case 'Fountain':
        return {kind: 'fountain'};
      case 'Prison':
        for (var i = 0; i < game.players.length; i++) {
          if (game.players[i].name === move.opponent.name) { 
            var opponent = i;
            break;
          }
        }
        return {kind: 'prison', opponent: opponent, name: move.building.name};
      case 'Basilica':
        return {kind: 'basilica', name: move.data.card.name};
      case 'Atrium':
        return {kind: 'atrium'};
      case 'Merchant':
        return {kind: 'merchant', color: move.data.material};
      case 'Fill from Pool':
        var index = (typeof move.player !== 'undefined') ? move.player : game.currentPlayer;
        return {kind: 'fillFromPool', name: game.players[index].buildings[move.building].name, color: move.color, opponent: (index === game.currentPlayer) ? "you" : index};
      case 'Fill from Stockpile':
        var index = (typeof move.player !== 'undefined') ? move.player : game.currentPlayer;
        return {kind: 'fillFromStockpile', name: game.players[index].buildings[move.building].name, color: move.data.material, opponent: (index === game.currentPlayer) ? "you" : index};
      case 'Fill from Hand':
        return {kind: 'fillFromHand', name: game.players[game.currentPlayer].buildings[move.building].name, card: move.data.card.name};
      case 'Dock':
        return {kind: 'dock', name: move.data.card.name};
      case 'Laborer':
        return {kind: 'laborer', color: move.color};
      case 'Aqueduct':
        return {kind: 'aqueduct', name: move.data.card.name};
      case 'Bar':
        return {kind: 'bar'};
      case 'Patron':
        return {kind: 'patron', color: move.color};
      case 'Take Jack':
        return {kind: 'takeJack'};
      case 'Draw One':
        return {kind: 'drawOne'};
      case 'Refill':
        return {kind: 'refill'};
      case 'Lay':
        return {kind: 'lay', name: game.players[game.currentPlayer].hand[move.index].name, color: move.color};
      case 'Follow':
        return {kind: 'follow', cards: move.cards.map(function(index) {
          return game.players[game.currentPlayer].hand[index].name;
        })};
      case 'Lead':
        return {kind: 'lead', cards: move.cards.map(function(index) {
          return game.players[game.currentPlayer].hand[index].name;
        }), color: move.role};
      case 'Legionary':
        return {kind: 'legionary', color: move.data.card.color};
      case 'Rome Demands':
        return {kind: 'romeDemands', name: move.data.card.name};
      case 'Vomitorium':
        return {kind: 'vomitorium'};
      default:
        return {};
    }
  }

module.exports = function(move, game, object, callback) {
  var translated = translateMove(move, game);

  var found = false;
    // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

    findMove(db, function(docs) {
        var out = {wins: 10, plays: 50};
        if (docs.length === 1) {
          out.wins = docs[0].winning;
          out.plays = docs[0].total;
        }
        found = true;
        db.close();
        callback(out, object);
    }, translated);
  });
}