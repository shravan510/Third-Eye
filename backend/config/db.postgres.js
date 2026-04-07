const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.PG_DB || 'third_eye_traffic',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'yourpassword',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

const connectPostgres = async () => {
    try {
        await sequelize.authenticate();
        console.log('[POSTGRES] Connection has been established successfully.');
    } catch (error) {
        console.error('[POSTGRES] Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectPostgres };
