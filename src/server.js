require('dotenv').config();
require('module-alias/register');

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const swaggerSpec = require('@/configs/config.swagger');
const config = require('@/configs/config.postgres');
const logger = require('@/configs/config.logger');
const routes = require('@/routes');
const errorHandler = require('@/middlewares/errorHandler');
const { connectRabbitMQ } = require('@/dbs/init.rabbitmq');
const { csrfProtection, csrfErrorHandler } = require('@/middlewares/csrf');

const app = express();

// ==================== Trust Proxy ====================
// Nginx / Load Balancer ip forward
app.set('trust proxy', 1);

// ==================== Security Middlewares ====================
app.use(helmet({
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    xContentTypeOptions: true,
    xFrameOptions: 'DENY',
}));
// Request ID middleware
app.use((req, res, next) => {
    req.id = require('crypto').randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// ==================== CORS ====================
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
app.use(cors(corsOptions));

// ==================== Cookie Parser ====================
app.use(cookieParser());

// ==================== CSRF Protection ====================
const { csrfMiddleware } = require('@/middlewares/csrf');
app.use(csrfMiddleware);

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

if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

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
const server = app.listen(PORT, () => {
    logger.info(`Server running at http://${config.app.host}:${PORT}`);
    logger.info(`API Docs: http://${config.app.host}:${PORT}/api-docs`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ==================== Graceful Shutdown ====================
const gracefulShutdown = () => {
    logger.info('Received kill signal, shutting down gracefully');
    server.close(async () => {
        logger.info('Closed out remaining connections');
        
        // Đóng các kết nối database/queue
        try {
            const prisma = require('@/dbs/init.prisma');
            await prisma.$disconnect();
            
            const redisClient = require('@/dbs/init.redis');
            redisClient.disconnect();
            
            logger.info('Disconnected from databases');
        } catch (err) {
            logger.error('Error closing database connections', { error: err });
        }
        
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
