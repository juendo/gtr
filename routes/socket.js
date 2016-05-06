// export function for listening to the socket
module.exports = function (socket) {

  socket.broadcast.emit('addPlayer', {
    player:{ 
          buildings: [],
          hand: [],
          stockpile: [],
          clientele: [],
          vault: [],
          actions: [],
          pending: []
        }
  });

	socket.on('update', function (data) {
    console.log('game');
    socket.broadcast.emit('change', data);
  });

};









