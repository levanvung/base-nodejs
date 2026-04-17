const prisma = require('@/dbs/init.prisma');
const logger = require('@/configs/config.logger');

const AuditAction = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD',
    RESET_PASSWORD: 'RESET_PASSWORD',
    REFRESH_TOKEN: 'REFRESH_TOKEN',
    UPDATE_PROFILE: 'UPDATE_PROFILE',
    ENABLE_2FA: 'ENABLE_2FA',
    DISABLE_2FA: 'DISABLE_2FA',
    LOGIN_2FA: 'LOGIN_2FA',
    ADMIN_UPDATE_USER: 'ADMIN_UPDATE_USER',
    ADMIN_DELETE_USER: 'ADMIN_DELETE_USER',
    ADMIN_CHANGE_ROLE: 'ADMIN_CHANGE_ROLE',
};

const auditLog = async ({ userId, action, ip, userAgent, details }) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                ip,
                userAgent,
                details: JSON.stringify(details || {}),
                createdAt: new Date(),
            },
        });
    } catch (error) {
        logger.error('Failed to create audit log', { error, userId, action });
    }

    logger.info(`Audit: ${action}`, {
        userId,
        action,
        ip,
        userAgent,
    });
};

module.exports = { auditLog, AuditAction };