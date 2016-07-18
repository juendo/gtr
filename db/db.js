var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = require('./password');

var queries = require('./queries');

var findDocuments = function(db, callback) {
  // Get the documents collection
  var moves = db.collection('Moves');
  // Find some documents

  // remove undesired names
  //moves.remove(queries.delete_names);

  //moves.update({name:"kmac"}, {$set: {name:"Kmac"}}, {multi:true});
  // rename
  //moves.update({"game.room": "f57q7y"}, {$set: {winner: "Hendo"}}, {multi: true});

 //console.log(queries.move_list.translateMove({kind: "Skip"}, {}));

  //moves.mapReduce(queries.move_list.map, queries.move_list.reduce, {out: 'move_list'});

  db.collection('ms').aggregate([]).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log(JSON.stringify(docs));
    callback(docs);
  });
  /*db.collection('move_list').aggregate([
    {
      $project: {
        move: '$_id.move',
        value: '$value',
        wins: {
          $cond: {
            if: '$_id.winning',
            then: '$value',
            else: 0
          }
        }
      }
    },
    {
      $group: {
        _id: {
          move: '$_id.move'
        },
        winning: {
          $sum: '$wins'
        },
        total: {
          $sum: '$value'
        }
      }
    },
    {
      $out: 'ms'
    }
  ]).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(JSON.stringify(docs));
    callback(docs);
  });*/
  
  /*console.log(db.collection('winners').aggregate([]).toArray(function(err, docs) {
    assert.equal(err, null);
    docs.forEach(function(doc) {
      console.log(doc.winner);
      moves.update({"game.room": doc.room}, {$set: {winner: doc.winner}}, {multi: true});
    })
  }));*/
  //moves.aggregate(queries.winning_moves).toArray(function(err, docs) {assert.equal(err, null);console.log("Found the following records");console.log(JSON.stringify(docs));callback(docs);});  
  //moves.aggregate(queries.layed).toArray(function(err, docs) {assert.equal(err, null);console.log("Found the following records");console.log(JSON.stringify(docs));callback(docs);});
}

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected succesfully to server");

  findDocuments(db, function() {
      db.close();
  });
});