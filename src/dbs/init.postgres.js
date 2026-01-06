const { Pool } = require('pg');
const { db } = require('@/configs/config.postgres');

const pool = new Pool({
    user: db.user,
    host: db.host,
    database: db.name,
    password: db.password,
    port: db.port,
    max: 20,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 2000
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log(`Connected to PostgreSQL database: ${db.name}`);
    release();
});

module.exports = pool;
