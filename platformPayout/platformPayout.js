const { createLightingInvoice } = require('../lightning/createLightningInvoice')
require('dotenv').config

const ADMIN_INKEY = process.env.ADMIN_INKEY

const lightningTxCostsPercentage = 1

const platformPayoutFeeAmount = (amount) => {
  const fee = Number(amount) * (lightningTxCostsPercentage / 100)
  return fee
}

const sendAdminPayment = async (currentUser, amount) => {
  // Create the invoice from the reciever

  const data = {
    out: false,
    amount: amount,
    memo: `${currentUser.name} has paid for a utitity`,
    unit: currentUser.country,
  }

  const invoiceResponse = await createLightingInvoice(ADMIN_INKEY, data)

  return invoiceResponse
}

const createBTCPlatformTxFeeInvoice = async (currentUser, amount) => {
  // Create the invoice from the reciever

  const fee = Number(amount) * (lightningTxCostsPercentage / 100)

  const data = {
    out: false,
    amount: 1,
    memo: `${currentUser.name} pays network fee`,
    unit: 'sat',
  }

  const invoiceResponse = await createLightingInvoice(ADMIN_INKEY, data)

  return invoiceResponse
}

module.exports = {
  createBTCPlatformTxFeeInvoice,
  platformPayoutFeeAmount,
  sendAdminPayment,
}
