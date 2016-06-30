'use strict'

class GameState {

	constructor(game) {
		// make a new object
		this.game = JSON.parse(JSON.stringify(game));
		this.actions = require('../public/js/actions.js');
	}

	legalMoves(game) {
		var moves = require('./basic');
		var legal = moves({game: game}, game.currentPlayer);
		return legal;
	}

	applyMove(move, game) {
		// copy state
		var prevState = JSON.parse(JSON.stringify(game));
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
		for (var i = 0; i < game.players.length; i++) {
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
		return JSON.parse(JSON.stringify(this.game));
	}
}

class MonteCarlo {

	constructor(game) {
		this.game = game;
		this.states = [game.getState()];
		this.calcTime = 30;
		this.hash = require('object-hash');
		this.wins = {};
		this.plays = {};
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
		var begin = Date.now()
		while (games < 40) {
			this.runSimulation();
			games += 1;
		}

		var moveStates = [];
		legal.forEach(function(move) {
			var newState = this.game.applyMove(move, state);
			if (newState) moveStates.push({move: move, state: this.game.applyMove(move, state)});
		}, this);

		console.log("Played number of games:");
		console.log(games);

		console.log("Time taken:");
		console.log(Date.now() - begin);

		// get best move by win percentage
		var maxWinPercent = 0;
		var winningMove = moveStates[0].move;
		for (var i = 0; i < moveStates.length; i++) {
			var hash = this.hash({player: player, state: moveStates[i].state});
			if (this.wins[hash]) {
				if (this.wins[hash].count / this.plays[hash].count > maxWinPercent) {
					maxWinPercent = this.wins[hash].count / this.plays[hash].count;
					winningMove = moveStates[i].move;
				}
			}
		}

		// print wins for each move
		moveStates.forEach(function(ms) {
			var hash = this.hash({player: player, state: ms.state});
			console.log({ move: ms.move, win: 100 * (this.wins[hash] ? this.wins[hash].count : 0 ) / (this.plays[hash] ? this.plays[hash].count : 1)});
		}, this);
     

		return winningMove;
	}

	runSimulation() {
		var statesCopy = JSON.parse(JSON.stringify(this.states));
		var state = statesCopy[statesCopy.length - 1];
		var visitedStates = {};
		var expand = true;
		var player = this.game.currentPlayer(state);
		var winner = -1;

		for (var i = 0; i < 10; i++) {
			var legal = this.game.legalMoves(state);

			var rand = Math.random();
			rand *= legal.length;
			rand = Math.floor(rand);
			var move = legal[rand];
			var newState = this.game.applyMove(move, state);
			if (newState) state = newState;
			else break;

			statesCopy.push(state);

			var hash = this.hash({player: player, state: state});
			if (expand && !this.plays[hash]) {
				expand = false;
				this.plays[hash] = {player: player, state: state, count: 0};
				this.wins[hash] = {player: player, state: state, count: 0};
			}

			if (!visitedStates[hash]) visitedStates[hash] = {player: player, state: state};
	
			player = this.game.currentPlayer(state);
			winner = this.game.hasWinner(state) || i === 9 ? this.game.winner(state) : -1;
			if (winner !== -1) {
				break;
			}
		}

		for (var ps in visitedStates) {
		    if (visitedStates.hasOwnProperty(ps)) {
		        if (!!this.plays[ps]) {
		        	this.plays[ps].count += 1;
		        	if (visitedStates[ps].player === winner) {
		        		this.wins[ps].count += 1;
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