exports.getWinner = function(game) {
	var scores = [];
	var actions = require('../public/js/actions.js');

	game.players.forEach(function(player) {
		var score = actions.influence(player);
		score += 3 * player.vault.length;
		score += 0.2 * player.stockpile.length;
		player.buildings.forEach(function(building) {
			score += building.done ? actions.colorValues[building.siteColor] : building.materials.length / actions.colorValues[building.siteColor] + 0.1;
		});
		score += 2 * player.clientele.length;
		score += 0.1 * player.actions.length;
		scores.push(score);
	});

	var maxScore = 0;
	var winner = -1;
	for (var i = 0; i < scores.length; i++) {
		if (scores[i] > maxScore) {
			maxScore = scores[0];
			winner = i;
		}
	}
	return winner;
}