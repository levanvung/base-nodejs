const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');

        await channel.assertQueue('email_queue', { durable: true });
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error)
        setTimeout(connectRabbitMQ, 5000) // thử lại sau 5 giây
    }
};

// Hàm kết nối đã được export để gọi ở server.js
const getChannel = () => channel

module.exports = { connectRabbitMQ, getChannel }
