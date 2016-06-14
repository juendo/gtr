'use strict'

// export function for listening to the socket
module.exports = function (io) {

  var s = function(socket) {
    socket.on('update', function (data) {
      socket.join(data.room);
      if (data.ai) {
        setTimeout(function() {
          var moves = require('./moves');
          data.move = moves(data.game, data.currentPlayer);
          socket.emit('change', data);
          socket.broadcast.to(data.room).emit('change', data);
          if (gamesList.gamePlayers[data.room]) {
            delete gamesList.gamePlayers[data.room];
          }
        }, 3000);
      } else {
        socket.broadcast.to(data.room).emit('change', data);
        if (gamesList.gamePlayers[data.room]) {
          delete gamesList.gamePlayers[data.room];
        }
      }
    });

    socket.on('create', function(name) {
      if (
          name.length > 0 
      &&  name.length <= 15) 
      {
        var gameid = (Math.random().toString(36)+'00000000000000000').slice(2, 8);
        while (io.sockets.adapter.rooms[gameid]) {
          gameid = (Math.random().toString(36)+'00000000000000000').slice(2, 8);
        }
        gamesList.gamePlayers[gameid] = [name];
        socket.emit('created', {gameid: gameid});
       
        socket.join(gameid);
        console.log(gameid);
      }
    });

    socket.on('add ai', function(data) {
      if (
          gamesList.gamePlayers[data.room]
      &&  io.sockets.adapter.rooms[data.room] 
      &&  Object.keys(io.sockets.adapter.rooms[data.room]).length < 3) {
        gamesList.gamePlayers[data.room].push('AI');
        socket.emit('ai joined', 'AI');
        socket.broadcast.to(data.room).emit('ai joined', 'AI');
      }
    });

    socket.on('join', function(data) {
      if (
          gamesList.gamePlayers[data.room]
      &&  io.sockets.adapter.rooms[data.room] 
      &&  Object.keys(io.sockets.adapter.rooms[data.room]).length < 3 
      &&  data.name.length > 0 && data.name.length <= 15) 
      {
        socket.join(data.room);
        gamesList.gamePlayers[data.room].push(data.name);
        socket.emit('accepted', gamesList.gamePlayers[data.room]);
        socket.broadcast.to(data.room).emit('joined', data.name);
      }
    });

    // get the most recent game state
    socket.on('reconnection', function(data) {
      socket.join(data.room);
      socket.broadcast.to(data.room).emit('change', data);
    });
  }
  return s;
};

// object for maintaining the list of active games
var gamesList = (function() {

  var gamePlayers = {};

  return {
    gamePlayers: gamePlayers
  };

}());

