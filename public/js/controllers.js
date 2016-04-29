/*
socket.emit('send:message', {
      message: $scope.message
    });
    */
app.controller('gtrController', function($scope, socket) {

  socket.on('init', function (data) {
      console.log(data);
    });

    socket.on('change', function (data) {
      console.log('change');
      $scope.game = data.game;
      $scope.leader = data.leader;
      $scope.currentPlayer = data.currentPlayer;
    });

    $scope.leader = 0;
    $scope.currentPlayer = 0;
    $scope.game = 
      { players: 
        [
          { buildings: [],
            hand: [{name: 'Dock', color: 'green'},{name: 'Catacomb', color: 'blue'}, {name: 'Shrine', color: 'red'},{name:'Road',color:'yellow'}],
            stockpile: [],
            clientele: [],
            vault: [],
            actions: [{kind:'Lead', description:'LEAD or THINK'}],
          },
          { buildings: [],
            hand: [{name: 'Dock', color: 'green'},{name: 'Catacomb', color: 'blue'}, {name: 'Shrine', color: 'red'},{name:'Road',color:'yellow'}],
            stockpile: [],
            clientele: [],
            vault: [],
            actions: [],
          },
          { buildings: [],
            hand: [{name: 'Catacomb', color: 'blue'}, {name: 'Shrine', color: 'red'},{name:'Road',color:'yellow'},{name: 'Dock', color: 'green'}],
            stockpile: [],
            clientele: [],
            vault: [],
            actions: [],
          }
        ],
        pool: [{color:'yellow',number:1},{color:'green',number:0},{color:'red',number:5},{color:'grey',number:0},{color:'purple',number:0},{color:'blue',number:0}],
        deck: []
      };

    $scope.shuffle = function(array) {
      var m = array.length, t, i;

      // While there remain elements to shuffle…
      while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }

      return array;
    }

    $scope.game.deck = $scope.shuffle([{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'},{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'},{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'}]);

    $scope.useAction = function() {
      $scope.game.players[$scope.currentPlayer].actions.shift();
      if ($scope.game.players[$scope.currentPlayer].actions.length == 0) {
        $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
      }
      $scope.checkTurnOver();
    }

    $scope.checkTurnOver = function() {
      socket.emit('update', {
        game: $scope.game,
        leader: $scope.leader,
        currentPlayer: $scope.currentPlayer
      });
      for (var i = 0; i < $scope.game.players.length; i++) {
        if ($scope.game.players[i].actions.length > 0) {
          return;
        }
      }
      $scope.leader = ($scope.leader + 1) % $scope.game.players.length;
      $scope.currentPlayer = $scope.leader;
      $scope.game.players[$scope.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
      
    }

    $scope.romeDemands = function(data, player, action) {
      if (data.card.color == action.material) {
        player.hand.splice(data.index, 1);
        $scope.game.players[action.demander].stockpile.push(data.card.color);
        player.actions.shift();
        if (player.actions[0] == undefined || player.actions[0].kind != 'Rome Demands') {
          $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
          for (var i = 0; i < $scope.game.players.length; i++) {
            if ($scope.game.players[$scope.currentPlayer].actions.length == 0) {
              $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
            } else {
              break;
            }
            $scope.checkTurnOver();
          }
        }
      }
    }

    $scope.legionary = function(data, player, action) {
      for (var i = 0; i < $scope.game.players.length; i++) {
        console.log('searching player');
        if (i != $scope.currentPlayer) {
          $scope.game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + $scope.materials[data.card.color].toUpperCase(), demander: $scope.currentPlayer, material: data.card.color})
        }
      }
      player.actions.shift();
      if (player.actions[0] == undefined || player.actions[0].kind != 'Legionary') {
        $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
      }
      $scope.checkTurnOver();
    }

    $scope.lead = function(data, player, action) {
      player.hand.splice(data.index, 1);
      player.actions.push({kind: $scope.roles[data.card.color], description: $scope.roles[data.card.color].toUpperCase()});
      for (var i = 0; i < $scope.game.players.length; i++) {
        if (i != $scope.currentPlayer) {
          $scope.game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: data.card.color})
        }
      }
      player.actions.shift();
      $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
      $scope.checkTurnOver();
    }

    $scope.follow = function(data, player, action) {
      player.hand.splice(data.index, 1);
      player.actions.push({kind: $scope.roles[data.card.color], description: $scope.roles[data.card.color].toUpperCase()});
      player.actions.shift();
      $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
      socket.emit('update', {
        game: $scope.game,
        leader: $scope.leader,
        currentPlayer: $scope.currentPlayer
      });
    }

    $scope.think = function() {
      var player = $scope.game.players[$scope.currentPlayer];
      var action = player.actions[0];
      if (action != undefined && (action.kind == 'Lead' || action.kind == 'Follow')) {
        while (player.hand.length < 5) {
          player.hand.push($scope.game.deck.pop());
        }
      }
      player.actions.shift();
      if (player.actions[0] == undefined) {
        $scope.currentPlayer = ($scope.currentPlayer + 1) % $scope.game.players.length;
        $scope.checkTurnOver();
      }
      socket.emit('update', {
        game: $scope.game,
        leader: $scope.leader,
        currentPlayer: $scope.currentPlayer
      });
    }

    $scope.handClicked = function(data) {
      console.log('hand clicked');
      var player = $scope.game.players[$scope.currentPlayer];
      var action = player.actions[0];
      if (action == undefined) {
        return
      } else if (action.kind == 'Rome Demands') {
        $scope.romeDemands(data, player, action);
      } else if (action.kind == 'Legionary') {
        $scope.legionary(data, player, action);
      } else if (action.kind == 'Lead') {
        $scope.lead(data, player, action);
      } else if (action.kind == 'Follow' && action.color == data.card.color) {
        $scope.follow(data, player, action);
      }
    }

    $scope.takeFromPool = function(color) {
      var player = $scope.game.players[$scope.currentPlayer];
      var action = player.actions[0];
      console.log('pool');
      if (action == undefined) {
        return;
      } else if (action.kind == 'Patron') {
        player.clientele.push($scope.roles[color]);
      } else if (action.kind == 'Laborer') {
        player.stockpile.push(color);
      } else if (action.kind == 'Merchant') {
        player.vault.push(color);
      } else {
        return;
      }
      $scope.game.pool.forEach(function(entry) {
          if (entry.color == color) {
            entry.number -= 1;
          }
        }, this);
      $scope.useAction();
      $scope.checkTurnOver();
    }

    $scope.layFoundation = function(data, evt) {
      if (!document.elementFromPoint(evt.x, evt.y).classList.contains('building')) 
      {
        var player = $scope.game.players[$scope.currentPlayer];
        if (player.actions[0] != undefined && 
            (player.actions[0].kind == 'Craftsman' ||
            player.actions[0].kind == 'Architect')) {
          if (data.card) {
            player.buildings.push(data.card);
            $scope.useAction();
          } else if (data.material) {
              player.stockpile.push(data.material);
          }
        } else if (data.card) {
          player.hand.push({name:data.card.name, color:data.card.color});
        } else if (data.material) {
          player.stockpile.push(data.material);
        }
      }
    }

    $scope.fillStructure = function(structure, data, evt) {
      var player = $scope.game.players[$scope.currentPlayer];
      var action = player.actions[0];
      if (action.kind == 'Craftsman') {
        structure.materials.push(data.card.color);
        $scope.useAction();
        $scope.checkTurnOver();
      } else if (action.kind == 'Architect') {
        structure.materials.push(data.material);
        $scope.useAction();
        $scope.checkTurnOver();
      } else if (data.card) {
        player.hand.push(data.card.name);
      } else if (data.material) {
        player.stockpile.push(data.material);
      }
    }

    $scope.removeFromHand = function(data, evt) {
      console.log('removeFromHand');
      $scope.game.players[$scope.currentPlayer].hand.splice(data.index, 1);
    }

    $scope.removeFromStockpile = function(data, evt) {
      console.log('removeFromStockpile');
      $scope.game.players[$scope.currentPlayer].stockpile.splice(data.index, 1);
    }

    $scope.spacing = 20;
    $scope.actionColors = 
      { 'Lead' : '000',
        'Follow' : '000',
        'Craftsman' : '2CA73D',
        'Laborer' : 'F7B628',
        'Architect' : '9B9D88',
        'Legionary' : 'E5020C',
        'Patron' : '8E2170',
        'Merchant' : '02AEDE',
        'Rome Demands' : '000'
      }
    $scope.materials = 
      { 'yellow' : 'rubble',
        'green' : 'wood',
        'grey' : 'concrete',
        'red' : 'brick',
        'purple' : 'marble',
        'blue' : 'stone'
      }
    $scope.roles = 
      { 'yellow' : 'Laborer',
        'green' : 'Craftsman',
        'grey' : 'Architect',
        'red' : 'Legionary',
        'purple' : 'Patron',
        'blue' : 'Merchant'
      }
    $scope.colors = 
      { 'yellow' : 'F7B628',
        'green' : '2CA73D',
        'grey' : '9B9D88',
        'red' : 'E5020C',
        'purple' : '8E2170',
        'blue' : '02AEDE'
      }
    $scope.colorValues = 
      { 'yellow' : 1,
        'green' : 1,
        'grey' : 2,
        'red' : 2,
        'purple' : 3,
        'blue' : 3
      }

    $scope.getArray = function(num) {
      return new Array(num);};
  })