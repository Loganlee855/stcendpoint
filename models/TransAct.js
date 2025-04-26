const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransAct = sequelize.define('TransAct', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'trans_acts',
    timestamps: true
});

module.exports = TransAct;
