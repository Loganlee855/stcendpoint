const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agent = sequelize.define('Agent', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: sequelize.UUIDV4,
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    agentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    secureLogin: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    secretkey: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    agentName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    agentType: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    percent: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0,
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    memo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    adminMemo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    apiType: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    parentPath: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        comment: "parent path",
    },
    balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        comment: "slot balance",
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
},
{
    tableName: "agents",
    freezeTableName: true,
    timestamps: true,
});

module.exports = Agent;
