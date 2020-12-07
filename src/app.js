const express = require('express');
require('dotenv').config({ path: './src/.env' });

const useAdminRoutes = require('./routes/admin');
const useUserRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

useAdminRoutes(app);
useUserRoutes(app);

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
