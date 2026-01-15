const pool = require('@/dbs/init.postgres');

const tableName = 'otp';

const createTableOtp = async () => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
            id SERIAL PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            otp_code VARCHAR(6) NOT NULL, 
            otp_type VARCHAR(20) NOT NULL,  -- 'REGISTER', 'LOGIN', 'RESET_PASSWORD'
            expires_at TIMESTAMP NOT NULL, -- Thời gian hết hạn
            attempts INTEGER DEFAULT 0, -- số lần nhập sai
            max_attempts INTEGER DEFAULT 5, -- giới hạn thử,
            is_used BOOLEAN DEFAULT FALSE, -- đã sử dụng chưa, 
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    CREATE INDEX IF NOT EXISTS idx_otp_email_type ON "${tableName}"(email, otp_type);
    `;

    try {
        await pool.query(queryText);
        console.log(`Created table "${tableName}" successfully`);
    } catch (error) {
        console.error(`Error creating table "${tableName}":`, error);
    }
};

module.exports = {
    createTableOtp
};
