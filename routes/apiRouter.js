const express = require('express')
const { getCoinAPI, getQRCode } = require('../apiCalls/getCoin.js')
const {
  getInvoice,
  getUserLightningBalance,
} = require('../controllers/invoices.js')
const { markets, createWallet } = require('../controllers/ussd.js')
const { createApiUser, login } = require('../apiControllers/auth.js')
const {
  getWalletApiBalance,
  getProfile,
  getApiProfile,
  getApiProfileTx,
  currencyConvertorApi,
} = require('../apiControllers/wallet.js')
const {
  sendLightningApiPayment,
  sendApiCeloUSD,
  createAPILightningInvoice,
  decodeInvoiceAPI,
  payBTCInvoiceAPI,
  getBTCWalletTransactionsAPI,
  getInvoiceStatusAPI,
  sendApiBUSD,
  nfcPayAPI,
  nfcPayEVMAPI,
  nfcPayBUSDAPI,
} = require('../apiControllers/payments.js')
const accessTokenBearer = require('../middleware/accessTokenBearer.js')
const {
  createActiveInvoice,
  getActiveInvoice,
} = require('../apiControllers/activeInvoice.js')
const { authenticateToken } = require('../middleware/authToken.js')

const apiRouter = express.Router()

// router.post('/', markets)
// router.post('/create', createWallet)

// router.get('/coin', getCoinAPI)
// router.get('/code/:qr', getQRCode)

// router.post('/qr', getInvoice)
// router.post('/lightning', getUserLightningBalance)

// App routes
apiRouter.post('/auth/signup', createApiUser)
apiRouter.post('/auth/login', login)

// Wallet routes
apiRouter.get('/wallet/:userId', getWalletApiBalance)
apiRouter.post('/convert', currencyConvertorApi)
apiRouter.get('/btc/txs/:userId', getBTCWalletTransactionsAPI)

// Profile
apiRouter.get('/user/:userId', getProfile)
apiRouter.get('/profile/:phone', getApiProfile)
apiRouter.get('/txs/:userId', getApiProfileTx)

// Payments
apiRouter.post('/send', authenticateToken, sendLightningApiPayment)
apiRouter.post('/send/cusd', authenticateToken, sendApiCeloUSD)
apiRouter.post('/send/busd', authenticateToken, sendApiBUSD)
apiRouter.post('/invoice/create', accessTokenBearer, createAPILightningInvoice)
apiRouter.post('/invoice/decode', decodeInvoiceAPI)
apiRouter.post('/invoice/pay', payBTCInvoiceAPI)
apiRouter.post('/invoice/pay/nfc', authenticateToken, nfcPayAPI)
apiRouter.post('/invoice/pay/busd/nfc', authenticateToken, nfcPayBUSDAPI)
apiRouter.post('/invoice/status', getInvoiceStatusAPI)

apiRouter.post('/invoice/active/create', createActiveInvoice)
apiRouter.post('/invoice/active/info', getActiveInvoice)

module.exports = apiRouter
