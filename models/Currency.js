const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Currency = sequelize.define('Currency', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    rate: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'currencies',
    timestamps: true
});

module.exports = Currency;
