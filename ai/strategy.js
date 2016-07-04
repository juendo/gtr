exports.getWinner = function(game) {
	var scores = [];
	var actions = require('../public/js/actions.js');

	for (var i = 0; i < game.players.length; i++) {
		var player = game.players[i];
		var score = actions.influence(player);
		score += 3 * player.vault.length;
		score += 0.2 * player.stockpile.length;
		player.buildings.forEach(function(building) {
			score += building.done ? 0 : building.materials.length / actions.colorValues[building.siteColor] + 0.1;
		});
		score += 0.2 * player.clientele.length;
		score += 0.1 * player.actions.length;
		scores.push(score);
	}

	var maxScore = 0;
	var winner = -1;
	for (var i = 0; i < scores.length; i++) {
		if (scores[i] > maxScore) {
			maxScore = scores[i];
			winner = i;
		}
	}
	return winner;
}