const ethers = require('ethers')
const { createDbCollections } = require('../db/functions')
const { getLightningBalance } = require('../functions/getLightningBalance')
const { createLightingInvoice } = require('../lightning/createLightningInvoice')
const { payLightingInvoice } = require('../lightning/payLightingInvoice')
const LightningWallet = require('../models/LightningWallet')
const UtilityCosts = require('../models/UtilityCosts')
const { decrypt } = require('../security/encrypt')
const { currencyConvertor } = require('../utils/currencyConvertor')
const { getCelloDollarBalance } = require('../utils/getCelloDollarBalance')
const { getUsdtBalance } = require('../utils/getUsdtBalance')
require('dotenv').config()

const buyData = async (payType, dataAmount, phoneNumber, currentUser) => {
  try {
    switch (payType) {
      case 'BTC':
        // Step 0: Check the user BTC Balance...
        const balance = await checkBalance('BTC', phoneNumber)

        if (balance <= 0.0) {
          console.log('You do not have enough BTC to buy this bundle')
          break
        }

        // Get country data cost engine values here---
        const { cost: dataCost } = await getUtilityCosts(
          'Data',
          currentUser.country,
          dataAmount,
          'Airtel'
        )

        // Step 1: Send BTC worth 1000K to admin BTC wallet
        const txStatus = await payToAdmin('BTC', currentUser, dataCost)
        console.log('TX Status: ', txStatus)

        // Step 2: After Admin gets the sats, then send the user their data bundle
        if (txStatus.status === 200) {
          // send the user their data bundle here
        }
        console.log(`Buying ${dataAmount} with ${payType}`)
        break

      case 'USDT':
        console.log('Purchase with USDT ----')
        createDbCollections()
        // Step 0: Check the user USDT Balance...
        const usdtBalance = await checkBalance('USDT', phoneNumber)
        console.log('USDT BALANCE', usdtBalance)

        // if (usdtBalance <= 0.0) {
        //   console.log('You do not have enough USDT to buy this bundle')
        //   break
        // }

        const { cost: usdtDataCost } = await getUtilityCosts(
          'Data',
          currentUser.country,
          dataAmount,
          'Airtel'
        )

        console.log('UTILITY COST:____', usdtDataCost)

        const convertedToUsd = await currencyConvertor(
          usdtDataCost,
          currentUser.country,
          'USD'
        )
        console.log('Converted USDT Cost: ', convertedToUsd)

        console.log(`Buying ${dataAmount} with ${payType}`)
        break
      case 'cUSD':
        console.log('Purchase with cUSD ----')

        // Step 0: Check the user USDT Balance...
        const cusdBalance = await checkBalance('USDT', phoneNumber)
        console.log('CUSD BALANCE', cusdBalance)

        // if (cusdBalance <= 0.0) {
        //   console.log('You do not have enough cUSD to buy this bundle')
        //   break
        // }

        const { cost: cusdDataCost } = await getUtilityCosts(
          'Data',
          currentUser.country,
          dataAmount,
          'Airtel'
        )

        console.log('UTILITY COST:____', cusdDataCost)

        const cusdConvertedToUsd = await currencyConvertor(
          cusdDataCost,
          currentUser.country,
          'USD'
        )

        console.log('Converted CUSD Cost: ', cusdConvertedToUsd)
        console.log(`Buying ${dataAmount} with ${payType}`)
        break
      default:
        return 0
    }
  } catch (err) {
    console.log(err)
  }
}

const checkBalance = async (assetType, phoneNumber) => {
  try {
    switch (assetType) {
      case 'BTC':
        let lightningBalance = await getLightningBalance(phoneNumber)
        return Number(lightningBalance).toFixed(3)
      case 'USDT':
        let usdtBalance = await getUsdtBalance(phoneNumber)
        return Number(usdtBalance).toFixed(3)
      case 'CUSD':
        let celloDollarBalance = await getCelloDollarBalance(phoneNumber)
        return Number(celloDollarBalance).toFixed(3)
      default:
        return 0
    }
  } catch (err) {
    console.log(err)
    return err
  }
}

const payToAdmin = async (assetType, currentUser, amount) => {
  try {
    switch (assetType) {
      case 'BTC':
        console.log('Paying with BTC ------')
        const { adminKey: payerKey } = await LightningWallet.findOne({
          user: currentUser._id,
        })

        // decrypt the inKey
        const keyPayer = await decrypt(payerKey)

        const ADMIN_INKEY = process.env.ADMIN_INKEY

        // Create the invoice from the reciever
        const data = {
          out: false,
          amount: amount,
          memo: `${currentUser.name} has paid ${amount} for data`,
          unit: currentUser.country,
        }

        const invoiceResponse = await createLightingInvoice(ADMIN_INKEY, data)

        if (invoiceResponse.payment_hash) {
          console.log('Invoice created!')

          const payData = {
            out: true,
            bolt11: invoiceResponse.payment_request,
          }

          const res = await payLightingInvoice(keyPayer, payData)

          if (res?.payment_hash) {
            return {
              status: 200,
              message: 'success',
            }
          } else {
            return {
              status: 500,
              message: 'Insufficient balance',
            }
          }
        } else {
          return {
            status: 500,
            message: 'Transcation failed to process',
          }
        }
      case 'USDT':
        console.log('Pay with USDT')
        return 2
      case 'CUSD':
        console.log('Pay with Celo')
        return 3
      default:
        return 0
    }
  } catch (error) {
    // console.log(error.message)
    return error.message
  }
}

const getUtilityCosts = async (type, userCountry, package, network) => {
  try {
    const result = await UtilityCosts.findOne({
      type: type,
      package: package,
      countryCurrency: userCountry,
      network: network,
    })
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

module.exports = {
  buyData,
}
