const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Bật log để debug dễ hơn
});
module.exports = prisma;