app.factory('actions', function ($rootScope) {

  var roles = 
    { 'yellow' : 'Laborer',
      'green' : 'Craftsman',
      'grey' : 'Architect',
      'red' : 'Legionary',
      'purple' : 'Patron',
      'blue' : 'Merchant'
    };

  var materials = 
    { 'yellow' : 'rubble',
      'green' : 'wood',
      'grey' : 'concrete',
      'red' : 'brick',
      'purple' : 'marble',
      'blue' : 'stone'
    };

  var addClientActions = function(player, color) {
    player.clientele.forEach(function(client) {
      if (roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  };

  return {
    romeDemands: function(player, game, meta, data, action) {
      if (data.card.color == action.material) {
        player.hand.splice(data.index, 1);
        game.players[action.demander].stockpile.push(data.card.color);
        return true;
      } else {
        return false;
      }
    },

    legionary: function(player, game, meta, data, action) {
      var color = data.card.color;
      if (game.pool[color] > 0) {
        game.pool[color]--;
        player.stockpile.push(color);
      }
      for (var i = 0; i < game.players.length; i++) {
        if (i != meta.currentPlayer) {
          game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + materials[color].toUpperCase(), demander: meta.currentPlayer, material: color})
        }
      }
      return true;
    },

    lead: function(player, game, meta, data, action) {
      if (data.card.name == 'Jack') {
        player.actions.push({kind:'Jack', description:'CHOOSE A ROLE (CLICK ON POOL)', data: data});
        return true;
      }
      var color = data.card.color;
      player.hand.splice(data.index, 1);
      player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
      addClientActions(player, color);
      player.pending.push(color);
      for (var i = 0; i < game.players.length; i++) {
        if (i != meta.currentPlayer) {
          game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: color})
          addClientActions(game.players[i], color);
        }
      }
      return true;
    },

    follow: function(player, game, meta, data, action) {
      var color = data.card.color;
      if (action.color == color || data.card.name == 'Jack') {
        player.hand.splice(data.index, 1);
        player.actions.push({kind: roles[action.color], description: roles[action.color].toUpperCase()});
        player.pending.push(color);
        return true;
      } else {
        return false;
      }
    },

    layFoundation: function(player, game, meta, data, action) {
      player.buildings.push(data.card);
      player.hand.splice(data.index, 1);
      return true;
    },

    think: function(player, deck) {
      player.hand.push(deck.pop());
      while (player.hand.length < 5) {
        player.hand.push(deck.pop());
      }
      return true;
    },

    takeJack: function(player, game) {
      if (game.pool.black > 0) {
        player.hand.push({name: 'Jack', color: 'black'});
        game.pool.black--;
        return true;
      } else {
        return false;
      }
    },

    patron: function(player, color, pool) {
      player.clientele.push(roles[color]);
      pool[color]--;
      return true;
    },

    laborer: function(player, color, pool) {
      player.stockpile.push(color);
      pool[color]--;
      return true;
    },

    fillStructureFromHand: function(structure, player, data) {
      structure.materials.push(data.card.color);
      player.hand.splice(data.index, 1);
      return true;
    },

    fillStructureFromStockpile: function(structure, player, data) {
      structure.materials.push(data.material);
      player.stockpile.splice(data.index, 1);
      return true;
    },

    merchant: function(player, data) {
      player.vault.push(data.material);
      player.stockpile.splice(data.index, 1);
      return true;
    }
  };
});