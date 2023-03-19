const ethers = require('ethers')
const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')
const { createDbCollections } = require('../db/functions')
const { getLightningBalance } = require('../functions/getLightningBalance')
const { createLightingInvoice } = require('../lightning/createLightningInvoice')
const { payLightingInvoice } = require('../lightning/payLightingInvoice')
const LightningWallet = require('../models/LightningWallet')
const AdminData = require('../models/Admin')
const UtilityCosts = require('../models/UtilityCosts')
const { decrypt } = require('../security/encrypt')
const { currencyConvertor } = require('../utils/currencyConvertor')
const { getCelloDollarBalance } = require('../utils/getCelloDollarBalance')
const { getUsdtBalance } = require('../utils/getUsdtBalance')
const { celoProviderUrl } = require('../settings/settings')
require('dotenv').config()

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const buyData = async (payType, dataAmount, phoneNumber, currentUser) => {
  try {
    let response
    switch (payType) {
      case 'BTC':
        // Step 0: Check the user BTC Balance...
        const balance = await checkBalance('BTC', phoneNumber)

        if (balance <= 0.0) {
          sendSMS(
            `You dont have enough BTC balance to buy this bundle`,
            phoneNumber
          )
          return
          // break
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
        // break

        sendSMS(
          `Shuku ${currentUser.name}, You have successfully bought ${dataAmount} using ${payType}`,
          phoneNumber
        )
        return
      case 'USDT':
        console.log('Purchase with USDT ----')
        createDbCollections()
        // Step 0: Check the user USDT Balance...
        const usdtBalance = await checkBalance('USDT', phoneNumber)
        console.log('USDT BALANCE', usdtBalance)

        if (usdtBalance <= 0.0) {
          sendSMS(
            `You dont have enough USDT balance to buy this bundle`,
            phoneNumber
          )
          // console.log('You do not have enough USDT to buy this bundle')
          return
          // break
        }

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

        // console.log(`Buying ${dataAmount} with ${payType}`)
        sendSMS(
          `Shuku ${currentUser.name}, You have successfully bought ${dataAmount} using ${payType}`,
          phoneNumber
        )
        return

      case 'cUSD':
        console.log('Purchase with cUSD ----')
        sendSMS(
          `Shuku ${currentUser.name}, You have successfully bought ${dataAmount} using ${payType}`,
          phoneNumber
        )

        // Step 0: Check the user USDT Balance...
        const cusdBalance = await checkBalance('CUSD', phoneNumber)
        // const cusdBalance = await getCelloDollarBalance(phoneNumber)
        console.log('CUSD BALANCE', cusdBalance)

        if (cusdBalance <= 0.0) {
          sendSMS(
            `You dont have enough Celo Dollar balance to buy this bundle`,
            phoneNumber
          )
          // console.log('You do not have enough cUSD to buy this bundle')
          return
        }

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

        const result = await payToAdmin('CUSD', currentUser, cusdConvertedToUsd)
        console.log('TX Status: ', result)

        sendSMS(
          `Shuku ${currentUser.name}, You have successfully bought ${dataAmount} using ${payType}`,
          phoneNumber
        )
        return
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
        let cUSDtoken = await kit.contracts.getStableToken()

        const admin = await AdminData.findOne()
        // Get the current user / payer passkey
        const dbPrivateKey = currentUser.passKey

        // Decrypt the passKey
        const privateKey = await decrypt(dbPrivateKey)

        const convertedEthAmount = ethers.utils.parseEther(amount)

        // tx object
        await kit.connection.addAccount(privateKey)

        let txRecipt
        // send
        // const result = await signedWallet.sendTransaction(tx)
        const result = await cUSDtoken
          .transfer(admin.evmAddress, convertedEthAmount)
          .send({ from: currentUser.address })

        // txRecipt = await result.wait(1)
        txRecipt = await result.waitReceipt()

        console.log('Pay with Celo', txRecipt)

        return txRecipt
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
    const fee = Number(result.cost) * (1 / 100)
    const cost = fee + result.cost
    return { cost, ...result }
  } catch (error) {
    console.log(error)
    return error
  }
}

module.exports = {
  buyData,
}
