// Update with your config settings.
require('dotenv').config();

module.exports = {

    development: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'vchat',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 5432
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/dbs/migrations'
        }
    }

};
