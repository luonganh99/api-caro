const { HEIGHT } = require('../config/boardSize.config');
const BoardModel = require('../models/board.model');

const userSocketIdMap = new Map();

const addClientToOnlineList = (username, socketId) => {
  if (!userSocketIdMap.has(username)) {
    // joining for the first time
    userSocketIdMap.set(username, new Set([socketId]));
  } else {
    // user has already joined from one client and now joining using another client
    userSocketIdMap.get(username).add(socketId);
  }
};

const removeClientFromOnlineList = (username, socketId) => {
  if (userSocketIdMap.has(username)) {
    let userSocketIdSet = userSocketIdMap.get(username);
    userSocketIdSet.delete(socketId);

    // if there are no client for users, remove user
    if (userSocketIdSet.size === 0) {
      userSocketIdMap.delete(username);
    }
  }
};

const boardRooms = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    console.log(username + ' has connected');

    socket.on('getOnlineUserReq', () => {
      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });

    socket.on('online', () => {
      addClientToOnlineList(username, socket.id);
      console.log(userSocketIdMap);

      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });

    socket.on('offline', () => {
      console.log(username + ' has disconnected');
      removeClientFromOnlineList(username, socket.id);
      console.log(userSocketIdMap);
      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });

    socket.on('joinBoard', async (boardId) => {
      try {
        const board = await BoardModel.findById(boardId);

        if (board.hostname == username) {
          console.log(`Host ${username} has joined board ${boardId}`);
          socket.join(`${boardId}`);
        } else if (board.guestname == username) {
          socket.join(`${boardId}`);
          console.log(`Guest ${username} has joined board ${boardId}`);
        } else if (board.guestname === null) {
          await BoardModel.update({ guestname: username }, { boardId });
          socket.join(`${boardId}`);
          console.log(`Guest ${username} has joined board ${boardId}`);
        }
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('moveChessman', (data) => {
      console.log(`${username} move chessman`);
      const { boardId, chessman, pos } = data;
      console.log(data);
      //TODO: save move to database
      // const index = pos.x * HEIGHT + pos.y;
      // let battleArray = '';
      // try {
      //   await BoardModel.update({battleArray }, {boardId})
      // } catch (error) {
      //   console.log(error);
      // }

      socket.to(`${boardId}`).emit('newMoveChessman', { chessman, pos });
    });

    socket.on('leaveBoard', () => {
      //TODO: delete user when leave board
    });

    socket.on('sendMessage', (data) => {
      const { boardId, content } = data;

      socket.to(`${boardId}`).emit('newMessage', { sender: username, content });
    });

    socket.on('disconnect', () => {
      console.log(username + ' has disconnected');
      removeClientFromOnlineList(username, socket.id);
      console.log(userSocketIdMap);
      io.emit('getOnlineUserRes', Array.from(userSocketIdMap));
    });
  });
};
