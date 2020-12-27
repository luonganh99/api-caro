const { v4: uuidv4 } = require('uuid');

const { HEIGHT } = require('../config/boardSize.config');
const BoardModel = require('../models/board.model');
const MovingHistoryModel = require('../models/movingHistory.model');
const ChatModel = require('../models/chat.model');
const getDateNow = require('../utils/getDateNow');

/* ------------- ONLINE LIST -------------- */
const onlineList = new Map();
const addUser = (username, socketId) => {
  if (!onlineList.has(username)) {
    // joining for the first time
    onlineList.set(username, new Set([socketId]));
  } else {
    // user has already joined from one client and now joining using another client
    onlineList.get(username).add(socketId);
  }
};

const removeUser = (username, socketId) => {
  if (onlineList.has(username)) {
    let userSocketIdSet = onlineList.get(username);
    userSocketIdSet.delete(socketId);

    // if there are no client for users, remove user
    if (userSocketIdSet.size === 0) {
      onlineList.delete(username);
    }
  }
};

/* ------------- ROOM LIST -------------- */
const roomList = {};
const addRoom = (hostname, avatar, cups, socketId) => {
  const roomId = uuidv4();
  roomList[roomId] = {
    host: {
      username: hostname,
      avatar,
      cups,
      socketIds: [socketId],
      isReady: false,
    },
    guest: {
      username: null,
      avatar: null,
      cups: null,
      socketIds: [],
      isReady: false,
    },
    viewers: [],
    config: {
      time: 20,
    },
    boardId: null,
    password: null,
  };
  return roomId;
};

const joinRoom = (roomId, username, avatar, cups, socketId) => {
  let { host, guest, viewers } = roomList[roomId];
  if (host.username === username) {
    host.socketIds = [...new Set([...host.socketIds, socketId])];
  } else if (guest.username === null) {
    guest.username = username;
    guest.socketIds = [socketId];
    guest.avatar = avatar;
    guest.cups = cups;
  } else if (guest.username === username) {
    guest.socketIds = [...new Set([...guest.socketIds, socketId])];
  } else {
    viewers.push({
      username,
      avatar,
      socketIds: [socketId],
    });
  }
  return roomList[roomId];
};

const updateReady = (roomId, isHost, isReady) => {
  const room = roomList[roomId];
  if (isHost) {
    room.host.isReady = isReady;
  } else {
    room.guest.isReady = isReady;
  }
  return room;
};

const updateBoard = (roomId, boardId) => {
  const room = roomList[roomId];
  room.boardId = boardId;
  return room;
};

const updateRoom = (roomId, cups, isHost) => {
  const room = roomList[roomId];
  room.host.isReady = false;
  room.guest.isReady = false;
  if (isHost) {
    room.host.cups = parseInt(room.host.cups) + parseInt(cups);
    room.guest.cups = parseInt(room.guest.cups) - parseInt(cups);
  } else {
    room.host.cups = parseInt(room.host.cups) - parseInt(cups);
    room.guest.cups = parseInt(room.guest.cups) + parseInt(cups);
  }
  return room;
};

const leaveRoom = (roomId, isHost, isViewer, username) => {
  const room = roomList[roomId];
  if (isViewer) {
    room.viewers = room.viewers.filter((item) => item.username !== username);
    return room;
  }
  if (isHost) {
    room.host = {
      username: room.guest.username,
      socketIds: [...room.guest.socketIds],
      isReady: false,
    };
  }

  room.guest = {
    username: null,
    socketIds: [],
    isReady: false,
  };

  room.boardId = null;

  return room;
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    const avatar = socket.handshake.query.avatar;
    const cups = socket.handshake.query.cups;
    console.log(username + ' has connected');

    socket.on('getOnlineUserReq', () => {
      io.emit('getOnlineUserRes', Array.from(onlineList));
    });

    socket.on('online', () => {
      addUser(username, socket.id);
      console.log(onlineList);

      io.emit('getOnlineUserRes', Array.from(onlineList));
    });

    socket.on('offline', () => {
      console.log(username + ' has disconnected');
      removeUser(username, socket.id);
      console.log(onlineList);
      io.emit('getOnlineUserRes', Array.from(onlineList));
    });

    socket.on('createRoom', async () => {
      const roomId = addRoom(username, avatar, cups, socket.id);
      // TODO: Emit to everyone roomlist
      // socket.broadcast.emit('newRoom', )

      // TODO: Emit to sender to join room
      io.to(socket.id).emit('joinRoom', roomId);
      console.log('create room list ', roomList);
    });

    socket.on('joinRoom', (roomId) => {
      socket.join(`${roomId}`);

      const roomInfo = joinRoom(roomId, username, avatar, cups, socket.id);
      console.log(roomInfo);
      // TODO: Emit to everyone room list updated

      // TODO: Emit everyone in room about room info
      io.in(`${roomId}`).emit('getRoomInfo', roomInfo);

      console.log(`Host ${username} has joined room ${roomId}`);
      console.log('Room list ', roomList);
    });

    socket.on('updateReady', ({ roomId, isHost, isReady }) => {
      const roomInfo = updateReady(roomId, isHost, isReady);

      socket.to(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('updateBoard', ({ roomId, boardId }) => {
      const roomInfo = updateBoard(roomId, boardId);

      socket.to(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    // socket.on('joinBoard', async (boardId) => {
    //   try {
    //     const board = await BoardModel.findById(boardId);

    //     if (board.hostname == username) {
    //       console.log(`Host ${username} has joined board ${boardId}`);
    //       socket.join(`${boardId}`);
    //     } else if (board.guestname == username) {
    //       socket.join(`${boardId}`);
    //       console.log(`Guest ${username} has joined board ${boardId}`);
    //     } else if (board.guestname === null) {
    //       await BoardModel.update({ guestname: username }, { boardId });
    //       socket.join(`${boardId}`);
    //       console.log(`Guest ${username} has joined board ${boardId}`);
    //     }
    //   } catch (error) {
    //     console.log(error);
    //   }
    // });

    socket.on('moveChessman', async ({ roomId, boardId, chessman, pos }) => {
      console.log(`${username} move chessman`);
      //TODO: save move to database

      try {
        await MovingHistoryModel.create({
          boardId,
          position: `${pos.x}-${pos.y}`,
          createdAt: getDateNow(),
          sender: username,
        });
      } catch (error) {
        console.log(error);
      }
      // const index = pos.x * HEIGHT + pos.y;
      // let battleArray = '';
      // try {
      //   await BoardModel.update({battleArray }, {boardId})
      // } catch (error) {
      //   console.log(error);
      // }

      socket.to(`${roomId}`).emit('newMoveChessman', { chessman, pos, sender: username });
    });

    socket.on('sendMessage', (data) => {
      const { boardId, content, roomId } = data;
      console.log('message ', data);
      //save chat to db
      ChatModel.create({ sender: username, boardId, message: content, createdAt: getDateNow() });

      socket.to(`${roomId}`).emit('newMessage', { sender: username, content });
    });

    socket.on('leaveRoom', ({ roomId, isHost, isViewer }) => {
      const roomInfo = leaveRoom(roomId, isHost, isViewer, username);
      console.log(roomList);
      socket.leave(`${roomId}`);
      socket.to(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('updateRoom', ({ roomId, newCups, isHost }) => {
      const roomInfo = updateRoom(roomId, newCups, isHost);
      io.in(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('disconnect', () => {
      // TODO: Leave room
      console.log(username + ' has disconnected');
      removeUser(username, socket.id);
      console.log(onlineList);
      io.emit('getOnlineUserRes', Array.from(onlineList));
    });
  });
};
