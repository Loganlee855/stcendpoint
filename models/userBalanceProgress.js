const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBalanceProgress = sequelize.define('UserBalanceProgress', {
    agentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    userCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    userBalance: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
    },
    comment: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    parentPath: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ".",
    },
},
{
    tableName: "user_balance_progresses",
    freezeTableName: true,
    timestamps: true,
});

module.exports = UserBalanceProgress;
