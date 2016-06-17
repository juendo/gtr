angular.module('GTR').factory('socketActions', function($rootScope, socket, actions) {

  // audio files
  var ding = new Audio('/audio/bell.m4a');
  var no = new Audio('/audio/no.wav');

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    if (data.turn < $rootScope.meta.turn) return update();
    if (data.turn == $rootScope.meta.turn && data.turn > 1 && !data.move) {
      if ($rootScope.meta.currentPlayer == $rootScope.meta.you) {
        ding.play();
      }
      return;
    };
    $rootScope.meta.started = true;
    $rootScope.game = data.game;
    $rootScope.meta.turn = data.turn;
    $rootScope.meta.leader = data.leader;
    $rootScope.meta.currentPlayer = data.currentPlayer;
    $rootScope.meta.finished = data.finished;

    // play sound effects
    if ($rootScope.meta.currentPlayer == $rootScope.meta.you) {
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
    if (data.move && $rootScope.meta.you == 0 && !data.finished) {
      if (actions.applyMove(data.move, data.game, $rootScope.meta)) {
        actions.useAction(data.game.players[data.currentPlayer], data.game, $rootScope.meta);
        update();
      }
      else {
        if (data.game.players[data.currentPlayer].actions[0].kind == 'Rome Demands') {
          $rootScope.meta.glory = data.game.players[data.currentPlayer];
        } else if (data.game.players[data.currentPlayer].actions[0].kind == 'Craftsman') {
          // deselect all cards in players hand following a craftsman for fountain
          data.game.players[data.currentPlayer].hand.forEach(function(card) {
            card.selected = false;
          }, this);
        }
        actions.useAction(data.game.players[data.currentPlayer], data.game, $rootScope.meta);
        update();
      }
    }
  });

  // when the game is first created
  socket.on('created', function (data) {
    $rootScope.meta.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    $rootScope.game.players = players.map(function(name) {
      return {name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[], ai: name == 'AI'};
    });
    $rootScope.meta.you = players.length - 1;
    $rootScope.meta.created = true;
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
      game: $rootScope.game,
      leader: $rootScope.meta.leader,
      turn: $rootScope.meta.turn,
      currentPlayer: $rootScope.meta.currentPlayer,
      room: $rootScope.meta.room,
      finished: $rootScope.meta.finished
    });
  });

  return null;
});