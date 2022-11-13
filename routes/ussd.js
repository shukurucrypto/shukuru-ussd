const express = require('express')
const { getCoinAPI, getQRCode } = require('../apiCalls/getCoin.js')
const { getInvoice } = require('../controllers/invoices.js')
const { markets, createWallet } = require('../controllers/ussd.js')
const { createOtherWallet, otherMarkets } = require('../controllers/ussd2.js')
const { networkServer } = require('../settings/settings.js')

const router = express.Router()

router.post('/', markets)
router.post('/create', createWallet)

router.get('/coin', getCoinAPI)
router.get('/code/:qr', getQRCode)

router.post('/qr', getInvoice)

// switch (networkServer) {
//   case 1:
//     router.post('/', markets)
//     router.post('/create', createWallet)
//     break
//   case 2:
//     router.post('/', otherMarkets)
//     router.post('/create', createOtherWallet)
//     break
//   default:
//     router.post('/', markets)
//     router.post('/create', createWallet)
//     break
// }

module.exports = router
