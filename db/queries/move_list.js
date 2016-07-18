/*skip
	{kind: 'skip'}
sewer
	{kind: 'sewer', color: _}
fountain
	{kind: 'fountain'}
prison
	{kind: 'prison', opponent: _, name: _}
basilica
	{kind: 'basilica', name: _}
atrium
	{kind: 'atrium'}
merchant
	{kind: 'merchant', color: _}
fillFromPool
	{kind: 'fillFromPool', name: _, color: _, opponent: __}
fillFromStockpile
	{kind: 'fillFromStockpile', name: _, color: _, opponent: _}
fillFromHand
	{kind: 'fillFromHand', name: _, card: _}
dock
	{kind: 'dock', name: _}
laborer
	{kind: 'laborer', color: _}
aqueduct
	{kind: 'aqueduct', name: _}
bar
	{kind: 'bar'}
patron
	{kind: 'patron', color: _}
takeJack
	{kind: 'takeJack'}
drawOne
	{kind: 'drawOne'}
refill
	{kind: 'refill'}
lay
	{kind: 'lay', name: _, color: _}
follow
	{kind: 'follow', cards: _}
lead
	{kind: 'lead', cards: _, color: _}
legionary
	{kind: 'legionary', name: _}
romeDemands
	{kind: 'romeDemands', name: _}
vomitorium:
	{kind: 'vomitorium'}*/
// how many times each player followed each action


module.exports.map = function() {
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
	if (this.winner && this.move && this.game) {
		var move = translateMove(this.move, this.game);
		emit({winning: this.winner === this.name, move: move}, 1);
	}
}

module.exports.reduce = function(key, count) {
  return Array.sum(count);
}