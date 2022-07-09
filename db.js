const { Sequelize } = require("sequelize");

module.exports = new Sequelize("my_first_bot_db", "postgres", "root", {
  host: "localhost",
  port: 6432,
  dialect: "postgres",
});
