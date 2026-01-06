require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT || 3000
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'vchat',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    }
};

module.exports = config;
