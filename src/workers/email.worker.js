require('module-alias/register');
const { connectRabbitMQ, getChannel }= require('@/dbs/init.rabbitmq');
const { sendMail } = require('@/services/email.service');

const startEmailWorker = async () => {
    await connectRabbitMQ();
    const channel = getChannel();

    console.log('Email worker stated, wating for job ...')

    channel.consume('email_queue', async(msg) => {
        if(msg) {
            const emailData = JSON.parse(msg.content.toString());

            try {
                await sendMail(emailData);
                console.log('EmailSend:', emailData.to);
                channel.ack(msg); //xác nhận xử lý xong

            }catch (error) {
                console.error('Email send failed:', error);
                channel.nack(msg, false, true) // trey lại job này
            }
        }
    })
};
startEmailWorker();