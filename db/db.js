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
  moves.remove(queries.delete_names);

  // rename
  //moves.update({"game.room": "f57q7y"}, {$set: {winner: "Hendo"}}, {multi: true});

  moves.mapReduce(queries.layed.map, queries.layed.reduce, {out: 'layed', query: {'move.kind': 'Lay'}});

  db.collection('layed').aggregate([
    {
      $group: {
        _id: {
          name: "$_id.name"
        },
        buildings: {
          $push: {
            name: "$_id.building",
            count: "$value"
          }
        }
      }
    }
  ]).toArray(function(err, docs) {assert.equal(err, null);console.log("Found the following records");console.log(JSON.stringify(docs));callback(docs);});

  //moves.aggregate(queries.names).toArray(function(err, docs) {assert.equal(err, null);console.log("Found the following records");console.log(JSON.stringify(docs));callback(docs);});  
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