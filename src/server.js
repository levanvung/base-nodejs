require('dotenv').config();
require('module-alias/register');

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('@/configs/config.swagger');
const config = require('@/configs/config.postgres');
const logger = require('@/configs/config.logger');
const routes = require('@/routes');
const errorHandler = require('@/middlewares/errorHandler');
const { connectRabbitMQ } = require('@/dbs/init.rabbitmq');

const app = express();

// ==================== Security Middlewares ====================
app.use(helmet());

// ==================== CORS ====================
app.use((req, res, next) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// ==================== Body Parsers ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== Logging ====================
const morganFormat = ':method :url :status :response-time ms';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => {
            const parts = message.trim().split(' ');
            const logObject = {
                method: parts[0],
                url: parts[1],
                status: parts[2],
                responseTime: parts[3],
            };
            logger.info(JSON.stringify(logObject));
        },
    },
}));

// ==================== Passport ====================
app.use(passport.initialize());

// ==================== Database Connections ====================
require('@/dbs/init.postgres');
connectRabbitMQ();

// ==================== Routes ====================
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== Health Check ====================
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== 404 Handler ====================
app.use((req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.status = 404;
    next(error);
});

// ==================== Global Error Handler ====================
app.use(errorHandler);

// ==================== Start Server ====================
const PORT = config.app.port;
app.listen(PORT, () => {
    logger.info(`Server running at http://${config.app.host}:${PORT}`);
    logger.info(`API Docs: http://${config.app.host}:${PORT}/api-docs`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
