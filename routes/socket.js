module.exports = function(socket) {
  socket.emit('message', {
    newMessage: 'Susan'
  });
};