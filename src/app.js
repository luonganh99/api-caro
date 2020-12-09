const express = require('express');
const cors = require('cors');
const passport = require('passport');
const socketIO = require('socket.io');
const http = require('http');

require('dotenv').config({ path: './src/.env' });

const usePassport = require('./common/passport');
const useSocket = require('./common/socket');
const useAdminRoutes = require('./routes/admin');
const useUserRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);

// Config
const PORT = process.env.PORT || 4000;
// const io = socketIO(server);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport
usePassport();
app.use(passport.initialize());

// Routes
useAdminRoutes(app);
useUserRoutes(app);

// Socket
useSocket(io);

server.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
