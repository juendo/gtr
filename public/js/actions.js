var actions = {

  roles: { 
    'yellow' : 'Laborer',
    'green' : 'Craftsman',
    'grey' : 'Architect',
    'red' : 'Legionary',
    'purple' : 'Patron',
    'blue' : 'Merchant'
  },

  roleColors: { 
    'Laborer' : 'yellow',
    'Craftsman' : 'green',
    'Architect' : 'grey',
    'Legionary' : 'red',
    'Patron' : 'purple',
    'Merchant' : 'blue'
  },

  materials: { 
    'yellow' : 'rubble',
    'green' : 'wood',
    'grey' : 'concrete',
    'red' : 'brick',
    'purple' : 'marble',
    'blue' : 'stone'
  },

  colorValues: { 
    'blank' : 0,
    'yellow' : 1,
    'green' : 1,
    'grey' : 2,
    'red' : 2,
    'purple' : 3,
    'blue' : 3
  },

  start: function(game) {

    if (game.players.length < 2) return false;
    game.started = true;
    for (var i = 0; i < game.players.length; i++) {
      game.pool[game.deck.pop().color]++;
      while (game.players[i].hand.length < 4) {
        game.players[i].hand.push(game.deck.pop());
      }
      game.players[i].hand.push({name: 'Jack', color: 'black'});
      game.pool['black']--;
    }
    game.leader = Math.floor(Math.random() * (game.players.length));
    game.currentPlayer = game.leader;
    game.players[game.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
    return game;
  },

  addThinkIfPlayerHasAcademy: function(player, action) {
    // check if player has an academy
    var academy = this.hasAbilityToUse('Academy', player);
    if (
          academy 
      && !player.usedAcademy
      &&  action.kind == 'Craftsman') 
    {
      player.actions.push({kind: 'Think', description: 'THINK', skippable: true});
      player.usedAcademy = true;
    }
  },

  checkLatrine: function(player, pool) {
    // extract the cards the player has selected

    var latrine = this.hasAbilityToUse('Latrine', player);

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
  },

  hasAbilityToUse: function(building, player) {
    // check public buildings first
    var hasGate = false;
    if (player.publicBuildings) {
      var isPublic = false;
      player.publicBuildings.forEach(function(pb) {
        if (pb === building) isPublic = true;
        else if (pb === 'Gate') hasGate = true;
      });
      if (isPublic) return true;
    }
    player.buildings.forEach(function(structure) {
      if (structure.done && structure.name == 'Gate') hasGate = true;
    }, this);
    var has = null;
    player.buildings.forEach(function(structure) {
      if ((structure.done || (structure.color == 'purple' && hasGate)) && structure.name == building) has = structure;
    }, this);
    return has;
  },

  hasAbilityToUseWithoutPublicBuildings: function(building, player) {
    var hasGate = false;
    player.buildings.forEach(function(structure) {
      if (structure.done && structure.name == 'Gate') hasGate = true;
    }, this);
    var has = null;
    player.buildings.forEach(function(structure) {
      if ((structure.done || (structure.color == 'purple' && hasGate)) && structure.name == building) has = structure;
    }, this);
    return has;
  },

  score: function(player) {
    var vaultPoints = 0;
    player.vault.forEach(function(material) {
      vaultPoints += this.colorValues[material.color];
    }, this);
    var wallPoints = this.hasAbilityToUse('Wall', player) ? player.stockpile.length / 2 >> 0 : 0;
    var statuePoints = this.hasAbilityToUse('Statue', player) ? 3 : 0;
    return this.influence(player) + wallPoints + statuePoints + vaultPoints + player.merchantBonus;
  },

  handLimit: function(player) {
    var limit = 5;
    if (this.hasAbilityToUse('Shrine', player)) limit += 2;
    if (this.hasAbilityToUse('Temple', player)) limit += 4;
    return limit;
  },

  validSelection: function(player, selectedCards, color) {
    var palace = this.hasAbilityToUse('Palace', player);
    var jackLength = this.hasAbilityToUse('Circus', player) ? 2 : 3;
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
        player.actions.push({kind: this.roles[color], description: this.roles[color].toUpperCase()});
      }
      return true;
    }
  },

  canAddToStructure: function(structure, player, color, game, action) {
    
    var stairway = this.hasAbilityToUse('Stairway', player);
    // check if structure belongs to the player
    var belongsToPlayer = false;
    player.buildings.forEach(function(building) {
      if (building == structure) {
        belongsToPlayer = true;
      }
    });
    if (!belongsToPlayer && (!stairway || !structure.done || (action && action.usedStairway))) return false;
    if (belongsToPlayer && (action && action.usedRegularArchitect)) return false;

    var scriptorium = this.hasAbilityToUse('Scriptorium', player);
    var road = this.hasAbilityToUse('Road', player);
    var tower = this.hasAbilityToUse('Tower', player);

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
            if (structure.name === 'CircusMaximus' && !player.doubledClients && player.pending.length) this.addClientActions(player, game.currentAction);
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
  },

  checkIfComplete: function(structure, player, game, actionType) {
    scriptorium = this.hasAbilityToUse('Scriptorium', player);
    if (!structure.done 
        && (structure.materials.length >= this.colorValues[structure.siteColor] 
          || (scriptorium && structure.materials[structure.materials.length - 1] == 'purple')
          || (structure.name == 'Villa' && actionType == 'Architect'))) {
      structure.done = true;
      if (structure.name == 'Amphitheatre') {
        for (var i = 0; i < this.influence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Craftsman', description: 'CRAFTSMAN'});
        }
      } 
      else if (structure.name == 'Catacomb') {
        game.finished = true;
      }
      else if (structure.name == 'Foundry') {
        for (var i = 0; i < this.influence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Laborer', description: 'LABORER'});
        }
      }
      else if (structure.name == 'Garden') {
        for (var i = 0; i < this.influence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Patron', description: 'PATRON'});
        }
      }
      else if (structure.name == 'School') {
        for (var i = 0; i < this.influence(player); i++) {
          player.actions.splice(1, 0, {kind: 'Think', description: 'THINK', skippable: true});
        }
      }
      else if (structure.name == 'CircusMaximus'
            && player.pending.length > 0) {
        if (!player.doubledClients) this.addClientActions(player, game.currentAction);
      }
      else if (structure.name == 'Prison') {
        player.actions.splice(1, 0, {kind: 'Prison', description: 'STEAL BUILDING'});
      }
    }
  },

  addClientActions: function(player, color) {
    var storeroom = this.hasAbilityToUse('Storeroom', player);
    var ludusMagnus = this.hasAbilityToUse('LudusMagnus', player);
    player.clientele.forEach(function(client) {
      if (this.roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      } else if (storeroom && color == 'yellow') {
        player.actions.push({kind: 'Laborer', description: 'LABORER'});
      } else if (ludusMagnus && client == 'Merchant') {
        player.actions.push({kind: this.roles[color], description: this.roles[color].toUpperCase()})
      }
    }, this);
  },

  vaultLimit: function(player) {
    var limit = this.influence(player);
    if (this.hasAbilityToUse('Market', player)) limit += 2;
    return limit;
  },

  clienteleLimit: function(player) {
    var limit = this.influence(player);
    if (this.hasAbilityToUse('Insula', player)) limit += 2;
    if (this.hasAbilityToUse('Aqueduct', player)) limit = limit * 2;
    return limit;
  },

  influence: function(player) {
    var inf = 2;
    if (player.influenceModifier) inf += player.influenceModifier;
    player.buildings.forEach(function(building) {
      if (building.done && !building.stolen) {
        inf += this.colorValues[building.siteColor];
      }
    }, this);
    return inf;
  },

  allSitesUsed: function(sites, length) {
    var used = true;
    for (var color in sites) {
      used = used && (6 - sites[color] >= length);
    }
    return used;
  },

  meetsForumCriteria: function(player) {
    if (!this.hasAbilityToUse('Forum', player)) return false;
    var has = {};
    for (var role in this.roles) {
      has[role] = 0;
      player.clientele.forEach(function(client) {
        if (client == this.roles[role]) {
          has[role]++;
        }
      }, this);
    }
    var storeroom = this.hasAbilityToUse('Storeroom', player);
    var ludusMagnus = this.hasAbilityToUse('LudusMagnus', player);

    if (!storeroom && !ludusMagnus) {
      return !!has['yellow'] && !!has['green'] && !!has['red'] && !!has['grey'] && !!has['purple'] && !!has['blue'];
    } else if (storeroom && !ludusMagnus) {
      return !!has['green'] && !!has['red'] && !!has['grey'] && !!has['purple'] && !!has['blue'];
    } else if (!storeroom && ludusMagnus) {
      return !has['yellow'] + !has['green'] + !has['red'] + !has['grey'] + !has['purple'] < has['blue'];
    } else {
      return !has['green'] + !has['red'] + !has['grey'] + !has['purple'] < has['blue'];
    }
  },

  checkIfGameOver: function(game) {

    // check if any player meets the critera for a forum victory
    game.players.forEach(function(player) {
      player.merchantBonus = 0;
      player.winner = false;
      if (this.meetsForumCriteria(player)) {
        game.finished = true;
        player.winner = true;
      }
    }, this);
    if (game.finished) {
      // for each material type
      for (var role in this.roles) {
        var max = 0;
        var maxIndex = -1;
        for (var i = 0; i < game.players.length; i++) {
          var count = 0;
          game.players[i].vault.forEach(function(material) {
            if (material.color == role) {
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
    return game.finished;
  },

  createDeck: function() {

    var copy1 = [{name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Amphitheatre', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Aqueduct', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Archway', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Atrium', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Basilica', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Bath', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bridge', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Catacomb', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'CircusMaximus', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Circus', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Circus', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Colosseum', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Forum', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Foundry', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Fountain', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Garden', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Gate', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'LudusMagnus', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Palace', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Prison', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'School', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Scriptorium', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Sewer', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Stairway', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Statue', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Storeroom', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Temple', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Tower', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Senate', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Villa', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Vomitorium', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Wall', color: 'grey', done: false, materials: [], selected: false, copy:1}];
    var copy2 = [], copy3 = [];
    copy1.forEach(function(card) {
      copy2.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 1});
      copy3.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 2});
    });
    // helper to shuffle the deck
    shuffle = function(array) {
      var m = array.length, t, i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }
      return array;
    }
    return shuffle(copy1.concat(copy2).concat(copy3));
  },


  // ACTIONS

  vomitorium: function(player, pool, game) {
    var vom = this.hasAbilityToUse('Vomitorium', player);
    if (vom) {
      var cards = player.hand;
      player.hand = [];
      cards.forEach(function(card) {
        pool[card.color]++;
      });
      player.actions[0].description = 'THINK';
      return game;
    }
    else return false;
  },

  romeDemands: function(player, game, data, action) {
    if (data.card.color == action.material && data.card.name !== 'Jack') {
      player.hand.splice(data.index, 1);
      game.players[action.demander].stockpile.push(data.card.color);
      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  legionary: function(player, game, data, action) {
    var card = player.hand[data.index];
    if (card.selected || card.name === 'Jack') {
      //console.log('legionary returning false');
      return false;
    }
    player.madeDemand = true;
    var bridge = this.hasAbilityToUse('Bridge', player);
    var colosseum = this.hasAbilityToUse('Colosseum', player);
    var color = card.color;
    if (game.pool[color] > 0) {
      game.pool[color]--;
      player.stockpile.push(color);
    }
    for (var i = (game.currentPlayer + 1) % game.players.length; i != game.currentPlayer; i = (i + 1) % game.players.length) {
      if (bridge || i === (game.currentPlayer + game.players.length - 1) % game.players.length || i === ((game.currentPlayer + 1) % game.players.length)) {
        game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + this.materials[color].toUpperCase(), demander: game.currentPlayer, material: color})
        var palisade = this.hasAbilityToUse('Palisade', game.players[i]);
        var wall = this.hasAbilityToUse('Wall', game.players[i]);
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
            if (this.roles[color] == game.players[i].clientele[j] && player.vault.length < this.vaultLimit(player)) {
              player.vault.push({visibility: 'public', color: this.roleColors[game.players[i].clientele.splice(j, 1)[0]]});
              break;
            }
          }
        }
      }
    }
    card.selected = true;
    //console.log('legionary returning true');
    return this.useAction(player, game);
  },

  prepareToLay: function(player, color, game, action, index) {
    // find the index of the single selected card the player has
    var card = player.hand[index];

    if (card.color != color && card.name != 'Statue') {
      return false;
    }

    var data = {index: index, card: card, color: color};

    return this.layFoundation(player, game, data, action);
  },

  lead: function(player, game, data, action, cards) {


    var color = data.card.color;

    var selectedCards = [];
    for (var i = 0; i < cards.length; i++) {
      selectedCards.push(player.hand[cards[i]]);
      player.hand[cards[i]].selected = true;
    }

    // check if that selection can be used to lead the selected role
    if (!this.validSelection(player, selectedCards, color)) {
      return false;
    }

    // perform the lead action
    player.actions.push({kind: this.roles[color], description: this.roles[color].toUpperCase()});
    this.addClientActions(player, color);
    if (this.hasAbilityToUse('CircusMaximus', player)) {
      this.addClientActions(player, color);
      player.doubledClients = true;
    }
    player.pending = selectedCards;

    for (var i = 0; i < game.players.length; i++) {
      if (i != game.currentPlayer) {
        game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: color})
        this.addClientActions(game.players[i], color);
      }
    }
    for (var i = 0; i < player.hand.length; i++) {
      if (player.hand[i].selected) {
        player.hand.splice(i--, 1);
      }
    }
    game.currentAction = color;
    return this.useAction(player, game);
  },

  follow: function(player, game, data, action, cards) {



    var color = data.card.color;
    // extract the cards the player has selected
    var selectedCards = [];
    for (var i = 0; i < cards.length; i++) {
      selectedCards.push(player.hand[cards[i]]);
      player.hand[cards[i]].selected = true;
    }

    if (action.color == color && this.validSelection(player, selectedCards, color)) {
      player.actions.push({kind: this.roles[color], description: this.roles[color].toUpperCase()});
      if (this.hasAbilityToUse('CircusMaximus', player)) {
        this.addClientActions(player, color);
        player.doubledClients = true;
      }
      player.pending = selectedCards;
      for (var i = 0; i < player.hand.length; i++) {
        if (player.hand[i].selected) {
          player.hand.splice(i--, 1);
        }
      }
      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  layFoundation: function(player, game, data, action) {
    var tower = this.hasAbilityToUse('Tower', player);
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

      this.addThinkIfPlayerHasAcademy(player, action);

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

      if (this.allSitesUsed(game.sites, game.players.length)) {
        game.finished = true;
      }
      // check if they have the stairway
      var stairway = this.hasAbilityToUse('Stairway', player);

      return (stairway && !action.usedStairway && action.kind === 'Architect') ? game : this.useAction(player, game);
    } else {
      return false;
    }
  },

  think: function(player, game) {
    // check latrine

    this.checkLatrine(player, game.pool);

    player.hand.push(game.deck.pop());
    while (player.hand.length < this.handLimit(player) && game.deck.length > 0) {
      player.hand.push(game.deck.pop());
    }
    if (game.deck.length < 1) { game.finished = true };
    return this.useAction(player, game);
  },

  drawOne: function(player, game) {
    this.checkLatrine(player, game.pool);
    
    player.hand.push(game.deck.pop());
    if (game.deck.length < 1) { game.finished = true };
    return this.useAction(player, game);
  },

  takeJack: function(player, game) {
    if (game.pool.black > 0) {
      this.checkLatrine(player, game.pool);
      player.hand.push({name: 'Jack', color: 'black'});
      game.pool.black--;
      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  patron: function(player, color, pool, data, action, game) {
    if (player.clientele.length < this.clienteleLimit(player)) {

      var bath = this.hasAbilityToUse('Bath', player);
      var aqueduct = this.hasAbilityToUse('Aqueduct', player);
      var bar = this.hasAbilityToUse('Bar', player);

      if (
          pool
      &&  pool[color]
      && !action.takenFromPool) 
      {
        player.clientele.push(this.roles[color]);
        pool[color]--;
        action.takenFromPool = true;
        if (bath) {
          action.involvesBath = true;
          if (action.takenFromHand && action.takenFromDeck) player.actions.shift();
          player.actions.splice(0, 0, {kind: this.roles[color], description: this.roles[color].toUpperCase()});
          return game;
        }
        return ((!bar || !!action.takenFromDeck) && (!aqueduct || !!action.takenFromHand)) ? this.useAction(player, game) : game;
      } 
      else if (
          data
      &&  data.card
      &&  data.card.name !== 'Jack'
      && !action.takenFromHand
      &&  aqueduct) 
      {
        player.clientele.push(this.roles[data.card.color]);
        player.hand.splice(data.index, 1);
        action.takenFromHand = true;
        if (bath) {
          action.involvesBath = true;
          if (action.takenFromPool && action.takenFromDeck) player.actions.shift();
          player.actions.splice(0, 0, {kind: this.roles[data.card.color], description: this.roles[data.card.color].toUpperCase()});
          return game;
        }
        return (!!action.takenFromPool && (!bar || !!action.takenFromDeck)) ? this.useAction(player, game) : game;
      }
      else if (
          data
      &&  data.deck
      &&  data.deck.length > 0
      && !action.takenFromDeck
      &&  bar)
      {
        var col = data.deck.pop().color;
        player.clientele.push(this.roles[col]);
        if (data.deck.length == 0) data.game.finished = true;
        action.takenFromDeck = true;
        if (bath) {
          action.involvesBath = true;
          if (action.takenFromPool && action.takenFromHand) player.actions.shift();
          player.actions.splice(0, 0, {kind: this.roles[col], description: this.roles[col].toUpperCase()});
          return game;
        }
        return (!!action.takenFromPool && (!aqueduct || !!action.takenFromHand)) ? this.useAction(player, game) : game;
      }
    }
    return false;
  },

  laborer: function(player, color, pool, data, action, game) {
    var dock = this.hasAbilityToUse('Dock', player);
    if (
        pool
    &&  pool[color]
    && !action.takenFromPool)
    {
      player.stockpile.push(color);
      pool[color]--;
      action.takenFromPool = true;
      return (!dock || !!action.takenFromHand) ? this.useAction(player, game) : game;
    }
    else if (
        data
    &&  data.card.name !== 'Jack'
    && !action.takenFromHand
    &&  dock) 
    {
      player.stockpile.push(data.card.color);
      player.hand.splice(data.index, 1);
      action.takenFromHand = true;
      return !!action.takenFromPool ? this.useAction(player, game) : game;
    }
    return false;
  },

  fillStructureFromHand: function(structure, player, data, game, action) {
    if (this.canAddToStructure(structure, player, data.card.color, game, action)) {

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
      this.checkIfComplete(structure, player, game, 'Craftsman');

      this.addThinkIfPlayerHasAcademy(player,{kind:'Craftsman'});

      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  fillStructureFromStockpile: function(structure, player, data, game, action) {
    if (this.canAddToStructure(structure, player, data.material, game, action)) {
      structure.materials.push(data.material);
      player.stockpile.splice(data.index, 1);

      this.checkIfComplete(structure, player, game, 'Architect');

      if (this.hasAbilityToUse('Stairway', player)) {
        return (!!action.usedRegularArchitect && !!action.usedStairway) ? this.useAction(player, game) : game;
      } 
      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  fillStructureFromPool: function(structure, player, color, game, action) {
    if (this.canAddToStructure(structure, player, color, game, action)) {
      structure.materials.push(color);
      game.pool[color]--;

      this.checkIfComplete(structure, player, game, 'Architect');

      if (this.hasAbilityToUse('Stairway', player)) {
        return (!!action.usedRegularArchitect && !!action.usedStairway) ? this.useAction(player, game) : game;
      } 

      return this.useAction(player, game);
    } else {
      return false;
    }
  },

  merchant: function(player, data, action, game) {
    if (player.vault.length < this.vaultLimit(player)) {

      var basilica = this.hasAbilityToUse('Basilica', player);
      var atrium = this.hasAbilityToUse('Atrium', player);

      if (
          data.material
      && !action.takenFromStockpile)
      {
        player.vault.push({visibility: 'public', color: data.material});
        player.stockpile.splice(data.index, 1);
        action.takenFromStockpile = true;
        return (!basilica || !!action.takenFromHand) ? this.useAction(player, game) : game;
      }
      else if (
          data.card
      &&  data.card.name !== 'Jack'
      && !action.takenFromHand
      &&  basilica)
      {
        player.vault.push({visibility: 'owner', color: data.card.color});
        player.hand.splice(data.index, 1);
        action.takenFromHand = true;
        return !!action.takenFromStockpile ? this.useAction(player, game) : game;
      }
      else if (
          atrium
      &&  data.deck
      &&  data.deck.length > 0
      && !action.takenFromStockpile)
      {
        player.vault.push({visibility: 'none', color: data.deck.pop().color});
        if (data.deck.length == 0) data.game.finished = true;
        action.takenFromStockpile = true;
        return (!basilica || !!action.takenFromHand) ? this.useAction(player, game) : game;
      }
    }
    return false;
  },

  prison: function(player, building, opponent, index, game) {
    // check if player has already layed that building
    var different = true;
    player.buildings.forEach(function(b) {
      if (building.name === b.name) {
        different = false;
      }
    }, this);
    if (different == false) { return false };

    if (building.done) {
      player.buildings.push(building);
      if (building.name === 'CircusMaximus' && !player.doubledClients && player.pending.length) this.addClientActions(player, game.currentAction);
      if (!player.influenceModifier) player.influenceModifier = -3;
      else player.influenceModifier -= 3;
      opponent.buildings.splice(index, 1);
      if (!opponent.influenceModifier) opponent.influenceModifier = 3 + (!building.stolen ? this.colorValues[building.siteColor] : 0);
      else opponent.influenceModifier += (3 + (!building.stolen ? this.colorValues[building.siteColor] : 0));
      building.stolen = true;
    } 
    return building.done ? this.useAction(player, game) : false;
  },

  fountain: function(player, deck, game, action) {
    if (
        this.hasAbilityToUse('Fountain', player)
    && !action.usedFountain) 
    {
      action.usedFountain = true;
      var card = deck.pop();
      card.selected = true;
      player.hand.push(card);
      if (deck.length <= 0) game.finished = true;
    }
    return false;
  },

  sewer: function(player, data, game) {
    if (player.pending[data.index].color == 'black') return false;
    var card = player.pending.splice(data.index, 1)[0];
    player.stockpile.push(data.card.color);
    return player.pending.length == 0 ? this.useAction(player, game) : game;
  },

  // uses action of current player and determines who is to act next
  useAction: function(player, game) {


    
    // spend action of current player
    var action = player.actions.shift();

    // deal with any bath patrons that are waiting
    var act = player.actions[0];
    while (
        act
    &&  act.involvesBath
    &&  act.takenFromPool
    && (act.takenFromHand || !this.hasAbilityToUse('Aqueduct', player))
    && (act.takenFromDeck || !this.hasAbilityToUse('Bar', player)))
    {
      player.actions.shift();
      act = player.actions[0];
    }
    var newAction = player.actions[0];
    // if the player has no actions left, find next player to act
    if (newAction == undefined) {

      // check if you have used an academy
      if (player.usedAcademy) {
        player.usedAcademy = false;
      }
      // check if the player has a sewer
      if (this.hasAbilityToUse('Sewer', player) && player.pending[0] && !player.usedSewer) {
        player.actions.push({kind:'Sewer', description:'SEWER'});
        player.usedSewer = true
        if (action.kind == 'Legionary') {
          player.madeDemand = false;
          return this.nextToAct(game);
        } else {
          return game;
        }
      }
      if (action && action.kind === 'Rome Demands') {
        // look for next player with rome demands action
        // for each player after the current player
        for (var i = game.currentPlayer + 1; i < game.currentPlayer + game.players.length; i++) {
          // if that player has a rome demands action, it is them to play
          var a = game.players[i % game.players.length].actions[0];
          if (a && a.kind === 'Rome Demands') {
            game.currentPlayer = i % game.players.length;
            return game;
          }
        }
      }
      player.usedSewer = false;
      return this.nextToAct(game);
    }

    // if they just used a rome demands action, and the next action is not a rome demands,
    // play goes to next player with an action
    if (action.kind == 'Rome Demands' && newAction.kind != 'Rome Demands') {
      // look for next player with rome demands action
      // for each player after the current player
      for (var i = game.currentPlayer + 1; i < game.currentPlayer + game.players.length; i++) {
        // if that player has a rome demands action, it is them to play
        var a = game.players[i % game.players.length].actions[0];
        if (a && a.kind === 'Rome Demands') {
          game.currentPlayer = i % game.players.length;
          return game;
        }
      }
      return this.nextToAct(game);
    }

    // if the player just used a legionary action, whether skipping or not, 
    // and has made at least one demand in the current batch of legionary actions,
    // play moves so the other players can respond to the demand
    if (action.kind == 'Legionary' && player.madeDemand && newAction.kind != 'Legionary') {
      player.madeDemand = false;
      return this.nextToAct(game);
    }

    // if they have just led or followed or used the vomitorium, they dont go again
    if (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Jack') {
      return this.nextToAct(game);
    }

    return game;
  },

  // sets the current player to the next player with actions, 
  // or advances to the next turn if there is none
  nextToAct: function(game) {



    game.players[game.currentPlayer].hand.forEach(function(card) {
      card.selected = false;
    }, this);

    var current = game.currentPlayer;
    var players = game.players;
    // for each player after the current player
    for (var i = current + 1; i <= current + players.length; i++) {
      // if that player has an action, it is them to play
      if (players[i % players.length].actions[0] != undefined) {
        game.currentPlayer = i % players.length;
        return game;
      }
    }

    // move on the leader
    game.leader = (game.leader + 1) % players.length;
    game.currentPlayer = game.leader;
    players[game.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});

    // check for senates and pass on jacks
    for (var i = 0; i < game.players.length; i++) {
      game.players[i].doubledClients = false;
      for (var j = 0; j < game.players[i].pending.length; j++) {
        if (game.players[i].pending[j].name == 'Jack') {
          for (var k = (i + 1) % game.players.length; k != i; k = (k + 1) % game.players.length) {
            if (this.hasAbilityToUse('Senate', game.players[k])) {
              var card = game.players[i].pending.splice(j, 1)[0];
              card.selected = false;
              game.players[k].hand.push(card);
              j--;
              break;
            }
          }
        }
      }
    }
    game.players.forEach(function(player) {
      player.pending.forEach(function(card) {
        game.pool[card.color]++; 
      });
      player.pending = [];
    });


    return game;
  },

  visibleState: function(game) {
    // return the game state as observed by the current player
    // i.e. the number of cards in the deck, cards in opponents hands, buildings, visible vaults etc.
    var player = game.players[game.currentPlayer];
    var playerVault = [];
    player.vault.forEach(function(material) {
      if (material.visibility !== 'none') playerVault.push(material.color);
    });

    var visiblePlayer = {
      name: player.name,
      buildings: player.buildings,
      hand: player.hand.map(function(card) {
        return {
          name: card.name,
          color: card.color
        }
      }),
      stockpile: player.stockpile,
      clientele: player.clientele,
      clienteleLimit: actions.clienteleLimit(player),
      vaultLength: player.vault.length,
      visibleVault: playerVault,
      vaultLimit: actions.vaultLimit(player),
      actions: player.actions,
      pending: player.pending.map(function(pending) {
        return {
          color: pending.color
        }
      })
    };

    var visibleOpponent = function(opponent) {
      var jacks = 0;
      opponent.hand.forEach(function(card) {
        if (card.name === 'Jack') jacks++;
      });

      var opponentVault = [];
      opponent.vault.forEach(function(material) {
        if (material.visiblity === 'public') opponentVault.push(material.color);
      });

      return {
        name: opponent.name,
        buildings: opponent.buildings,
        handLength: opponent.hand.length,
        jacks: jacks,
        stockpile: opponent.stockpile,
        clientele: opponent.clientele,
        clienteleLimit: actions.clienteleLimit(opponent),
        vaultLength: opponent.vault.length,
        visibleVault: opponentVault,
        vaultLimit: actions.vaultLimit(player),
        actions: opponent.actions,
        pending: opponent.pending.map(function(pending) {
          return {
            color: pending.color
          }
        })
      }
    };

    var players = [];
    for (var i = 0; i < game.players.length; i++) {
      if (i === game.currentPlayer) {
        players.push(visiblePlayer);
      } else {
        players.push(visibleOpponent(game.players[i]));
      }
    }

    return {
      players: players,
      pool: game.pool,
      sites: game.sites,
      leader: game.leader,
      currentPlayer: game.currentPlayer,
      deckLength: game.deck.length,
      room: game.room
    };
  },

  applyMove: function(move, game) {

    var player = game.players[game.currentPlayer];

    if (typeof angular !== 'undefined') {
      var data = angular.toJson({name: player.name, move: move, game: this.visibleState(game)});
    }

    var a = this;

    var newState = {
      'Refill': 
        function() { return a.think(player, game) },
      'Draw One': 
        function() { return a.drawOne(player, game) },
      'Take Jack': 
        function() { return a.takeJack(player, game) },
      'Vomitorium': 
        function() { return a.vomitorium(player, game.pool, game) },
      'Lead': 
        function() { return a.lead(player, game, {card:{name: '', color: move.role}}, player.actions[0], move.cards) },
      'Patron': 
        function() { return a.patron(player, move.color, game.pool, null, player.actions[0], game) },
      'Aqueduct': 
        function() { return a.patron(player, null, null, move.data, player.actions[0], game) },
      'Bar': 
        function() { return a.patron(player, null, null, {deck: game.deck, game: game}, player.actions[0], game) },
      'Merchant': 
        function() { return a.merchant(player, move.data, player.actions[0], game) },
      'Atrium': 
        function() { return a.merchant(player, {deck: game.deck, game: game}, player.actions[0], game) },
      'Basilica': 
        function() { return a.merchant(player, move.data, player.actions[0], game) },
      'Laborer': 
        function() { return a.laborer(player, move.color, game.pool, null, player.actions[0], game) },
      'Dock': 
        function() { return a.laborer(player, null, null, move.data, player.actions[0], game) },
      'Fill from Hand': 
        function() { return a.fillStructureFromHand(player.buildings[move.building], player, move.data, game, player.actions[0]) },
      'Fill from Stockpile': 
        function() { return a.fillStructureFromStockpile(game.players[move.player].buildings[move.building], player, move.data, game, player.actions[0]) },
      'Fill from Pool': 
        function() { return a.fillStructureFromPool(game.players[move.player].buildings[move.building], player, move.color, game, player.actions[0]) },
      'Lay': 
        function() { return a.prepareToLay(player, move.color, game, player.actions[0], move.index) },
      'Fountain': 
        function() { return a.fountain(player, game.deck, game, player.actions[0]) },
      'Follow': 
        function() { return a.follow(player, game, {card:{name: '', color: player.actions[0].color}}, player.actions[0], move.cards) },
      'Legionary': 
        function() { return a.legionary(player, game, move.data, player.actions[0]) },
      'Rome Demands': 
        function() { return a.romeDemands(player, game, move.data, player.actions[0]) },
      'Prison': 
        function() { return a.prison(player, move.building, move.opponent, move.index, game) },
      'Sewer': 
        function() { return a.sewer(player, move.data, game) },
      'Skip': 
        function() { return a.useAction(player, game) }
    }[move.kind]();

    if (newState) {
      actions.checkIfGameOver(newState);
    }

    // if move was valid, store it in the database
    if (typeof angular !== 'undefined' && newState) {
      $.ajax( { url: "https://api.mlab.com/api/1/databases/moves/collections/Moves?apiKey=B7VeiL13HNY2oYoAiedtMr6YNaxczG3f",
        data: data,
        type: "POST",
        contentType: "application/json" } );
    }

    if (typeof angular !== 'undefined' && newState && newState.finished) {
      // get the winner's name
      var winner = 0;
      var maxScore = 0;
      var maxHand = -1;
      for (var i = 0; i < newState.players.length; i++) {
        var p = newState.players[i];
        if (p.winner) {
          winner = i;
          break;
        } else if (this.score(p) > maxScore || (this.score(p) === maxScore && p.hand.length > maxHand)) {
          winner = i;
          maxScore = this.score(p);
          maxHand = p.hand.length;
        }
      }

      // store winner in database
      $.ajax( { url: "https://api.mlab.com/api/1/databases/moves/collections/winners?apiKey=B7VeiL13HNY2oYoAiedtMr6YNaxczG3f",
        data: angular.toJson({room: newState.room, winner: newState.players[winner].name}),
        type: "POST",
        contentType: "application/json" } );

    }

    return newState;

  }
};

if (typeof angular !== 'undefined') angular.module('GTR').factory('actions', function ($rootScope) {

  // the game state (starts with just one player)
  $rootScope.game = 
    {
      players:
        [
          {
            name: "",
            buildings: [],
            hand: [],
            stockpile: [],
            clientele: [],
            vault: [],
            // a list of the actions the player has yet to use this turn
            actions: [],
            // the cards the player used to lead or follow
            pending: [],
            publicBuildings: []
          }
        ],
      pool:
        {
          'yellow': 0,
          'green': 0,
          'red': 0,
          'grey': 0,
          'purple': 0,
          'blue': 0,
          // the number of jacks available
          'black': 6
        },
      deck: actions.createDeck(),
      sites: 
        {
          'yellow': 6,
          'green': 6,
          'red': 6,
          'grey': 6,
          'purple': 6,
          'blue': 6
        },
      // tracks the number of updates to the game state that have been sent
      turn: 0,
      started: false,
      created: false,
      finished: false,
      // the access-code/socket-io-room for the game
      room: "",
      // the index of you in the list of players
      leader: 0,
      currentPlayer: 0, 
      name: "",
      // the index of any player that has said "glory to rome" this turn, if any
      glory: -1
    };

  $rootScope.meta = {you: 0};

  $rootScope.hasStairway = function(player) {
    return actions.hasAbilityToUse('Stairway', player);
  }

  $rootScope.hasAbilityToUseWithoutPublicBuildings = function(name, player) {
    return actions.hasAbilityToUseWithoutPublicBuildings(name, player);
  }

  $rootScope.hasAbilityToUse = function(building, player) {
    return actions.hasAbilityToUse(building, player);
  };

  $rootScope.influence = function(player) {
    return actions.influence(player);
  }

  $rootScope.hasArchway = function(player) {
    return !!actions.hasAbilityToUse('Archway', player);
  }

  $rootScope.score = function(player) {
    return actions.score(player);
  };

  $rootScope.clienteleLimit = function(player) {
    return actions.clienteleLimit(player);
  };

  $rootScope.vaultLimit = function(player) {
    return actions.vaultLimit(player);
  }
  return actions;
});
else if (typeof module !== 'undefined') module.exports = actions;

