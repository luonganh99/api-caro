const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config({ path: './src/.env' });

const usePassport = require('./utils/passport');
const useAdminRoutes = require('./routes/admin');
const useUserRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

usePassport();
app.use(passport.initialize());
console.log('run');
useAdminRoutes(app);
useUserRoutes(app);

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
