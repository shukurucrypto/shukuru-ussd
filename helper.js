const axios = require('axios')
require('dotenv').config()

const ADMIN_ID = process.env.ADMIN_ID
const API_KEY = process.env.API_KEY
const NODE_ID = process.env.NODE_ID

// Wallet functions
const createWallet = async () => {
  const data = {
    admin_id: ADMIN_ID,
    wallet_name: 'Jane Doe',
    user_name: 'Jane Doe',
  }
  try {
    const response = await axios.post(
      'https://legend.lnbits.com/usermanager/api/v1/users',
      data,
      {
        headers: {
          'X-Api-Key': API_KEY,
          'Content-type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

const getWalletDetails = async (userKey) => {
  try {
    const response = await axios.get(
      'https://legend.lnbits.com/api/v1/wallet',
      {
        headers: {
          'X-Api-Key': userKey,
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

// Invoice functions
const createInvoice = async (data, invoiceKey) => {
  try {
    const response = await axios.post(
      'https://legend.lnbits.com/api/v1/payments',
      data,
      {
        headers: {
          'X-Api-Key': invoiceKey,
          'Content-type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

const payInvoice = async (data, invoiceKey) => {
  try {
    const response = await axios.post(
      'https://legend.lnbits.com/api/v1/payments',
      data,
      {
        headers: {
          'X-Api-Key': invoiceKey,
          'Content-type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

const getInvoiceDetails = async (paymentHash) => {
  try {
    const response = await axios.get(
      `https://legend.lnbits.com/api/v1/payments/${paymentHash}`,
      {
        headers: {
          'X-Api-Key': API_KEY,
          'Content-type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

// Transactions
const getUserTransactions = async (walletID) => {
  try {
    const response = await axios.get(
      `https://legend.lnbits.com/usermanager/api/v1/transactions/${walletID}`,
      {
        headers: {
          'X-Api-Key': '03bf7ce713b14312b9a758a6a0de304c',
          'Content-type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

const run = async () => {
  // Create invoice data
  const data = {
    out: false,
    amount: 5000,
    memo: 'John Blaqs deposit invoice',
    unit: 'UGX',
  }

  //   pay invoice data
  const payData = {
    out: true,
    bolt11: NODE_ID,
  }
  //
  const userInvoiceKey = ''
  const walletId = ''
  const paymentHash = ''

  //
  // const response = await getWalletDetails('')
  // console.log(response)
}

run()
