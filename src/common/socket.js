const { v4: uuidv4 } = require('uuid');

const { HEIGHT } = require('../config/boardSize.config');
const UserModel = require('../models/user.model');
const BoardModel = require('../models/board.model');
const MovingHistoryModel = require('../models/movingHistory.model');
const ChatModel = require('../models/chat.model');
const getDateNow = require('../utils/getDateNow');
const CUP_DIFFERENCES = require('../config/game.config');

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
const countDownList = {};
const addRoom = (hostname, avatar, cups, socketId, config = { password: null, time: 45 }) => {
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
    config,
    board: {
      boardId: null,
      timeRemaining: config.time,
      squares: Array(HEIGHT).fill(Array(HEIGHT).fill(null)),
      listHistoryItem: [],
      turn: 'X',
    },
  };
  return roomId;
};

const checkRoom = (roomId, password) => {
  if (!roomList.hasOwnProperty(roomId)) {
    return {
      status: 'error',
      type: 'wrongRoomId',
    };
  }
  const { config } = roomList[roomId];

  if (config.password && config.password !== password) {
    return {
      status: 'error',
      type: 'wrongPassword',
    };
  }

  return true;
};

const joinRoom = (roomId, username, avatar, cups, password, socketId) => {
  if (!roomList.hasOwnProperty(roomId)) {
    return {
      status: 'error',
      type: 'wrongRoomId',
    };
  }

  let { host, guest, viewers, config } = roomList[roomId];

  if (config.password && config.password !== password) {
    return {
      status: 'error',
      type: 'wrongPassword',
    };
  }

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
  return {
    status: 'success',
    data: {
      roomInfo: roomList[roomId],
    },
  };
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
  room.board.boardId = boardId;
  room.host.isReady = false;
  room.guest.isReady = false;

  countDownList[roomId] = setInterval(() => {
    room.board.timeRemaining -= 1;
    console.log(room.board.timeRemaining);
  }, 1000);

  return room;
};

const moveChessman = async (roomId, boardId, username, pos, squares, listHistoryItem, turn) => {
  // Insert to moving history
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

  const room = roomList[roomId];

  // Reset countdown
  clearInterval(countDownList[roomId]);
  room.board.timeRemaining = room.config.time;
  countDownList[roomId] = setInterval(() => {
    room.board.timeRemaining -= 1;
    console.log(room.board.timeRemaining);
  }, 1000);

  // Update board
  room.board.squares = squares;
  room.board.listHistoryItem = listHistoryItem;
  room.board.turn = room.board.turn === 'X' ? 'O' : 'X';
};

const updateRoom = async (roomId, cups, loser) => {
  try {
    console.log('chay ne ', cups);
    const room = roomList[roomId];

    // TODO: Patch winner and loser info
    const hostInfo = await UserModel.findByUsername(room.host.username);
    const guestInfo = await UserModel.findByUsername(room.guest.username);
    console.log('hosttt ', hostInfo);
    console.log('guestt ', guestInfo);
    if (loser === room.guest.username) {
      // Winner is host
      room.host.cups = parseInt(room.host.cups) + parseInt(cups);
      room.guest.cups = parseInt(room.guest.cups) - parseInt(cups);
      await UserModel.patch(
        { cups: room.host.cups, total: hostInfo.total + 1, wins: hostInfo.wins + 1 },
        { username: hostInfo.username },
      );
      await UserModel.patch(
        { cups: room.guest.cups, total: guestInfo.total + 1 },
        { username: guestInfo.username },
      );
      await BoardModel.update(
        {
          status: 1,
          winner: hostInfo.username,
          finishedAt: getDateNow(),
          cups,
        },
        { boardId: room.board.boardId },
      );
    } else {
      room.host.cups = parseInt(room.host.cups) - parseInt(cups);
      room.guest.cups = parseInt(room.guest.cups) + parseInt(cups);
      await UserModel.patch(
        { cups: room.host.cups, total: hostInfo.total + 1 },
        { username: hostInfo.username },
      );
      await UserModel.patch(
        { cups: room.guest.cups, total: guestInfo.total + 1, wins: guestInfo.wins + 1 },
        { username: guestInfo.username },
      );
      await BoardModel.update(
        {
          status: 1,
          winner: guestInfo.username,
          finishedAt: getDateNow(),
          cups,
        },
        { boardId: room.board.boardId },
      );
    }

    room.host.isReady = false;
    room.guest.isReady = false;
    clearInterval(countDownList[roomId]);
    room.board = {
      boardId: null,
      timeRemaining: room.config.time,
      squares: Array(HEIGHT).fill(Array(HEIGHT).fill(null)),
      listHistoryItem: [],
      turn: 'X',
    };
    return room;
  } catch (error) {
    console.log(error);
  }
};

const updateDraw = async (roomId) => {
  try {
    const room = roomList[roomId];

    await BoardModel.update(
      {
        status: 1,
        winner: null,
        finishedAt: getDateNow(),
        cups: 0,
      },
      { boardId: room.board.boardId },
    );

    room.host.isReady = false;
    room.guest.isReady = false;
    clearInterval(countDownList[roomId]);
    room.board = {
      boardId: null,
      timeRemaining: room.config.time,
      squares: Array(HEIGHT).fill(Array(HEIGHT).fill(null)),
      listHistoryItem: [],
      turn: 'X',
    };
    return room;
  } catch (error) {
    console.log(error);
  }
};

const leaveRoom = (roomId, username) => {
  const room = roomList[roomId];

  if (room.viewers.find((viewer) => viewer.username === username)) {
    room.viewers = room.viewers.filter((item) => item.username !== username);
    return room;
  }

  if (room.host.username === username) {
    if (!room.guest.username) {
      delete roomList[roomId];
      delete countDownList[roomId];
      return;
    }

    room.host = {
      username: room.guest.username,
      cups: room.guest.cups,
      socketIds: [...room.guest.socketIds],
      isReady: false,
    };
  }

  room.guest = {
    username: null,
    socketIds: [],
    cups: null,
    isReady: false,
  };

  clearInterval(countDownList[roomId]);
  room.board = {
    boardId: null,
    timeRemaining: room.config.time,
    squares: Array(HEIGHT).fill(Array(HEIGHT).fill(null)),
    listHistoryItem: [],
    turn: 'X',
  };

  return room;
};

/* ------------- USER QUEUE -------------- */
const userQueue = [];
const isEquivalent = (firstCup, secondCup) => {
  return Math.abs(firstCup - secondCup) <= CUP_DIFFERENCES;
};

const addQueue = (username, cups, socketId) => {
  for (let i = 0; i < userQueue.length; i++) {
    if (isEquivalent(cups, userQueue[i].cups)) {
      return userQueue.splice(i, 1)[0];
    }
  }

  userQueue.push({ username, cups, socketId });
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    const avatar = socket.handshake.query.avatar;
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

    socket.on('roomList', () => {
      console.log('ban ne');
      io.to(socket.id).emit('getRoomList', roomList);
    });

    socket.on('createRoom', ({ cups, config }) => {
      const roomId = addRoom(username, avatar, cups, socket.id, config);
      console.log('socketId ', socket.id);

      // TODO: Emit to sender to join room
      io.to(socket.id).emit('joinRoom', { roomId, password: config.password });

      // TODO: Emit to everyone roomlist
      socket.broadcast.emit('getRoomList', roomList);

      console.log('create room list ', roomList);
    });

    socket.on('checkRoom', ({ roomId, password }) => {
      const res = checkRoom(roomId, password);
      console.log('check room ', res);

      if (res === true) {
        io.to(socket.id).emit('joinRoom', { roomId, password });
      } else {
        io.to(socket.id).emit('joinRoomError', res.type);
      }
    });

    socket.on('joinRoom', ({ roomId, cups, password }) => {
      const res = joinRoom(roomId, username, avatar, cups, password, socket.id);
      console.log(res);

      if (res.status === 'error') {
        console.log('join room error ', res.type);
        io.to(socket.id).emit('joinRoomError', res.type);
        return;
      }

      socket.join(`${roomId}`);
      // TODO: Emit everyone in room about new user
      io.in(`${roomId}`).emit('getRoomInfo', res.data.roomInfo);

      // TODO: Emit to everyone room list updated
      socket.broadcast.emit('getRoomList', roomList);

      console.log(`Host ${username} has joined room ${roomId} with ${cups}`);
      console.log('Room list ', roomList);
    });

    socket.on('playNow', ({ cups }) => {
      const res = addQueue(username, cups, socket.id);
      console.log('play now info ', username, cups, socket.id);
      console.log(`${username} add queue ${res}`);
      console.log(res);
      console.log(userQueue);

      if (res) {
        const roomId = addRoom(username, avatar, cups, socket.id);

        socket.broadcast.emit('getRoomList', roomList);
        io.to(socket.id).emit('joinRoom', { roomId, password: null });
        io.to(res.socketId).emit('joinRoom', { roomId, password: null });
        console.log('create room list ', roomList);
      }
    });

    socket.on('updateReady', ({ roomId, isHost, isReady }) => {
      const roomInfo = updateReady(roomId, isHost, isReady);

      socket.to(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('invite', ({ roomId, reciever }) => {
      const recieverSocketId = onlineList.get(reciever).values().next().value;
      console.log(recieverSocketId);

      io.to(recieverSocketId).emit('inviteReq', {
        roomId,
        password: roomList[roomId].config.password,
      });
    });

    socket.on('updateBoard', ({ roomId, boardId }) => {
      const roomInfo = updateBoard(roomId, boardId);
      socket.broadcast.emit('getRoomList', roomList);
      io.in(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('moveChessman', ({ roomId, boardId, chessman, pos, squares, listHistoryItem }) => {
      console.log(`${username} move chessman`);
      moveChessman(roomId, boardId, username, pos, squares, listHistoryItem);
      socket.to(`${roomId}`).emit('newMoveChessman', {
        chessman,
        pos,
        squares,
        listHistoryItem,
        sender: username,
      });
    });

    socket.on('sendMessage', ({ boardId, content, roomId }) => {
      console.log('message ', content);
      if (boardId) {
        ChatModel.create({ sender: username, boardId, message: content, createdAt: getDateNow() });
      }

      socket.to(`${roomId}`).emit('newMessage', { sender: username, content });
    });

    socket.on('leaveRoom', (roomId) => {
      console.log(`${username} is leaving `, roomId);
      const roomInfo = leaveRoom(roomId, username);
      console.log(`leaving `, roomInfo);

      socket.leave(`${roomId}`);
      socket.broadcast.emit('getRoomList', roomList);
      io.in(`${roomId}`).emit('getRoomInfo', roomInfo);
    });

    socket.on('leaveRoomAndLose', async ({ roomId, newCups }) => {
      console.log(`${username} is leaving `, roomId, newCups, username);

      await updateRoom(roomId, newCups, username);

      const roomInfo = leaveRoom(roomId, username);
      console.log(`leaving `, roomInfo);
      socket.leave(`${roomId}`);
      io.in(`${roomId}`).emit('resign', { winner: roomInfo.host.username });
    });

    socket.on('resign', async ({ roomId }) => {
      const roomInfo = roomList[roomId];
      io.in(`${roomId}`).emit('resign', {
        winner:
          roomInfo.host.username === username ? roomInfo.guest.username : roomInfo.host.username,
      });
    });

    socket.on('drawReq', ({ roomId }) => {
      const roomInfo = roomList[roomId];
      let reciever;
      if (roomInfo.host.username === username) {
        reciever = roomInfo.guest.socketIds[0];
      } else {
        reciever = roomInfo.host.socketIds[0];
      }

      io.to(reciever).emit('drawReq');
    });

    socket.on('refuseDraw', ({ roomId }) => {
      const roomInfo = roomList[roomId];
      let reciever;
      if (roomInfo.host.username === username) {
        reciever = roomInfo.guest.socketIds[0];
      } else {
        reciever = roomInfo.host.socketIds[0];
      }

      io.to(reciever).emit('refuseDraw');
    });

    socket.on('draw', async ({ roomId }) => {
      await updateDraw(roomId);

      socket.broadcast.emit('getRoomList', roomList);
      io.in(roomId).emit('draw');
    });

    socket.on('finishGame', async ({ roomId, newCups, loser }) => {
      const roomInfo = await updateRoom(roomId, newCups, loser);
      console.log('reset room ', roomInfo);
      socket.broadcast.emit('getRoomList', roomList);
    });

    socket.on('getUpdateRoomInfo', (roomId) => {
      const roomInfo = roomList[roomId];
      io.to(socket.id).emit('getUpdateRoomInfo', roomInfo);
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
