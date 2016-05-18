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
    { 'blank' : 0,
      'yellow' : 1,
      'green' : 1,
      'grey' : 2,
      'red' : 2,
      'purple' : 3,
      'blue' : 3
    };

  var addClientActions = function(player, color) {
    var storeroom = hasAbilityToUse('Storeroom', player);
    var ludusMagnus = hasAbilityToUse('LudusMagnus', player);
    player.clientele.forEach(function(client) {
      if (roles[color] == client 
          || (storeroom && color == 'yellow')
          || (ludusMagnus && client == 'Merchant')) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  };

  var validSelection = function(player, selectedCards, color) {
    var palace = hasAbilityToUse('Palace', player);
    if (!palace) {
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
    } 
    else {
      var counts = {};
      selectedCards.forEach(function(card) {
        if (!counts[card.color]) counts[card.color] = 1;
        else counts[card.color]++;
      });
      var extraActions = 0;
      for (var key in counts) {
        if (key == 'black' || key == color) extraActions += counts[key];
        else if (counts[key] % 3 != 0) return false;
        else extraActions += counts[key] / 3;
      }
      for (var i = 0; i < extraActions - 1; i++) {
        player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
      }
      return true;
    }
  };

  var canAddToStructure = function(structure, player, color, game) {

    var stairway = hasAbilityToUse('Stairway', player);

    // check if structure belongs to the player
    var belongsToPlayer = false;
    player.buildings.forEach(function(building) {
      if (building == structure) {
        belongsToPlayer = true;
      }
    });
    if (!belongsToPlayer && (!stairway || !structure.done)) return false;

    var scriptorium = hasAbilityToUse('Scriptorium', player);
    var road = hasAbilityToUse('Road', player);

    var canAdd = (structure.siteColor == color 
                || scriptorium && color == 'purple'
                || road && structure.siteColor == 'blue');

    if (stairway && !belongsToPlayer) {

      if (!structure.done || !canAdd) return false;

      var alreadyPublic = false;

      game.players.forEach(function(p) {
        if (p.publicBuildings) {
          var containsIt = false;
          p.publicBuildings.forEach(function(b) {
            if (b == structure.name) containsIt = true;
          });
          if (!containsIt) {
            p.publicBuildings.push(structure.name);
          } else {
            alreadyPublic = true;
          }
        } else {
          p.publicBuildings = [structure.name];
        }
      });
      
      return !!canAdd && !alreadyPublic;
    } else {
      return canAdd && !structure.done;
    }
  };

  var checkIfComplete = function(structure, player, meta, actionType) {

    scriptorium = hasAbilityToUse('Scriptorium', player);
    if (!structure.done 
        && (structure.materials.length >= colorValues[structure.siteColor] 
          || (scriptorium && structure.materials[structure.materials.length - 1] == 'purple')
          || (structure.name == 'Villa' && actionType == 'Architect'))) {
      structure.done = true;
      if (structure.name == 'Amphitheatre') {
        for (var i = 0; i < calculateInfluence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Craftsman', description: 'CRAFTSMAN'});
        }
      } 
      else if (structure.name == 'Catacomb') {
        meta.finished = true;
      }
      else if (structure.name == 'Foundry') {
        for (var i = 0; i < calculateInfluence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Laborer', description: 'LABORER'});
        }
      }
      else if (structure.name == 'Garden') {
        for (var i = 0; i < calculateInfluence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Patron', description: 'PATRON'});
        }
      }
      else if (structure.name == 'School') {
        for (var i = 0; i < calculateInfluence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Think', description: 'THINK'});
        }
      }
      else if (structure.name == 'CircusMaximus'
            && player.pending.length > 0) {
        addClientActions(player, actionType == 'Craftsman' ? 'green' : 'grey');
      }
      else if (structure.name == 'Prison') {
        player.actions.splice(1, 0, {kind: 'Prison', description: 'STEAL BUILDING'});
      }
    }
  };

  var calculateInfluence = function(player) {
    var inf = 2;
    if (player.influenceModifier) inf += player.influenceModifier;
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
    // check public buildings first
    if (player.publicBuildings) {
      var isPublic = false;
      player.publicBuildings.forEach(function(pb) {
        if (pb == building) isPublic = true;
      });
      if (isPublic) return true;
    }
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

  var hasAbilityToUseWithoutPublicBuildings = function(building, player) {
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

  var addThinkIfPlayerHasAcademy = function(player, action) {
    // check if player has an academy
    var academy = hasAbilityToUse('Academy', player);
    if (
          academy 
      && !academy.used
      &&  action.kind == 'Craftsman') 
    {
      player.actions.push({kind: 'Think', description: 'THINK'});
      academy.used = true;
    }
  };

  var checkLatrine = function(player, pool) {
    // extract the cards the player has selected

    var latrine = hasAbilityToUse('Latrine', player);

    if (!latrine) return false;

    var selectedCards = [];
    var index = 0;
    var location = 0;
    player.hand.forEach(function(card) {
      card.selected ? selectedCards.push(card) : null;
      card.selected ? location = index++ : index++;
    }, this);

    if (selectedCards.length > 1) return false;
    else if (selectedCards.length == 0) return false;
    else if (selectedCards.length == 1) {
      player.hand.splice(location, 1);
      pool[selectedCards[0].color]++;
      return true;
    }
  };

  return {

    checkLatrine: function(player, pool) {
      return checkLatrine(player, pool);
    },

    hasAbilityToUse: function(building, player) {
      return hasAbilityToUse(building, player);
    },

    hasAbilityToUseWithoutPublicBuildings: function(building, player) {
      return hasAbilityToUseWithoutPublicBuildings(building, player);
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

    canAddToStructure: function(structure, player, color, game) {
      return canAddToStructure(structure, player, color, game);
    },

    checkIfComplete: function(structure, player, meta, actionType) {
      return checkIfComplete(structure, player, meta, actionType);
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

    vomitorium: function(player, pool) {
      var vom = hasAbilityToUse('Vomitorium', player);
      if (vom) {
        var cards = player.hand;
        player.hand = [];
        cards.forEach(function(card) {
          pool[card.color]++;
        });
        player.actions[0].description = 'THINK';
        return true;
      }
      else return false;
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
      if (hasAbilityToUse('CircusMaximus', player)) {
        addClientActions(player, color);
      }
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
        if (hasAbilityToUse('CircusMaximus', player)) {
          addClientActions(player, color);
        }
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

        addThinkIfPlayerHasAcademy(player, action);

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

    think: function(player, game, meta) {
      // check latrine

      checkLatrine(player, game.pool);

      player.hand.push(game.deck.pop());
      while (player.hand.length < handLimit(player) && game.deck.length > 0) {
        player.hand.push(game.deck.pop());
      }
      if (game.deck.length < 1) { meta.finished = true };
      return true;
    },

    takeJack: function(player, game) {
      if (game.pool.black > 0) {
        checkLatrine(player, game.pool);
        player.hand.push({name: 'Jack', color: 'black'});
        game.pool.black--;
        return true;
      } else {
        return false;
      }
    },

    patron: function(player, color, pool, data, action) {
      if (player.clientele.length < clienteleLimit(player)) {
        var bath = hasAbilityToUse('Bath', player);
        var aqueduct = hasAbilityToUse('Aqueduct', player);
        if (
            pool != null
        && !action.takenFromPool) 
        {
          player.clientele.push(roles[color]);
          pool[color]--;
          action.takenFromPool = true;
          if (bath) {
            if (!aqueduct) action.shouldBeRemovedUnlessPlayerHasAqueduct = true;
            if (action.takenFromHand) player.actions.shift();
            player.actions.splice(0, 0, {kind: roles[color], description: roles[color].toUpperCase()});
            return false;
          }
          return !aqueduct || !!action.takenFromHand;
        } 
        else if (
            data != null
        && !action.takenFromHand 
        &&  aqueduct) 
        {
          player.clientele.push(roles[data.card.color]);
          player.hand.splice(data.index, 1);
          action.takenFromHand = true;
          if (bath) {
            if (action.takenFromPool) player.actions.shift();
            player.actions.splice(0, 0, {kind: roles[data.card.color], description: roles[data.card.color].toUpperCase()});
            return false;
          }
          return !!action.takenFromPool;
        } 
      }
      return false;
    },

    laborer: function(player, color, pool, data, action) {
      var dock = hasAbilityToUse('Dock', player);
      if (
          pool
      && !action.takenFromPool)
      {
        player.stockpile.push(color);
        pool[color]--;
        action.takenFromPool = true;
        if (dock && !action.takenFromHand) return false;
        return !dock || !!action.takenFromHand;
      }
      else if (
          data
      && !action.takenFromHand
      &&  dock) 
      {
        player.stockpile.push(data.card.color);
        player.hand.splice(data.index, 1);
        action.takenFromHand = true;
        return !!action.takenFromPool;
      }
      return false;
    },

    fillStructureFromHand: function(structure, player, data, meta, game) {
      if (canAddToStructure(structure, player, data.card.color, game)) {
        structure.materials.push(data.card.color);
        player.hand.splice(data.index, 1);
        checkIfComplete(structure, player, meta, 'Craftsman');

        addThinkIfPlayerHasAcademy(player,{kind:'Craftsman'});

        return true;
      } else {
        return false;
      }
    },

    fillStructureFromStockpile: function(structure, player, data, meta, game) {
      if (canAddToStructure(structure, player, data.material, game)) {
        structure.materials.push(data.material);
        player.stockpile.splice(data.index, 1);

        checkIfComplete(structure, player, meta, 'Architect');

        return true;
      } else {
        return false;
      }
    },

    fillStructureFromPool: function(structure, player, color, meta, game) {
      if (canAddToStructure(structure, player, color, game)) {
        structure.materials.push(color);
        game.pool[color]--;

        checkIfComplete(structure, player, meta, 'Architect');

        return true;
      } else {
        return false;
      }
    },

    merchant: function(player, data, action) {
      if (player.vault.length < vaultLimit(player)) {

        var basilica = hasAbilityToUse('Basilica', player);
        if (
            data.material
        && !action.takenFromStockpile)
        {
          player.vault.push(data.material);
          player.stockpile.splice(data.index, 1);
          action.takenFromStockpile = true;
          return !basilica || !!action.takenFromHand;
        }
        else if (
            data.card
        && !action.takenFromHand
        &&  basilica)
        {
          player.vault.push(data.card.color);
          player.hand.splice(data.index, 1);
          action.takenFromHand = true;
          return !!action.takenFromStockpile;
        }
      }
      return false;
    },

    prison: function(player, building, opponent, index) {
      if (building.done) {
        player.buildings.push(building);
        if (!player.influenceModifier) player.influenceModifier = -3 - colorValues[building.siteColor];
        else player.influenceModifier -= (3 + colorValues[building.siteColor]);
        opponent.buildings.splice(index, 1);
        if (!opponent.influenceModifier) opponent.influenceModifier = 3 + colorValues[building.siteColor];
        else opponent.influenceModifier += (3 + colorValues[building.siteColor]);
        opponent
      } 
      return building.done;
    }
  };
});