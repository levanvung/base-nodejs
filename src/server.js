const express = require('express');
require('module-alias/register');
const app = express();
const config = require('./configs/config.postgres');

// Init Database
require('./dbs/init.postgres');

app.get('/', (req, res) => {
    res.send('Hello World with PostgreSQL!');
});

const PORT = config.app.port;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
