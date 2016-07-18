'use strict'
var clone = function(game) {
	var g = {};
	g.turn = game.turn;
	g.started = game.started;
	g.created = game.created;
	g.finished = game.finished;
	g.room = game.room;
	g.leader = game.leader;
	g.currentPlayer = game.currentPlayer;
	g.name = game.name;
	g.glory = game.glory;
	g.players = game.players.map(function(player) {
		return {
			name: player.name,
			buildings: player.buildings.map(function(building) {
				return {
					name: building.name, 
					color: building.color, 
					done: building.done, 
					materials: building.materials.map(function(material) {
						return material;
					}),
					selected: building.selected, 
					copy: building.copy,
					siteColor: building.siteColor
				}
			}),
            hand: player.hand.map(function(card) {
            	return {
            		name: card.name,
            		color: card.color,
            		done: card.done,
            		materials: card.materials,
            		selected: card.selected,
            		copy: card.copy
            	}
            }),
            stockpile: player.stockpile.map(function(material) {
            	return material;
            }),
            clientele: player.clientele.map(function(client) {
            	return client;
            }),
            vault: player.vault.map(function(material) {
            	return {
            		color: material.color,
            		visibility: material.vsibility
            	}
            }),
            // a list of the actions the player has yet to use this turn
            actions: player.actions.map(function(action) {
            	return {
            		kind: action.kind,
            		usedStairway: action.usedStairway,
            		usedRegularArchitect: action.usedRegularArchitect,
            		material: action.material,
            		demander: action.demander,
            		color: action.color,
            		usedFountain: action.usedFountain,
            		takenFromPool: action.takenFromPool,
            		involvesBath: action.involvesBath,
            		takenFromHand: action.takenFromHand,
            		takenFromDeck: action.takenFromDeck,
            		takenFromStockpile: action.takenFromStockpile
            	}
            }),
            // the cards the player used to lead or follow
            pending: player.pending.map(function(card) {
            	return {
            		name: card.name,
            		color: card.color,
            		done: card.done,
            		materials: card.materials,
            		selected: card.selected,
            		copy: card.copy
            	}
            }),
            madeDemand: player.madeDemand,
            usedAcademy: player.usedAcademy,
            publicBuildings: player.publicBuildings.map(function(name) {
            	return name;
            }),
            merchantBonus: player.merchantBonus,
            influenceModifier: player.influenceModifier,
            winner: player.winner
		}
	}),
	g.deck = game.deck.map(function(card) {
		return {
			name: card.name,
			color: card.color,
			done: card.done,
			materials: card.materials,
			selected: card.selected,
			copy: card.copy
		}
	});
	g.pool = {
      'yellow': game.pool['yellow'],
      'green': game.pool['green'],
      'red': game.pool['red'],
      'grey': game.pool['grey'],
      'purple': game.pool['grey'],
      'blue': game.pool['blue'],
      // the number of jacks available
      'black': game.pool['black']
	},
	g.sites = {
      'yellow': game.sites['yellow'],
      'green': game.sites['green'],
      'red': game.sites['red'],
      'grey': game.sites['grey'],
      'purple': game.sites['grey'],
      'blue': game.sites['blue'],
      // the number of jacks available
      'black': game.sites['black']
	}
	return g;
}

class GameState {

	constructor(game) {
		
		this.clone = clone;
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
		this.clone = clone;

		this.game = game;
		this.states = [game.getState()];
		this.calcTime = 30;
		this.hash = require('hash-object');
		this.lookupDB = require('../db/frequency');
		this.wins = {};
		this.plays = {};
		this.c = 1.4;
	}

	update(state) {
		this.states.append(state);
	}

	start(callback) {
		var legal = this.game.legalMoves(this.states[this.states.length - 1]);
		this.accessDB(0, legal[0], this.states[this.states.length - 1], callback);
	}

	accessDB(index, move, state, callback) {
		var player = this.game.currentPlayer(state);
		var legal = this.game.legalMoves(state);
		var newState = this.game.applyMove(move, state);
		if (newState) { 
			var hash = this.hash({player: player, state: newState.players});
			var data = this.lookupDB(move, state, this, function(out, object) {
				console.log('found the following');
				console.log(out);
				object.plays[hash] = 50;
				object.wins[hash] = Math.floor(50 * out.wins / out.plays);
				if (legal.length > ++index) return object.accessDB(index, legal[index], state, callback);
				else return object.getMove(callback);
			});
		} else {
			console.log('not a legal move');
			if (legal.length > ++index) return this.accessDB(index, legal[index], state, callback);
			else return this.getMove(callback);
		}
		
	}

	getMove(callback) {
		this.maxDepth = 0;
		var state = this.states[this.states.length - 1];
		var player = this.game.currentPlayer(state);
		var legal = this.game.legalMoves(state);

		if (legal.length === 1) {
			return callback(legal[0]);
		}

		var moveStates = [];
		legal.forEach(function(move) {
			var newState = this.game.applyMove(move, state);
			if (newState) { 
				moveStates.push({move: move, state: newState});
			}
		}, this);

		var games = 0;
		var begin = Date.now();
		while (games < 250 && Date.now() - begin < 5000) {
			this.runSimulation();
			games += 1;
		}

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
			if (typeof this.wins[hash] !== 'undefined') {
				if (this.wins[hash] / this.plays[hash] > maxWinPercent) {
					maxWinPercent = this.wins[hash] / this.plays[hash];
					winningMove = moveStates[i].move;
				}
			}
		}

		// print wins for each move
		moveStates.forEach(function(ms) {
			var hash = this.hash({player: player, state: ms.state.players});
			console.log({ move: ms.move, win: 100 * (typeof this.wins[hash] !== 'undefined' ? this.wins[hash] : 0 ) / (typeof this.plays[hash] !== 'undefined' ? this.plays[hash] : 1)});
		}, this);

		return callback(winningMove);
	}

	runSimulation() {
		console.log('starting new simulation')

		var state = this.states[this.states.length - 1];
		var visitedStates = {};
		var expand = true;
		var player = this.game.currentPlayer(state);
		var originalPlayer = this.game.currentPlayer(state);
		var winner = -1;
		var plays = this.plays;
		var wins = this.wins;

		for (var i = 0; i < 15; i++) {
			console.log('picking next move')
			var legal = this.game.legalMoves(state);

			var moveStates = [];
			var hasData = true;
			var sum = 0;
			var keepGoing = false;
			for (var j = 0; j < legal.length; j++) {
				var move = legal[j];
				console.log('calculating possible game state');
				if (hasData || keepGoing) {
					var newState = this.game.applyMove(move, state);
					if (newState) { 
						moveStates.push({move: move, state: newState});
						var hash = this.hash({player: player, state: newState.players});
						hasData = hasData && (typeof plays[hash] !== 'undefined');
						if (hasData) sum += plays[hash];
					}
					else keepGoing = true;
				} else {
					break;
				}
			}

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
					var hash = this.hash({player: player, state: ms.state.players});
					var x = (wins[hash] / plays[hash]) + this.c * Math.sqrt(logTotal / plays[hash]);
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

			var hash = this.hash({player: player, state: state.players});
			if (expand && (typeof plays[hash] === 'undefined')) {
				console.log('ecpand');
				expand = false;
				plays[hash] = 0;
				wins[hash] = 0;
				visitedStates[hash] = player;
			}
			
			console.log('checking winner');
			player = this.game.currentPlayer(state);
			winner = this.game.hasWinner(state) || (i >= 7 && state.players[originalPlayer].actions[0] && state.players[originalPlayer].actions[0].kind === 'Lead') || i === 29 ? this.game.winner(state) : -1;
			if (winner !== -1) {
				break;
			}
		}

		for (var ps in visitedStates) {
		    if (visitedStates.hasOwnProperty(ps)) {
		        if (typeof plays[ps] !== 'undefined') {
		        	plays[ps] += 1;
		        	if (visitedStates[ps] === winner) {
		        		wins[ps] += 1;
		        	} 
		        }
		    }
		}
	}
}

exports.getMove = function(game, callback) {
	var monte = new MonteCarlo(new GameState(game));
	return monte.start(callback);
}