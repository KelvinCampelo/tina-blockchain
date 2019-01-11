const express = require('express');
const app = express();

app.get('/blockchain', (req, res) => {});

app.post('/transactions', (req, res) => {});

app.get('/mine', (req, res) => {});

app.listen(5050, () => {
    console.log('Listening on port 5050')
});
