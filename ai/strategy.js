exports.getWinner = function(game) {
	var actions = require('../public/js/actions.js');
	var prev = game.finished;
	game.finished = true;
	actions.checkIfGameOver(game);

	/**/
	var scores = game.players.map(actions.score, actions);
	
	for (var i = 0; i < game.players.length; i++) {
		var player = game.players[i];
		scores[i] += 0.2 * player.stockpile.length;
		player.buildings.forEach(function(building) {
			scores[i] += building.done ? 0 : building.materials.length / actions.colorValues[building.siteColor] + 0.1;
		});
		scores[i] += 0.2 * player.clientele.length;
	}

	var maxScore = 0;
	var winner = -1;
	for (var i = 0; i < scores.length; i++) {
		if (scores[i] > maxScore) {
			maxScore = scores[i];
			winner = i;
		}
	}
	game.finished = prev;
	return winner;
}