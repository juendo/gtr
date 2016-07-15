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

  //moves.update({name:"kmac"}, {$set: {name:"Kmac"}}, {multi:true});
  // rename
  //moves.update({"game.room": "f57q7y"}, {$set: {winner: "Hendo"}}, {multi: true});

  moves.mapReduce(queries.winning_buildings.map, queries.winning_buildings.reduce, {out: 'winning_buildings', query: {'move.kind': 'Lay'}});

  db.collection('winning_buildings').aggregate([
    {
      $group: {
        _id: {
          winning: "$_id.winning"
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