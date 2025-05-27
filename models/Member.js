const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define('Member', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: sequelize.UUIDV4,
    },
    agentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        comment: "agent code",
    },
    userCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        comment: "user code",
    },
    balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        comment: "slot balance",
    },
    aasUserCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        comment: "User ID sent from hpplaycasion (Evol uses this ID, including for recharging user money)",
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "1: standard, 2: deleted",
    },
    parentPath: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        comment: "parent path",
    },
    totalDebit: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "total bet money",
    },
    totalCredit: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "total win money",
    },
},
{
    tableName: "users",
    timestamps: true,
});

module.exports = Member;
