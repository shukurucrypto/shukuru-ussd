const express = require('express');
const { markets, createWallet } = require('../controllers/ussd.js');

const router = express.Router();


router.post('/', markets);
router.post('/create', createWallet);

module.exports = router;

