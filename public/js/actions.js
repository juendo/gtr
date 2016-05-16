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
  var colorValues = 
    { 'yellow' : 1,
      'green' : 1,
      'grey' : 2,
      'red' : 2,
      'purple' : 3,
      'blue' : 3
    };

  var addClientActions = function(player, color) {
    player.clientele.forEach(function(client) {
      if (roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  };

  var validSelection = function(player, selectedCards, color) {
    if (selectedCards.length == 0) {
      return false;
    }
    if (selectedCards.length == 1 && selectedCards[0].color == color) {
      return true;
    }
    if (selectedCards.length == 1 && selectedCards[0].name == 'Jack') {
      return true;
    }
    var allSame = true;
    var firstColor = selectedCards[0].color;
    selectedCards.forEach(function(card) {
      allSame = allSame && card.color == firstColor;
    });
    if (!allSame) {
      return false;
    }
    return (selectedCards.length == 3);
  };

  var canAddToStructure = function(structure, player, color) {
    return !structure.done && structure.siteColor == color;
  };

  var checkIfComplete = function(structure, player, meta) {
    if (colorValues[structure.siteColor] > structure.materials.length) return;
    structure.done = true;
    if (structure.name == 'Amphitheatre') {
      for (var i = 0; i < calculateInfluence(player); i++) {
        player.actions.splice(0, 0, {kind: 'Craftsman', description: 'CRAFTSMAN'});
      }
    } 
    else if (structure.name == 'Catacomb') {
      meta.finished = true;
    }
    else if (structure.name == 'Foundry') {
      for (var i = 0; i < calculateInfluence(player); i++) {
        player.actions.splice(0, 0, {kind: 'Laborer', description: 'LABORER'});
      }
    }
    else if (structure.name == 'Garden') {
      for (var i = 0; i < calculateInfluence(player); i++) {
        player.actions.splice(0, 0, {kind: 'Patron', description: 'PATRON'});
      }
    }
    else if (structure.name == 'School') {
      for (var i = 0; i < calculateInfluence(player); i++) {
        player.actions.splice(0, 0, {kind: 'Think', description: 'THINK'});
      }
    }
  };

  var calculateInfluence = function(player) {
    var inf = 2;
      player.buildings.forEach(function(building) {
        if (building.done) {
          inf += colorValues[building.siteColor];
        }
      }, this);
      return inf;
  };

  var clienteleLimit = function(player) {
    var limit = calculateInfluence(player);
    if (hasAbilityToUse('Insula', player)) limit += 2;
    if (hasAbilityToUse('Aqueduct', player)) limit = limit * 2;
    return limit;
  };

  var vaultLimit = function(player) {
    var limit = calculateInfluence(player);
    if (hasAbilityToUse('Market', player)) limit += 2;
    return limit;
  };

  var handLimit = function(player) {
    var limit = 5;
    if (hasAbilityToUse('Shrine', player)) limit += 2;
    if (hasAbilityToUse('Temple', player)) limit += 4;
    return limit;
  };

  var allSitesUsed = function(sites, length) {
    var used = true;
    for (var color in sites) {
      used = used && (6 - sites[color] >= length);
    }
    return used;
  };

  var hasAbilityToUse = function(building, player) {
    var hasGate = false;
    player.buildings.forEach(function(structure) {
      if (structure.done && structure.name == 'Gate') hasGate = true;
    }, this);
    var has = null;
    player.buildings.forEach(function(structure) {
      if ((structure.done || (structure.color == 'purple' && hasGate)) && structure.name == building) has = structure;
    }, this);
    return has;
  };

  var checkAcademy = function(player, action) {
    // check if player has an academy
    var academy = hasAbilityToUse('Academy', player);
    if (academy 
      && !academy.used
      && action.kind == 'Craftsman') {
      player.actions.push({kind: 'Think', description: 'THINK'});
      academy.used = true;
    }
  };

  return {

    hasAbilityToUse: function(building, player) {
      return hasAbilityToUse(building, player);
    },

    score: function(player) {
      return calculateInfluence(player); 
    },

    handLimit: function(player) {
      return handLimit(player);
    },

    validSelection: function(player, selectedCards, color) {
      return validSelection(player, selectedCards, color);
    },

    canAddToStructure: function(structure, player, color) {
      return canAddToStructure(structure, player, color);
    },

    checkIfComplete: function(structure, player, meta) {
      return checkIfComplete(structure, player, meta);
    },

    addClientActions: function(player, color) {
      return addClientActions(player, color);
    },

    vaultLimit: function(player) {
      return vaultLimit(player);
    },

    clienteleLimit: function(player) {
      return clienteleLimit(player);
    },

    influence: function(player) {
      return calculateInfluence(player);
    },

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
      if (data.card.selected) {
        return false;
      }
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
      data.card.selected = true;
      return true;
    },

    selectCard: function(player, game, meta, data, action) {
      data.card.selected = !data.card.selected;
      return false;
    },

    lead: function(player, game, meta, data, action) {

      var color = data.card.color;

      // extract the cards the player has selected
      var selectedCards = [];
      player.hand.forEach(function(card) {
        card.selected ? selectedCards.push(card) : null;
      }, this);
      // check if that selection can be used to lead the selected role
      if (!validSelection(player, selectedCards, color)) {
        return false;
      }

      // perform the lead action
      player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
      addClientActions(player, color);
      player.pending = selectedCards;

      for (var i = 0; i < game.players.length; i++) {
        if (i != meta.currentPlayer) {
          game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: color})
          addClientActions(game.players[i], color);
        }
      }
      for (var i = 0; i < player.hand.length; i++) {
        if (player.hand[i].selected) {
          player.hand.splice(i--, 1);
        }
      }
      return true;
    },

    follow: function(player, game, meta, data, action) {
      var color = data.card.color;
      // extract the cards the player has selected
      var selectedCards = [];
      player.hand.forEach(function(card) {
        card.selected ? selectedCards.push(card) : null;
      }, this);

      if (action.color == color && validSelection(player, selectedCards, color)) {
        player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
        player.pending = selectedCards;
        for (var i = 0; i < player.hand.length; i++) {
          if (player.hand[i].selected) {
            player.hand.splice(i--, 1);
          }
        }
        return true;
      } else {
        return false;
      }
    },

    layFoundation: function(player, game, meta, data, action) {
      if (6 - game.sites[data.card.color] < game.players.length) {

        // check if player has already layed that building
        var different = true;
        player.buildings.forEach(function(building) {
          if (building.name == data.card.name) {
            different = false;
          }
        }, this);
        if (different == false) { return false };

        checkAcademy(player, action);

        data.card.siteColor = data.card.color;
        player.buildings.push(data.card);
        player.hand.splice(data.index, 1);
        game.sites[data.card.color]--;

        if (allSitesUsed(game.sites, game.players.length)) {
          meta.finished = true;
        }
        return true;
      } else {
        return false;
      }
    },

    think: function(player, deck) {
      player.hand.push(deck.pop());
      while (player.hand.length < handLimit(player) && deck.length > 0) {
        player.hand.push(deck.pop());
      }
      if (deck.length < 1) { meta.finished = true };
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

    patron: function(player, color, pool, data, action) {

      if (player.clientele.length < clienteleLimit(player)) {
        if (pool) {
          player.clientele.push(roles[color]);
          pool[color]--;
          if (hasAbilityToUse('Aqueduct', player)) {
            action.takenFromPool = true;
            return !!action.takenFromHand;
          } else {
            return true;
          }
        } else if (hasAbilityToUse('Aqueduct', player)) {
          player.clientele.push(roles[data.card.color]);
          player.hand.splice(data.index, 1);
          action.takenFromHand = true;
          return !!action.takenFromPool;
        } 
      }
      return false;
    },

    laborer: function(player, color, pool) {
      player.stockpile.push(color);
      pool[color]--;
      return true;
    },

    fillStructureFromHand: function(structure, player, data, meta) {
      if (canAddToStructure(structure, player, data.card.color)) {
        structure.materials.push(data.card.color);
        player.hand.splice(data.index, 1);
        checkIfComplete(structure, player, meta);

        checkAcademy(player,{kind:'Craftsman'});

        return true;
      } else {
        return false;
      }
    },

    fillStructureFromStockpile: function(structure, player, data, meta) {
      if (canAddToStructure(structure, player, data.material)) {
        structure.materials.push(data.material);
        player.stockpile.splice(data.index, 1);
        checkIfComplete(structure, player, meta);

        return true;
      } else {
        return false;
      }
    },

    merchant: function(player, data) {
      if (player.vault.length < vaultLimit(player)) {
        player.vault.push(data.material);
        player.stockpile.splice(data.index, 1);
        return true;
      } else {
        return false;
      }
    }
  };
});