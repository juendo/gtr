angular.module('GTR').factory('socketActions', function($rootScope, socket, actions) {

  // audio files
  var ding = new Audio('/audio/bell.m4a');
  var no = new Audio('/audio/no.wav');

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    if (data.game.turn < $rootScope.game.turn) return update();
    if (data.game.turn == $rootScope.game.turn && data.game.turn > 1 && !data.move) {
      if ($rootScope.game.currentPlayer == $rootScope.meta.you) {
        ding.play();
      }
      return;
    };
    $rootScope.game.started = true;
    $rootScope.game = data.game;

    // play sound effects
    if ($rootScope.game.currentPlayer == $rootScope.meta.you) {
      ding.play();
    }
    var shouldPlayNo = false;
    $rootScope.game.players.forEach(function(player) {
      if (player.glory1 || player.glory2) {
        shouldPlayNo = true;
      }
    });
    if (shouldPlayNo) no.play();

    // apply move if AI opponent moved, only for the player who created the game
    if (data.move && $rootScope.meta.you == 0 && !data.game.finished) {
      console.log("applying AI move");
      if (actions.applyMove(data.move, data.game)) {
        update();
      }
      else {
        if (data.game.players[data.game.currentPlayer].actions[0].kind == 'Rome Demands') {
          $rootScope.game.glory = data.game.players[data.game.currentPlayer];
        } else if (data.game.players[data.game.currentPlayer].actions[0].kind == 'Craftsman') {
          // deselect all cards in players hand following a craftsman for fountain
          data.game.players[data.game.currentPlayer].hand.forEach(function(card) {
            card.selected = false;
          }, this);
        }
        actions.useAction(data.game.players[data.game.currentPlayer], data.game);
        update();
      }
    }
  });

  // when the game is first created
  socket.on('created', function (data) {
    $rootScope.game.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    $rootScope.game.players = players.map(function(name) {
      return {name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[], ai: name == 'AI'};
    });
    $rootScope.meta.you = players.length - 1;
    $rootScope.game.created = true;
  });

  // when another player joins your game
  socket.on('joined', function(name) {
    $rootScope.game.players.push({name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]});
  });

  socket.on('ai joined', function(name) {
    $rootScope.game.players.push({name:'AI',buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[], ai: true});
  });

  socket.on('disconnect', function() {
    console.log('disconnect');
  });

  // if reconnecting, request missed data from server
  socket.on('reconnect', function() {
    console.log('reconnect');
    socket.emit('reconnection', {
      game: $rootScope.game
    });
  });

  return null;
});