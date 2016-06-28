angular.module('GTR').controller('setupController', function($scope, socket, actions) {
  // GAME STATE functions ------------------------------------------------------------------------------------

  // when create game button is pressed
  $scope.createGame = function(game, player) {
    if (game.name.length > 0 && game.name.length < 15) {
      // broadcast to the socket that we want to create a game
      socket.emit('create', game.name);
      player.name = game.name;
      game.created = true;
    }
  };

  // when join game button is pressed
  $scope.joinGame = function(game) {
    socket.emit('join', {room: game.room, name: game.name});
  }
  
  // when start game is pressed
  $scope.start = function(game) {
    if (actions.start(game)) socket.update();
  }

  $scope.addAI = function(game) {
    socket.emit('add ai', {room: game.room});
  }
});