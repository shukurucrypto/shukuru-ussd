const { createLightingInvoice } = require('../lightning/createLightningInvoice')
require('dotenv').config

const ADMIN_INKEY = process.env.ADMIN_INKEY

const lightningTxCosts = 1

const platformPayout = async () => {}

const createBTCPlatformTxFeeInvoice = async (currentUser) => {
  // Create the invoice from the reciever
  const data = {
    out: false,
    amount: lightningTxCosts,
    memo: `${currentUser.name} pays network fee`,
    unit: 'sat',
  }

  const invoiceResponse = await createLightingInvoice(ADMIN_INKEY, data)

  return invoiceResponse
}

module.exports = {
  createBTCPlatformTxFeeInvoice,
  lightningTxCosts,
}
