const pool = require('@/dbs/init.postgres');

const tableName = 'users';

const createTableUsers = async () => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(queryText);
        console.log(`Created table "${tableName}" successfully`);
    } catch (error) {
        console.error(`Error creating table "${tableName}":`, error);
    }
};

module.exports = {
    createTableUsers
};
