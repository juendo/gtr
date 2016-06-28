var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://juendo:112358132134nh@ds023674.mlab.com:23674/moves';

var leadCounts = [
  	{
  		$match: {
  			"move.kind": "Lead"
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$name", 
  				role: "$move.role"
  			}, 
  			roles: {
  				$push: "$move.role" 
  			}
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$_id.name"
  			}, 
  			roles: {
  				$addToSet: {
  					role: "$_id.role", 
  					count: {
  						$size: "$roles"
  					}
  				}
  			}
  		}
  	}
  ];

// how many times each player followed a certain action
var followCounts = [
	{
		$unwind: "$game.players" 
	},
  	{
  		$match: {
  			"move.kind": "Follow"
  		}
  	},
  	{
  		$project: {
  			name: "$name",
  			playerName: "$game.players.name",
  			action: "$game.players.actions.color",
  			valid: {
  				$eq: ["$name", "$game.players.name"]
  			}
  		}
  	},
  	{
  		$match: {
  			"valid": true
  		}
  	},
  	{
  		$unwind: "$action"
  	},
  	{
  		$group: {
  			_id: {
  				name: "$name", 
  				action: "$action"
  			}, 
  			actions: {
  				$push: "$action" 
  			}
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$_id.name"
  			}, 
  			roles: {
  				$addToSet: {
  					role: "$_id.action", 
  					count: {
  						$size: "$actions"
  					}
  				}
  			}
  		}
  	}
  ];

var followChances = [
	{
		$unwind: "$game.players",
	},
	{
		$match: {
			"game.players.actions.kind": "Follow"
		}
	},
  	{
  		$project: {
  			name: "$name",
  			playerName: "$game.players.name",
  			action: "$game.players.actions.color",
  			valid: {
  				$eq: ["$name", "$game.players.name"]
  			}
  		}
  	},
  	{
  		$match: {
  			"valid": true
  		}
  	},
  	{
  		$unwind: "$action"
  	},
  	{
  		$group: {
  			_id: {
  				name: "$name", 
  				action: "$action"
  			}, 
  			actions: {
  				$push: "$action" 
  			}
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$_id.name"
  			}, 
  			roles: {
  				$addToSet: {
  					role: "$_id.action", 
  					count: {
  						$size: "$actions"
  					}
  				}
  			}
  		}
  	}
  ];

// how many times a player took each type of move for each type of action
var moveCounts = [
	{
		$unwind: "$game.players",
	},
  	{
  		$project: {
  			name: "$name",
  			move: "$move.kind",
  			action: "$game.players.actions.kind",
  			valid: {
  				$eq: ["$name", "$game.players.name"]
  			}
  		}
  	},
  	{
  		$match: {
  			"valid": true
  		}
  	},
  	{
  		$unwind: "$action"
  	},
  	{
  		$group: {
  			_id: {
  				name: "$name",
  				move: "$move",
  				action: "$action"
  			},
  			moves: {
  				$push: "$move" 
  			}
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$_id.name",
  				action: "$_id.action"
  			}, 
  			roles: {
  				$addToSet: {
  					role: "$_id.move", 
  					count: {
  						$size: "$moves"
  					}
  				}
  			}
  		}
  	},
  	{
  		$group: {
  			_id: {
  				name: "$_id.name"
  			},
  			moves: {
  				$addToSet: {
  					action: "$_id.action",
  					moves: "$roles"
  				}
  			}
  		}
  	}
  ];

var findDocuments = function(db, callback) {
  // Get the documents collection
  var moves = db.collection('Moves');
  // Find some documents
  moves.aggregate(moveCounts)
  .toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(JSON.stringify(docs));
    callback(docs);
  });
}

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected succesfully to server");

  findDocuments(db, function() {
      db.close();
  });
});