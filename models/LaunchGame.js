const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LauncGame = sequelize.define(
  "LauncGame",
  {
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "launch_data",
    timestamps: true,
  }
);

module.exports = LauncGame;
