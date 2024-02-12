const express = require('express')
const {
  createApiUser,
  login,
  verifyPhone,
  verifyCode,
  checkVerify,
  createBTCApiUser,
  sendOtpCode,
  verifyOtpCode,
  resetPassword,
  sendRawOtpCode,
  verifyRawOtpCode,
  resetRawPassword,
} = require('../apiControllers/auth.js')
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
  clearAllTransactions,
  getApiBTCTxs,
  getBTCWalletApiBalance,
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
  buyUtility,
  checkCeloGas,
  requestForGas,
  lookupAPIInvoiceStatus,
  updateLegacyData,
  createRecieverBoltTransaction,
} = require('../apiControllers/payments.js')
const accessTokenBearer = require('../middleware/accessTokenBearer.js')
const {
  createActiveInvoice,
  getActiveInvoice,
} = require('../apiControllers/activeInvoice.js')
const {
  authenticateToken,
  authenticateAllTokens,
} = require('../middleware/authToken.js')
const {
  sendReward,
  claimReward,
  checkReward,
} = require('../apiControllers/rewards.js')
const {
  sendPushNotification,
  sendUserPush,
} = require('../apiControllers/alerts.js')
const {
  getQuote,
  withdrawCUSD,
  confirmedTxCallback,
  createDepositTx,
  createRampTx,
  offRampEVM,
} = require('../apiControllers/oneRamp.js')
const { authLndNodeAdmin } = require('../middleware/adminAuth.js')
const { getInvoice } = require('../controllers/invoices.js')

const apiRouter = express.Router()

// router.post('/', markets)
// router.post('/create', createWallet)

// router.get('/coin', getCoinAPI)
// router.get('/code/:qr', getQRCode)

// router.post('/qr', getInvoice)
// router.post('/lightning', getUserLightningBalance)

// App routes
apiRouter.post('/auth/signup', createApiUser)
apiRouter.post('/auth/btc/signup', createBTCApiUser)
apiRouter.post('/reset/password', authenticateToken, resetPassword)
apiRouter.post('/auth/login', login)
apiRouter.post('/verify', authenticateToken, verifyPhone)
apiRouter.post('/code', authenticateToken, verifyCode)
apiRouter.post('/send/otp', authenticateToken, sendOtpCode)
apiRouter.get('/acc/verify', authenticateToken, checkVerify)
apiRouter.post('/verify/otp', authenticateToken, verifyOtpCode)

// Forgot password
apiRouter.post('/send/raw/otp', sendRawOtpCode)
apiRouter.post('/verify/raw/otp', verifyRawOtpCode)
apiRouter.post('/reset/raw/password', resetRawPassword)

// Wallet routes
apiRouter.get('/wallet/:userId', authenticateAllTokens, getWalletApiBalance)
apiRouter.get(
  '/wallet/btc/:userId',
  authenticateAllTokens,
  getBTCWalletApiBalance
)

//
apiRouter.post('/convert', currencyConvertorApi)
apiRouter.post('/toethers', currencyConvertorToEthersApi)
apiRouter.get('/btc/txs/:userId', getBTCWalletTransactionsAPI)
apiRouter.get('/wallet/btc/:userId', authenticateToken, getBTCAPIBalance)
apiRouter.post(
  '/wallet/exbtc/create',
  authenticateToken,
  createExternalBTCTXAPI
)
apiRouter.delete('/tx/clear', authenticateToken, clearAllTransactions)

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
apiRouter.get('/txs/btc/:userId', getApiBTCTxs)
apiRouter.post('/user/country/update', authenticateToken, changeUserCurrencyAPI)
apiRouter.delete('/user/delete', authenticateToken, deleteUserAccount)

// Payments
apiRouter.post('/send', authenticateAllTokens, sendLightningApiPayment)
apiRouter.post('/send/cusd', authenticateToken, sendApiCeloUSD)
apiRouter.get('/gas/:userId', checkCeloGas)
apiRouter.post('/send/busd', authenticateToken, sendApiBUSD)

// BTC
apiRouter.post(
  '/invoice/create',
  authenticateAllTokens,
  createAPILightningInvoice
)
apiRouter.post('/invoice/decode', authenticateAllTokens, decodeInvoiceAPI)
apiRouter.post('/invoice/pay', authenticateAllTokens, payBTCInvoiceAPI)
// apiRouter.post('/invoice/status', authenticateAllTokens, lookupAPIInvoiceStatus)
apiRouter.post('/invoice/status', authenticateAllTokens, getInvoice)
apiRouter.get('/invoice/legacies', authenticateAllTokens, updateLegacyData)

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

// Utilities
apiRouter.post('/utility/pay', authenticateAllTokens, buyUtility)
apiRouter.post('/gas/request', requestForGas)

apiRouter.post('/push', sendPushNotification)

// OneRamp
apiRouter.post('/quote', authenticateToken, getQuote)
apiRouter.post('/withdraw', authenticateToken, withdrawCUSD)
apiRouter.post('/ramp', authenticateToken, createRampTx)
apiRouter.post('/off-ramp', authenticateToken, offRampEVM)

// Push
apiRouter.post('/one-push', sendUserPush)
apiRouter.post('/callback', confirmedTxCallback)

// Bolt11
apiRouter.post('/create-tx', authLndNodeAdmin, createRecieverBoltTransaction)

module.exports = apiRouter
