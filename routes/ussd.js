const express = require('express')
const { getCoinAPI, getQRCode } = require('../apiCalls/getCoin.js')
const {
  getInvoice,
  getUserLightningBalance,
} = require('../controllers/invoices.js')
const { markets, createWallet } = require('../controllers/ussd.js')
const { createOtherWallet, otherMarkets } = require('../controllers/ussd2.js')
const { networkServer } = require('../settings/settings.js')
const { currencyConvertor } = require('../utils/currencyConvertor.js')

const router = express.Router()

router.post('/', markets)
router.post('/create', createWallet)

router.get('/coin', getCoinAPI)
router.get('/code/:qr', getQRCode)

router.post('/qr', getInvoice)
router.post('/lightning', getUserLightningBalance)

// App routes

// router.post('/test', currencyConvertor)

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
