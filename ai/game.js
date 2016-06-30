'use strict'

class GameState {

	constructor(game) {
		// make a new object
		this.game = JSON.parse(JSON.stringify(game));
		this.actions = require('../public/js/actions.js');
	}

	legalMoves(game) {
		var moves = require('./basic');
		return moves({game: game}, game.currentPlayer);
	}

	applyMove(move, game) {
		// copy state
		var prevState = JSON.parse(JSON.stringify(game));
		prevState.turn += 1;
		return this.actions.applyMove(move, prevState);
	}

	winner(game) {

		console.log(game.turn);

		if (!game.finished && game.turn - this.game.turn < 5) {
			return -1;
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

		console.log("Monte carlo starting");
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
			console.log(games);
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
			if (this.wins[this.hash({player: player, state: moveStates[i].state})]) {
				if (this.wins[this.hash({player: player, state: moveStates[i].state})].count / this.plays[this.hash({player: player, state: moveStates[i].state})].count > maxWinPercent) {
					maxWinPercent = this.wins[this.hash({player: player, state: moveStates[i].state})].count / this.plays[this.hash({player: player, state: moveStates[i].state})].count;
					winningMove = moveStates[i].move;
				}
			}
		}

		return winningMove;
	}

	runSimulation() {
		console.log("running simulation");
		var statesCopy = JSON.parse(JSON.stringify(this.states));
		var state = statesCopy[statesCopy.length - 1];
		var visitedStates = {};
		var expand = true;
		var player = this.game.currentPlayer(state);

		for (var i = 0; i < 100; i++) {
			console.log(state.currentPlayer);
			var legal = this.game.legalMoves(state);

			var rand = Math.random();
			rand *= legal.length;
			rand = Math.floor(rand);
			console.log(rand < legal.length);
			var move = legal[rand];
			var newState = this.game.applyMove(move, state);
			if (newState) state = newState;
			else break;

			statesCopy.push(state);

			if (expand && !this.plays[this.hash({player: player, state: state})]) {
				expand = false;
				this.plays[this.hash({player: player, state: state})] = {player: player, state: state, count: 0};
				this.wins[this.hash({player: player, state: state})] = {player: player, state: state, count: 0};
			}

			if (!visitedStates[this.hash({player: player, state: state})]) visitedStates[this.hash({player: player, state: state})] = {player: player, state: state};
	
			player = this.game.currentPlayer(state);
			var winner = this.game.winner(state);
			if (winner !== -1) {
				break;
			}
		}

		for (var ps in visitedStates) {
		    if (visitedStates.hasOwnProperty(ps)) {
		        if (!!visitedStates[this.hash(ps)]) {
		        	this.plays[this.hash(ps)].count += 1;
		        	if (ps.player === winner) {
		        		this.wins[this.hash(ps)].count += 1;
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