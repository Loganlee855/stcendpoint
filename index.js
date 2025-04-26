require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const sequelize = require('./config/database');
const routes = require('./routes/index');
sequelize.sync();

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(routes);
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);
app.use((req, res, next) => {
  res.status(404).json({
    code: 404,
    message: `Not found`,
  });
});



const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`Server is started on ${PORT} port`);
});
