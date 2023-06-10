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
  getApiProfileUsername,
  getBTCAPIBalance,
  changeUserCurrencyAPI,
  deleteUserAccount,
  currencyConvertorToEthersApi,
  getBUSDWalletApiBalance,
  getRawCUSDWalletApiBalance,
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
  createExternalBTCTXAPI,
  getBUSDGasEstimateAPI,
  getCeloGasEstimateAPI,
  getRawBUSDGasEstimateAPI,
  getRawCUSDGasEstimateAPI,
  sendRawApiCeloUSD,
  sendRawApiBUSD,
} = require('../apiControllers/payments.js')
const accessTokenBearer = require('../middleware/accessTokenBearer.js')
const {
  createActiveInvoice,
  getActiveInvoice,
} = require('../apiControllers/activeInvoice.js')
const { authenticateToken } = require('../middleware/authToken.js')
const {
  sendReward,
  claimReward,
  checkReward,
} = require('../apiControllers/rewards.js')

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
apiRouter.post('/toethers', currencyConvertorToEthersApi)
apiRouter.get('/btc/txs/:userId', getBTCWalletTransactionsAPI)
apiRouter.get('/wallet/btc/:userId', authenticateToken, getBTCAPIBalance)
apiRouter.post(
  '/wallet/exbtc/create',
  authenticateToken,
  createExternalBTCTXAPI
)

// raw wallet routes
apiRouter.get(
  '/raw/wallet/busd/:userId',
  authenticateToken,
  getBUSDWalletApiBalance
)
apiRouter.get(
  '/raw/wallet/cusd/:userId',
  authenticateToken,
  getRawCUSDWalletApiBalance
)

// Profile
apiRouter.get('/user/:userId', getProfile)
apiRouter.get('/profile/:phone', getApiProfile)
apiRouter.get('/profile/name/:name', getApiProfileUsername)
apiRouter.get('/txs/:userId', getApiProfileTx)
apiRouter.post('/user/country/update', authenticateToken, changeUserCurrencyAPI)
apiRouter.delete('/user/delete', authenticateToken, deleteUserAccount)

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

// Gas functions
apiRouter.post('/gas/busd', getBUSDGasEstimateAPI)
apiRouter.post('/gas/cusd', getCeloGasEstimateAPI)

// Raw gas estimates
apiRouter.post('/raw/gas/busd', getRawBUSDGasEstimateAPI)
apiRouter.post('/raw/gas/cusd', getRawCUSDGasEstimateAPI)

// Raw Tx
apiRouter.post('/send/raw/cusd', authenticateToken, sendRawApiCeloUSD)
apiRouter.post('/send/raw/busd', authenticateToken, sendRawApiBUSD)

// Rewards
apiRouter.post('/rewards', authenticateToken, sendReward)
apiRouter.get('/claim', authenticateToken, claimReward)
apiRouter.get('/rewards/check', authenticateToken, checkReward)
module.exports = apiRouter
