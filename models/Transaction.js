const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    uuid: {
        type: DataTypes.STRING,
    },
    agentCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    member_account: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    before_balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    after_balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    action: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.FLOAT,
    },
    currency: {
        type: DataTypes.STRING,
    },
    valid_bet_amount: {
        type: DataTypes.FLOAT,
    },
    bet_amount: {
        type: DataTypes.FLOAT,
    },
    prize_amount: {
        type: DataTypes.FLOAT,
    },
    tip_amount: {
        type: DataTypes.FLOAT,
    },
    wager_code: {
        type: DataTypes.STRING,
    },
    wager_status: {
        type: DataTypes.STRING,
    },
    round_id: {
        type: DataTypes.STRING,
    },
    payload: {
        type: DataTypes.TEXT,
    },
    settled_at: {
        type: DataTypes.DATE,
    },
    product_code: {
        type: DataTypes.STRING,
    },
    game_code: {
        type: DataTypes.STRING,
    },
    game_type: {
        type: DataTypes.STRING,
    },
    provider_code: {
        type: DataTypes.STRING,
    },
    provider_id: {
        type: DataTypes.STRING,
    },
    game_name: {
        type: DataTypes.STRING,
    },
    provider_line_id: {
        type: DataTypes.STRING,
    },
    povider_product_id: {
        type: DataTypes.STRING,
    },
    povider_product_oid: {
        type: DataTypes.STRING,
    }
}, {
    tableName: 'transactions',
    timestamps: true
});

module.exports = Transaction;
