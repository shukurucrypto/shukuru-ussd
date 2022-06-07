const express = require('express');
const bodyParser = require('body-parser');

const ussdRouter = require('./routes/ussd.js')

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/ussd', ussdRouter);

app.listen(8000, () => console.log('Server started on port 8000'));