angular.module('GTR', ['GTR.directives', 'ngDraggable']);

if (typeof io !== 'undefined') angular.module('GTR').factory('socket', function ($rootScope, actions) {
  
  var iosocket = io.connect();
  var socket = {
    on: function (eventName, callback) {
      iosocket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(iosocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      iosocket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(iosocket, args);
          }
        });
      })
    }
  };

  // audio files
  var ding = new Audio('/audio/bell.m4a');
  var no = new Audio('/audio/no.wav');

  var update = function() {
    //if (isDragging) isDragging = false;

    // reset all glory to rome animation statuses
    $rootScope.game.players.forEach(function(player) {
      if (!$rootScope.game.glory || player != $rootScope.game.glory) {
        player.glory1 = false;
        player.glory2 = false;
      }
    });

    // if the player pressed glory to rome
    if ($rootScope.game.glory) {
      var player = $rootScope.game.glory;
      // trigger glory to rome animation
      if (player.glory1) {
        player.glory1 = false;
        player.glory2 = true;
      } else {
        player.glory1 = true;
        player.glory2 = false;
      }
      $rootScope.game.glory = null;
    }
    socket.emit('update', {
      game: JSON.parse(angular.toJson($rootScope.game)),
      ai: $rootScope.game.players[$rootScope.game.currentPlayer].ai
    });
  }

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
      if (actions.applyMove(data.move, data.game)) {
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

  // if reconnecting, request missed data from server
  socket.on('reconnect', function() {
    socket.emit('reconnection', {
      game: $rootScope.game
    });
  });

  return {
    update: update,
    on: socket.on,
    emit: socket.emit
  }
});
