const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProviderList = sequelize.define('ProviderList', {
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    provider_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    provider_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    provider_id: {
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
    game_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    game_type_c: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'provider_lists',
    timestamps: true
});

module.exports = ProviderList;
