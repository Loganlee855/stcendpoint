const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameList = sequelize.define('GameList', {
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    provider_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    game_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    game_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    game_image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    support_currency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    game_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }
}, {
    tableName: 'game_lists',
    timestamps: true
});

module.exports = GameList;
