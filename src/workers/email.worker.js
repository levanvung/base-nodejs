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
                
                // Giới hạn số lần retry để tránh spam loop
                const headers = msg.properties.headers || {};
                const retryCount = (headers['x-retry-count'] || 0) + 1;
                
                if (retryCount >= 3) {
                    console.error(`Email to ${emailData.to} failed 3 times. Dropping message.`);
                    channel.ack(msg); // Drop hoàn toàn
                } else {
                    console.log(`Re-queue email to ${emailData.to} (attempt ${retryCount})`);
                    // Publish lại với header x-retry-count tăng lên
                    channel.publish('', 'email_queue', Buffer.from(JSON.stringify(emailData)), {
                        headers: { 'x-retry-count': retryCount }
                    });
                    channel.ack(msg); // Ack message cũ
                }
            }
        }
    })
};
startEmailWorker();