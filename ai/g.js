'use strict'

var clone = function(game) {
	return JSON.parse(JSON.stringify(game));
}

class Game {

	constructor(state) {
		this.state = state;
		this.actions = require('../public/js/actions');
	}

	isTerminal(state) {
		return state.finished;
	}

	applyMove(move, state) {
		return this.actions.applyMove(move, state);
	}

	winner(state) {
		var maxScore = 0;
		var maxHand = -1;
		var winner = -1;
		var l = state.players.length;
		for (var i = 0; i < l; i++) {
			var score = this.actions.score(state.players[i]);
			var hand = state.players[i].hand.length;
			if ((score > maxScore) || (score === maxScore && hand > maxHand)) {
				maxScore = score;
				maxHand = hand;
				winner = i;
			}
		}
		return winner;
	}

	currentPlayer(state) {
		return state.currentPlayer;
	}

	legalMoves(state) {
		var legal = require('./legal');
		return legal({game: state}, null);
	}

	getState() {
		return this.state;
	}

	clone(state) {
		return clone(state);
	}
}

module.exports = function(state) {
	return new Game(state);
}