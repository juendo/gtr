app.factory('actions', function ($rootScope) {

  var roles = 
    { 'yellow' : 'Laborer',
      'green' : 'Craftsman',
      'grey' : 'Architect',
      'red' : 'Legionary',
      'purple' : 'Patron',
      'blue' : 'Merchant'
    };
  var roleColors = 
    { 'Laborer' : 'yellow',
      'Craftsman' : 'green',
      'Architect' : 'grey',
      'Legionary' : 'red',
      'Patron' : 'purple',
      'Merchant' : 'blue'
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
      if (roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      } else if (storeroom && color == 'yellow') {
        player.actions.push({kind: 'Laborer', description: 'LABORER'});
      } else if (ludusMagnus && client == 'Merchant') {
        player.actions.push({kind: roles[color], description: roles[color].toUpperCase()})
      }
    }, this);
  };

  var validSelection = function(player, selectedCards, color) {
    var palace = hasAbilityToUse('Palace', player);
    var jackLength = hasAbilityToUse('Circus', player) ? 2 : 3;
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
      return (selectedCards.length == jackLength);
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
        else if (counts[key] % jackLength != 0) return false;
        else extraActions += counts[key] / jackLength;
      }
      for (var i = 0; i < extraActions - 1; i++) {
        player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
      }
      return true;
    }
  };

  var canAddToStructure = function(structure, player, color, game, action) {

    var stairway = hasAbilityToUse('Stairway', player);

    // check if structure belongs to the player
    var belongsToPlayer = false;
    player.buildings.forEach(function(building) {
      if (building == structure) {
        belongsToPlayer = true;
      }
    });
    if (!belongsToPlayer && (!stairway || !structure.done || (action && action.usedStairway))) return false;
    if (belongsToPlayer && (action && action.usedRegularArchitect)) return false;

    var scriptorium = hasAbilityToUse('Scriptorium', player);
    var road = hasAbilityToUse('Road', player);
    var tower = hasAbilityToUse('Tower', player);

    var canAdd = (structure.siteColor == color 
                || scriptorium && color == 'purple'
                || road && structure.siteColor == 'blue'
                || tower && color == 'yellow');

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

      var ok = !!canAdd && !alreadyPublic;
      if (ok) {
        action.usedStairway = true;
      }
      return ok;
    } else {

      var ok = !!canAdd && !structure.done;
      if (ok) {
        action.usedRegularArchitect = true;
      }
      return ok;
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
      && !player.usedAcademy
      &&  action.kind == 'Craftsman') 
    {
      player.actions.push({kind: 'Think', description: 'THINK'});
      player.usedAcademy = true;
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

  var meetsForumCriteria = function(player) {
    if (!hasAbilityToUse('Forum', player)) return false;
    var has = {};
    for (var role in roles) {
      has[role] = 0;
      player.clientele.forEach(function(client) {
        if (client == roles[role]) {
          has[role]++;
        }
      }, this);
    }
    var storeroom = hasAbilityToUse('Storeroom', player);
    var ludusMagnus = hasAbilityToUse('LudusMagnus', player);

    if (!storeroom && !ludusMagnus) {
      return !!has['yellow'] && !!has['green'] && !!has['red'] && !!has['grey'] && !!has['purple'] && !!has['blue'];
    } else if (storeroom && !ludusMagnus) {
      return !!has['green'] && !!has['red'] && !!has['grey'] && !!has['purple'] && !!has['blue'];
    } else if (!storeroom && ludusMagnus) {
      return !has['yellow'] + !has['green'] + !has['red'] + !has['grey'] + !has['purple'] < has['blue'];
    } else {
      return !has['green'] + !has['red'] + !has['grey'] + !has['purple'] < has['blue'];
    }
    return true;
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
      var vaultPoints = 0;
      player.vault.forEach(function(material) {
        vaultPoints += colorValues[material];
      });
      var wallPoints = hasAbilityToUse('Wall', player) ? player.stockpile.length / 2 >> 0 : 0;
      var statuePoints = hasAbilityToUse('Statue', player) ? 3 : 0;
      return calculateInfluence(player) + wallPoints + statuePoints + vaultPoints + player.merchantBonus;
    },

    handLimit: function(player) {
      return handLimit(player);
    },

    validSelection: function(player, selectedCards, color) {
      return validSelection(player, selectedCards, color);
    },

    canAddToStructure: function(structure, player, color, game, action) {
      return canAddToStructure(structure, player, color, game, action);
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
      player.madeDemand = true;
      var bridge = hasAbilityToUse('Bridge', player);
      var colosseum = hasAbilityToUse('Colosseum', player);
      var color = data.card.color;
      if (game.pool[color] > 0) {
        game.pool[color]--;
        player.stockpile.push(color);
      }
      for (var i = (meta.currentPlayer + 1) % game.players.length; i != meta.currentPlayer; i = (i + 1) % game.players.length) {
        game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + materials[color].toUpperCase(), demander: meta.currentPlayer, material: color})
        var palisade = hasAbilityToUse('Palisade', game.players[i]);
        var wall = hasAbilityToUse('Wall', game.players[i]);
        if (bridge && !wall) {
          // loop through that player's stockpile and take a material if one matches
          for (var j = 0; j < game.players[i].stockpile.length; j++) {
            if (game.players[i].stockpile[j] == color) {
              player.stockpile.push(game.players[i].stockpile.splice(j, 1)[0]);
              break;
            }
          }
        }
        if (colosseum && !wall && (bridge || !palisade)) {
          // loop through clientele and take if matches and have space
          for (var j = 0; j < game.players[i].clientele.length; j++) {
            if (roles[color] == game.players[i].clientele[j] && game.players[i].vault.length < vaultLimit(player)) {
              player.vault.push(roleColors[game.players[i].clientele.splice(j, 1)[0]]);
              break;
            }
          }
        }
      }
      data.card.selected = true;
      return true;
    },

    selectCard: function(player, game, meta, data, action) {
      data.card.selected = !data.card.selected;
      return false;
    },

    singleSelect: function(player, game, meta, data, action) {
      if (data.card.selected && !action.usedFountain) {
        data.card.selected = false;
      } else if (!action.usedFountain) {
        player.hand.forEach(function(card) {
          card.selected = false;
        });
        data.card.selected = true;
      }
      return false;
    },

    prepareToLay: function(player, color, game, meta, action) {
      // find the index of the single selected card the player has
      var index = -1;
      var card;
      for (var i = 0; i < player.hand.length; i++) {
        if (player.hand[i].selected) {
          if (index > -1) {
            return false;
          } else {
            index = i;
            card = player.hand[i];
          } 
        }
      }
      if (index == -1) {
        return false;
      }

      if (card.color != color && card.name != 'Statue') {
        return false;
      }

      var data = {index: index, card: card, color: color};

      return this.layFoundation(player, game, meta, data, action);
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
      var tower = hasAbilityToUse('Tower', player);
      if (
          6 - game.sites[data.color] < game.players.length
      || (game.sites[data.color] > 0 && ((player.actions[1] && player.actions[1].kind == action.kind) || tower))) 
      {
        if (
            action
        &&  action.usedRegularArchitect)
        {
          return false;
        }

        if (
            action
        &&  action.usedFountain
        && !data.card.selected)
        {
          return false;
        }

        // check if player has already layed that building
        var different = true;
        player.buildings.forEach(function(building) {
          if (building.name == data.card.name) {
            different = false;
          }
        }, this);
        if (different == false) { return false };
        data.card.selected = false;

        addThinkIfPlayerHasAcademy(player, action);

        action.usedRegularArchitect = true;

        // if using an in town site
        if (
           (6 - game.sites[data.color] < game.players.length || tower))
        {
          data.card.siteColor = data.color;
          player.buildings.push(data.card);
          player.hand.splice(data.index, 1);
          game.sites[data.color]--;
        }

        // else if using an out of town site
        else
        {
          data.card.siteColor = data.color;
          player.buildings.push(data.card);
          player.hand.splice(data.index, 1);
          game.sites[data.color]--;
          player.actions.splice(1,1);
        }

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

    drawOne: function(player, game, meta) {
      checkLatrine(player, game.pool);
      
      player.hand.push(game.deck.pop());
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
        var bar = hasAbilityToUse('Bar', player);

        if (
            pool != null
        && !action.takenFromPool) 
        {
          player.clientele.push(roles[color]);
          pool[color]--;
          action.takenFromPool = true;
          if (bath) {
            action.involvesBath = true;
            if (action.takenFromHand && action.takenFromDeck) player.actions.shift();
            player.actions.splice(0, 0, {kind: roles[color], description: roles[color].toUpperCase()});
            return false;
          }
          return (!bar || !!action.takenFromDeck) && (!aqueduct || !!action.takenFromHand);
        } 
        else if (
            data
        &&  data.card
        && !action.takenFromHand
        &&  aqueduct) 
        {
          player.clientele.push(roles[data.card.color]);
          player.hand.splice(data.index, 1);
          action.takenFromHand = true;
          if (bath) {
            action.involvesBath = true;
            if (action.takenFromPool && action.takenFromDeck) player.actions.shift();
            player.actions.splice(0, 0, {kind: roles[data.card.color], description: roles[data.card.color].toUpperCase()});
            return false;
          }
          return !!action.takenFromPool && (!bar || !!action.takenFromDeck);
        }
        else if (
            data
        &&  data.deck
        &&  data.deck.length > 0
        && !action.takenFromDeck
        &&  bar)
        {
          var col = data.deck.pop().color;
          player.clientele.push(roles[col]);
          if (data.deck.length == 0) data.meta.finished = true;
          action.takenFromDeck = true;
          if (bath) {
            action.involvesBath = true;
            if (action.takenFromPool && action.takenFromHand) player.actions.shift();
            player.actions.splice(0, 0, {kind: roles[col], description: roles[col].toUpperCase()});
            return false;
          }
          return !!action.takenFromPool && (!aqueduct || !!action.takenFromHand);
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

    fillStructureFromHand: function(structure, player, data, meta, game, action) {
      if (canAddToStructure(structure, player, data.card.color, game, action)) {

        if (
            action
        &&  action.usedFountain
        && !data.card.selected)
        {
          return false;
        }
        data.card.selected = false;

        structure.materials.push(data.card.color);
        player.hand.splice(data.index, 1);
        checkIfComplete(structure, player, meta, 'Craftsman');

        addThinkIfPlayerHasAcademy(player,{kind:'Craftsman'});

        return true;
      } else {
        return false;
      }
    },

    fillStructureFromStockpile: function(structure, player, data, meta, game, action) {
      if (canAddToStructure(structure, player, data.material, game, action)) {
        structure.materials.push(data.material);
        player.stockpile.splice(data.index, 1);

        checkIfComplete(structure, player, meta, 'Architect');

        if (hasAbilityToUse('Stairway', player)) {
          return !!action.usedRegularArchitect && !!action.usedStairway;
        } 
        return true;
      } else {
        return false;
      }
    },

    fillStructureFromPool: function(structure, player, color, meta, game, action) {
      if (canAddToStructure(structure, player, color, game, action)) {
        structure.materials.push(color);
        game.pool[color]--;

        checkIfComplete(structure, player, meta, 'Architect');

        if (hasAbilityToUse('Stairway', player)) {
          return !!action.usedRegularArchitect && !!action.usedStairway;
        } 

        return true;
      } else {
        return false;
      }
    },

    merchant: function(player, data, action) {
      if (player.vault.length < vaultLimit(player)) {

        var basilica = hasAbilityToUse('Basilica', player);
        var atrium = hasAbilityToUse('Atrium', player);

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
        else if (
            atrium
        &&  data.deck
        &&  data.deck.length > 0
        && !action.takenFromStockpile)
        {
          player.vault.push(data.deck.pop().color);
          if (data.deck.length == 0) data.meta.finished = true;
          action.takenFromStockpile = true;
          return !basilica || !!action.takenFromHand;
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
    },

    fountain: function(player, deck, meta, action) {
      if (
          hasAbilityToUse('Fountain', player)
      && !action.usedFountain) 
      {
        action.usedFountain = true;
        var card = deck.pop();
        card.selected = true;
        player.hand.push(card);
        if (deck.length <= 0) meta.finished = true;
      }
      return false;
    },

    sewer: function(player, data) {
      if (player.pending[data.index].color == 'black') return false;
      var card = player.pending.splice(data.index, 1)[0];
      player.stockpile.push(data.card.color);
      return player.pending.length == 0;
    },

    statue: function(player, color, game, meta, action) {
      var tower = hasAbilityToUse('Tower', player);
      if (
          6 - game.sites[color] < game.players.length
      || (game.sites[color] > 0 && (tower || (player.actions[2] && player.actions[2].kind == player.actions[1].kind))))
      {
        // if in town or tower
        if (6 - game.sites[color] < game.players.length || tower)
        {
          action.data.card.siteColor = color;
          player.buildings.push(action.data.card);
          player.hand.splice(action.data.index, 1);
          game.sites[color]--;
        }
        // out of town
        else
        {
          action.data.card.siteColor = color;
          player.buildings.push(action.data.card);
          player.hand.splice(action.data.index, 1);
          game.sites[color]--;
          player.actions.splice(2,1);
        }
        player.actions.shift();

        if (allSitesUsed(game.sites, game.players.length)) {
          meta.finished = true;
        }
        var a = player.actions[0];
        if (
            a.kind == 'Architect' 
        &&  hasAbilityToUse('Stairway', player))
        {
          var used = !!a.usedStairway;
          a.usedStairway = true;
          return used;
        }
        return true;
      } else {
        return false;
      }
    },

    checkIfGameOver: function(game, meta) {

      // check if any player meets the critera for a forum victory
      game.players.forEach(function(player) {
        player.merchantBonus = 0;
        if (meetsForumCriteria(player)) {
          meta.finished = true;
          player.winner = true;
        }
      });
      if (meta.finished) {
        // for each material type
        for (var role in roles) {
          var max = 0;
          var maxIndex = -1;
          for (var i = 0; i < game.players.length; i++) {
            var count = 0;
            game.players[i].vault.forEach(function(material) {
              if (material == role) {
                count++;
              }
            });
            if (count > max) {
              maxIndex = i;
              max = count;
            } else if (count == max) {
              maxIndex = -1;
            }
          }
          if (maxIndex >= 0) {
            game.players[maxIndex].merchantBonus += 3;
          }
        }
      }
      return meta.finished;
    }
  };
});