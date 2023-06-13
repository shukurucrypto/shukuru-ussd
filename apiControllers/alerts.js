const ContractKit = require('@celo/contractkit')
const {
  providerRPCURL,
  celoProviderUrl,
  bscProviderURL,
  busdAddress,
  cusdAddress,
} = require('../settings/settings.js')

const Web3 = require('web3')
const ethers = require('ethers')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const {
  createLightingInvoice,
} = require('../lightning/createLightningInvoice.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { sendBitcoinTx } = require('../functions/sendBitcoinTx.js')
const LightningWallet = require('../models/LightningWallet.js')
const { payLightingInvoice } = require('../lightning/payLightingInvoice.js')
const { getLightningWalletBalance } = require('../lightning/walletBalance.js')
const {
  createBTCPlatformTxFeeInvoice,
  platformPayoutFeeAmount,
} = require('../platformPayout/platformPayout.js')
const UserTransactions = require('../models/UserTransactions.js')
const {
  decodeLightningInvoice,
} = require('../lightning/decodeLightningInvoice.js')
const { currencyConvertor } = require('../utils/currencyConvertor.js')
const {
  getLightningWalletTransactions,
} = require('../lightning/getWalletTransactions.js')
const { invoiceStatus } = require('../lightning/invoiceStatusHash.js')
const ActiveInvoice = require('../models/ActiveInvoice.js')
const BUSDABI = require('../abiData/erc20.json')
const NfcCard = require('../models/NfcCard.js')
const { log } = require('console')
const { default: axios } = require('axios')

require('dotenv').config()

async function telegramOrder(htmlText) {
  try {
    // const htmlText = `<b>Incoming</b>, <strong>Airtel Data</strong>
    // Send +256700719619 25MB (500UGX) data.`

    const options = {
      method: 'POST',
      url: 'https://api.telegram.org/bot6268061148%3AAAGi5lzr9LRQp5jr5I5xpWfkmZlNo3268Tg/sendMessage',
      headers: {
        accept: 'application/json',
        'User-Agent':
          'Telegram Bot SDK - (https://github.com/irazasyed/telegram-bot-sdk)',
        'content-type': 'application/json',
      },
      data: {
        chat_id: '6196117698',
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        disable_notification: false,
        reply_to_message_id: 0,
      },
    }

    const result = await axios
      .request(options)
      .then(function (response) {
        return response.data
      })
      .catch(function (error) {
        return error.message
      })

    return {
      success: true,
      response: 'Order request sent',
      data: result,
    }
  } catch (error) {
    console.log(error.message)
    return {
      success: false,
      response: error.message,
    }
  }
}

module.exports = {
  telegramOrder,
}
