const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');

        await channel.assertQueue('email_queue', { durable: true });
        return channel;
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
        setTimeout(connectRabbitMQ, 5000); // thử lại sau 5 giây
        return null;
    }
};

const waitForChannel = async (timeoutMs = 30000, intervalMs = 500) => {
    const start = Date.now();

    while (!channel) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('RabbitMQ channel not ready within timeout');
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return channel;
};

// Hàm kết nối đã được export để gọi ở server.js
const getChannel = () => channel

module.exports = { connectRabbitMQ, getChannel, waitForChannel }
