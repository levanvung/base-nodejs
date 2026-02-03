require('dotenv').config();
console.log('DEBUG: GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
require('module-alias/register');
const express = require('express');
const helmet = require('helmet');
const errorHandler = require('@/middlewares/errorHandler');
const authRoutes = require('@/routes/auth.routes');
const app = express();
app.use(helmet());
const passport = require('passport');
app.use(passport.initialize());
const config = require('./configs/config.postgres');
const routes = require('@/routes');

const { connectRabbitMQ } = require('./dbs/init.rabbitmq');
connectRabbitMQ();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes); 

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error)
});

app.use(errorHandler);



// Init Database
require('./dbs/init.postgres'); 

app.get('/', (req, res) => {
    res.send('Hello World with PostgreSQL!');
});

const PORT = config.app.port;
app.listen(PORT, () => {
    console.log(`Server running at http://${config.app.host}:${PORT}`);
});
