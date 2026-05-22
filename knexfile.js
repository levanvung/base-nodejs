// Update with your config settings.
require('dotenv').config();

const baseConnection = {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vchat',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
};

module.exports = {
    development: {
        client: 'postgresql',
        connection: baseConnection,
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/dbs/migrations'
        }
    },

    production: {
        client: 'postgresql',
        connection: baseConnection,
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
