const {getChannel} = require('@/dbs/init.rabbitmq');

const sendEmailToQueue = async (emailData) => {
    const channel = getChannel();
    if(!channel) throw new Error('RabbitMQ channel not ready');

    channel.sendToQueue(
        'email_queue',
        Buffer.from(JSON.stringify(emailData)),
        {
            persistent: true
        }
    );
    console.log('Email job added to quêu:', emailData.to);

}

module.exports = { sendEmailToQueue }