angular.module('GTR').controller('gtrController', function($scope, socket, actions, styling) {

  // called when a card in your hand is clicked
  $scope.handClicked = function(player, game, data, action) {

    if (action == 'Rome Demands') 
      var move = {kind: 'Rome Demands', data: data};
    else if (action == 'Legionary') 
      var move = {kind: 'Legionary', data: data};
    else if (action == 'Patron') 
      var move = {kind: 'Aqueduct', data: data};
    else if (action == 'Laborer') 
      var move = {kind: 'Dock', data: data};
    else if (action == 'Merchant') 
      var move = {kind: 'Basilica', data: data};

    else if (action == 'Lead' || action == 'Follow' || (action == 'Think' && player.actions[0].skippable))
      data.card.selected = !data.card.selected;
    else if ((action == 'Craftsman' || action == 'Architect') && data.card.name != 'Jack') {
      if (data.card.selected && !player.actions[0].usedFountain) {
        data.card.selected = false;
      } else if (!player.actions[0].usedFountain) {
        player.hand.forEach(function(card) {
          card.selected = false;
        });
        data.card.selected = true;
      }
    }

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update(); 
  }

  // called when the deck is clicked (and you are the current player)
  $scope.deckClicked = function(action, game) {

    if (action == 'Lead' || action == 'Follow' || action == 'Think') 
      var move = {kind: 'Refill'};
    else if (action == 'Merchant') 
      var move = {kind: 'Atrium'};
    else if (action == 'Patron') 
      var move = {kind: 'Bar'};
    else if (action == 'Craftsman') 
      var move = {kind: 'Fountain'};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  $scope.drawOne = function(action, game) {

    if (action == 'Lead' || action == 'Follow' || action == 'Think') {
      var move = {kind: 'Draw One'};
    }

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  $scope.skipAction = function(player, game, action) {

    if (action == 'Rome Demands')
      game.glory = player;
    else if (action == 'Craftsman') {
      player.hand.forEach(function(card) {
        card.selected = false;
      });
    }

    if (actions.applyMove({kind: 'Skip'}, game)) socket.update();
  }

  $scope.jackClicked = function(action, game) {

    if (action == 'Lead' || action == 'Follow' || action == 'Think')
      var move = {kind: 'Take Jack'};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  // called when a drag ends over a structure
  $scope.dragEnded = function(action, data, game, index, playerIndex) {

    if (data.card && action == 'Craftsman')
      var move = {kind: 'Fill from Hand', building: index, data: data};
    else if (data.material && action == 'Architect')
      var move = {kind: 'Fill from Stockpile', building: index, data: data, player: playerIndex};
    else if (data.color && action == 'Architect')
      var move = {kind: 'Fill from Pool', building: index, color: data.color, player: playerIndex};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  // called when a space in the pool is clicked
  $scope.poolClicked = function(player, color, game, action) {

    var cards = [];
    for (var i = 0; i < player.hand.length; i++) {
      if (player.hand[i].selected) {
        cards.push(i);
      }
    }

    if (action == 'Lead')
      var move = {kind: 'Lead', cards: cards, role: color};
    else if (action == 'Patron')
      var move = {kind: 'Patron', color: color};
    else if (action == 'Laborer')
      var move = {kind: 'Laborer', color: color};
    else if (action == 'Follow')
      var move = {kind: 'Follow', cards: cards};
    else if (cards.length === 1 && (action == 'Craftsman' || action == 'Architect'))
      var move = {kind: 'Lay', index: cards[0], color: color};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(action, data, game) {

    if (action == 'Merchant')
      var move = {kind: 'Merchant', data: data};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  $scope.pendingClicked = function(action, data, game) {

    if (action == 'Sewer')
      var move = {kind: 'Sewer', data: data};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  $scope.buildingClicked = function(action, building, isYours, opponent, index, game) {

    if ((action == 'Lead' || action == 'Think' || action == 'Follow') && building.name == 'Vomitorium' && isYours)
      var move = {kind: 'Vomitorium'};
    else if (action == 'Prison' && !isYours)
      var move = {kind: 'Prison', building: building, opponent: opponent, index: index};

    if ((typeof move !== 'undefined') && actions.applyMove(move, game)) socket.update();
  }

  $scope.triggerReconnect = function() {
    socket.emit('reconnection', {game: $scope.game});
  };
})