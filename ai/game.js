'use strict'

class GameState {

	constructor(game) {
		// make a new object
		this.clone = require('clone');
		this.game = this.clone(game);
		this.actions = require('../public/js/actions.js');
	}

	legalMoves(game) {
		var moves = require('./legal');
		var legal = moves({game: game}, game.currentPlayer);
		return legal;
	}

	applyMove(move, game) {
		// copy state
		var prevState = this.clone(game);
		return this.actions.applyMove(move, prevState);
	}

	hasWinner(game) {
		return game.finished;
	}

	winner(game) {

		if (!game.finished) {
			var strategy = require('./strategy.js');
			return strategy.getWinner(game);
		}
		var maxScore = 0;
		var winner = -1;
		var l = game.players.length;
		for (var i = 0; i < l; i++) {
			if (this.actions.score(game.players[i]) > maxScore) {
				maxScore = this.actions.score(game.players[i]);
				winner = i;
			}
		}
		return winner;
	}

	currentPlayer(game) {
		return game.currentPlayer;
	}

	getState() {
		return this.clone(this.game);
	}
}

class MonteCarlo {

	constructor(game) {
		this.clone = require('clone');

		this.game = game;
		this.states = [game.getState()];
		this.calcTime = 30;
		this.hash = require('hash-object');
		this.wins = {};
		this.plays = {};
		this.c = 1.4;
	}

	update(state) {
		this.states.append(state);
	}

	getMove() {
		this.maxDepth = 0;
		var state = this.states[this.states.length - 1];
		var player = this.game.currentPlayer(state);
		var legal = this.game.legalMoves(state);

		if (legal.length === 1) {
			return legal[0];
		}

		var games = 0;
		var begin = Date.now();
		while (games < 40 && Date.now() - begin < 5000) {
			this.runSimulation();
			games += 1;
		}

		var moveStates = [];
		legal.forEach(function(move) {
			var newState = this.game.applyMove(move, state);
			if (newState) moveStates.push({move: move, state: newState});
		}, this);

		console.log("Played number of games:");
		console.log(games);

		console.log("Time taken:");
		console.log(Date.now() - begin);

		// get best move by win percentage
		var maxWinPercent = 0;
		var winningMove = moveStates[0].move;
		var l = moveStates.length;
		for (var i = 0; i < l; i++) {
			var hash = this.hash({player: player, state: moveStates[i].state.players});
			if (this.wins[hash]) {
				if (this.wins[hash].count / this.plays[hash].count > maxWinPercent) {
					maxWinPercent = this.wins[hash].count / this.plays[hash].count;
					winningMove = moveStates[i].move;
				}
			}
		}

		// print wins for each move
		moveStates.forEach(function(ms) {
			var hash = this.hash({player: player, state: ms.state.players});
			console.log({ move: ms.move, win: 100 * (this.wins[hash] ? this.wins[hash].count : 0 ) / (this.plays[hash] ? this.plays[hash].count : 1)});
		}, this);

		return winningMove;
	}

	runSimulation() {
		console.log('starting new simulation')

		var statesCopy = this.clone(this.states);
		var state = statesCopy[statesCopy.length - 1];
		var visitedStates = {};
		var expand = true;
		var player = this.game.currentPlayer(state);
		var originalPlayer = this.game.currentPlayer(state);
		var winner = -1;
		var plays = this.plays;
		var wins = this.wins;
		var hashFunc = this.hash;

		for (var i = 0; i < 15; i++) {
			console.log('picking next move')
			var legal = this.game.legalMoves(state);

			var moveStates = [];
			var hasData = true;
			var sum = 0;
			legal.forEach(function(move) {
				console.log('calculating possible game state');
				var newState = this.game.applyMove(move, state);
				if (newState) moveStates.push({move: move, state: newState});
				var hash = hashFunc({player: player, state: newState.players});
				hasData = hasData && plays[hash];
				if (hasData) sum += plays[hash].count;
			}, this);

			if (!moveStates.length) {
				console.log('no legal moves');
				console.log(legal);
			}

			var move;
			if (hasData) {
				console.log('all moves have data');
				var logTotal = Math.log(sum);
				var max = 0;
				moveStates.forEach(function(ms) {
					var hash = hashFunc({player: player, state: ms.state.players});
					var x = (wins[hash].count / plays[hash].count) + this.c * Math.sqrt(logTotal / plays[hash].count);
					if (x > max) {
						max = x;
						move = ms.move;
						state = ms.state;
					}
				}, this);
			} else {
				console.log('not all moves have data');
				var rand = Math.floor(Math.random() * moveStates.length);
				move = moveStates[rand].move;
				state = moveStates[rand].state;
			}

			statesCopy.push(state);

			var hash = hashFunc({player: player, state: state.players});
			if (expand && !plays[hash]) {
				expand = false;
				plays[hash] = {count: 0};
				wins[hash] = {count: 0};
			}

			visitedStates[hash] = {player: player};
			
			console.log('checking winner');
			player = this.game.currentPlayer(state);
			winner = this.game.hasWinner(state) || (i >= 7 && state.players[originalPlayer].actions[0] && state.players[originalPlayer].actions[0].kind === 'Lead') || i === 29 ? this.game.winner(state) : -1;
			if (winner !== -1) {
				break;
			}
		}

		for (var ps in visitedStates) {
		    if (visitedStates.hasOwnProperty(ps)) {
		        if (!!plays[ps]) {
		        	plays[ps].count += 1;
		        	if (visitedStates[ps].player === winner) {
		        		wins[ps].count += 1;
		        	} 
		        }
		    }
		}
	}
}

exports.getMove = function(game) {
	var monte = new MonteCarlo(new GameState(game));
	return monte.getMove();
}