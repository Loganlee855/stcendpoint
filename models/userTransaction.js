const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTransaction = sequelize.define('UserTransaction', {
    transaction_id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: "",
    },
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
    chargeType: {
        type: DataTypes.INTEGER,
        comment: "0: discarge(debit), 1: charge(credit)",
    },
    chargeAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    agentPrevBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    agentAfterBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    userPrevBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    userAfterBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.INTEGER,
    },
    parentPath: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
},
{
    tableName: "user_transactions",
    freezeTableName: true,
    timestamps: true,
});

module.exports = UserTransaction;
