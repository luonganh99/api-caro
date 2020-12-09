const userSocketIdMap = new Map();

const addClientToMap = (username, socketId) => {
  if (!userSocketIdMap.has(username)) {
    // joining for the first time
    userSocketIdMap.set(username, new Set([socketId]));
  } else {
    // user has already joined from one client and now joining using another client
    userSocketIdMap.get(username).add(socketId);
  }
};

const removeClientFromMap = (username, socketId) => {
  if (userSocketIdMap.has(username)) {
    let userSocketIdSet = userSocketIdMap.get(username);
    userSocketIdSet.delete(socketId);

    // if there are no client for users, remove user
    if (userSocketIdSet.size === 0) {
      userSocketIdMap.delete(username);
    }
  }
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    console.log(username + ' has connected');

    socket.on('online', () => {
      addClientToMap(username, socket.id);
      console.log(userSocketIdMap);

      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });

    socket.on('offline', () => {
      console.log(username + ' has disconnected');
      removeClientFromMap(username, socket.id);
      console.log(userSocketIdMap);
      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });

    socket.on('disconnect', () => {
      console.log(username + ' has disconnected');
      removeClientFromMap(username, socket.id);
      console.log(userSocketIdMap);
      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });
  });
};
