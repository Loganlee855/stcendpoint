const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiCredential = sequelize.define('ApiCredential', {
    apikey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    secretkey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'api_credentials',
    timestamps: true
});

module.exports = ApiCredential;
