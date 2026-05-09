const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.postgres');

const FineSetting = sequelize.define('FineSetting', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    violation_type: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    section: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'fine_settings',
    timestamps: false,
});

module.exports = FineSetting;
