const winston = require('winston');
const { combine, timestamp, json, printf, align } = winston.format;
const DailyRotateFile = require('winston-daily-rotate-file');

// Format tùy chỉnh log
const logFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        align(),
        logFormat
    ),
    transports: [
        // 1. Ghi log ra console (Terminal) - dùng cho Dev
        new winston.transports.Console(),

        // 2. Ghi lỗi (Error) vào file riêng
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            zippedArchive: true, // Nén file cũ
            maxSize: '20m',      // Tối đa 20MB/file
            maxFiles: '14d'      // Lưu trong 14 ngày
        }),

        // 3. Ghi tất cả log (Info, Warn, Error) vào file chung
        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
});

module.exports = logger;
