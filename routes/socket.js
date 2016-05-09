// export function for listening to the socket
module.exports = function (socket) {

  socket.on('update', function (data) {
    console.log('game');
    socket.broadcast.to(data.room).emit('change', data);
  });

  socket.on('create', function(name) {
    var gameid = (Math.random().toString(36)+'00000000000000000').slice(2, 8);
    while (!gamesList.create(gameid, name)) {
      gameid = (Math.random().toString(36)+'00000000000000000').slice(2, 8);
    }
    socket.emit('created', {gameid: gameid});
    socket.join(gameid);
  });

  socket.on('join', function(data) {
    socket.join(data.room);
    gamesList.gamePlayers[data.room].push({name:data.name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]});
    socket.emit('accepted', gamesList.gamePlayers[data.room]);
    socket.broadcast.to(data.room).emit('joined', {name:data.name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]});
  });

};

// object for maintaining the list of active games
var gamesList = (function() {

  // hash map of active games
  var games = {};
  var gamePlayers = {};

  var create = function(game, name) {
    if (!game || games[game]) {
      return false;
    } else {
      games[game] = true;
      gamePlayers[game] = [{name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}];
      return true;
    }
  }

  return {
    games: games,
    create: create,
    gamePlayers: gamePlayers
  };

}());