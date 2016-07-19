var Node = require("tree-node");

// create a new game tree with single Node
// each node has an action that leads to it
// each node has a state
// each node has a number of wins
// each node has a number of plays

unknowns: determinise(), bestChild(), uncheckedActions()
 
class ISMCTS {

	constructor(game) {
		this.game = game;
	}

	run(start, n) {

		// create game tree
		var root = new Node();
		root.data({infSet: start, wins: 0, plays: 0});

		while (n--) {
			// choose a determinisation from the root's information set
			var vd = this.select({v: root, d: start.determinise()});
			if (uncheckedActions(vd).length !== 0) {
				vd = this.expand(vd);
			}
		}
	}

	select(vd) {
		while (!this.game.isTerminal(vd.d) && uncheckedActions(vd).length === 0) {
			var c = bestChild(vd);
			return {v: c, d: this.game.applyMove(vd.d, c.move)};
		}
	}

	expand(vd) {
		var unchecked = uncheckedActions(vd);
		var move = unchecked[Math.floor(Math.random() * unchecked.length)];
		var child = new Node();
		child.data({infSet: vd.v.data('infSet').concat([move]), wins: 0, plays: 0});
		return {v: child, d: this.game.applyMove(vd.d, move)};
	}
}