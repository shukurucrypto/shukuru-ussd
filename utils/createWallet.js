const ethers = require('ethers')
const User = require('../models/User.js')
const Assets = require('../models/Assets.js')

const { encrypt } = require('../security/encrypt.js')
const {
  getCreateUserWalletInfo,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const sendSMS = require('../SMS/smsFunctions.js')
const { providerRPCURL } = require('../settings/settings.js')
const { createBitcoinWallet } = require('../functions/createBitcoinWallet.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { createLightningWallet } = require('../lightning/createWallet.js')
const LightningWallet = require('../models/LightningWallet.js')
const { getUserCurrency } = require('../functions/getUserCurrency.js')
require('dotenv').config()

// const provider = new ethers.providers.InfuraProvider(
//   "rinkeby",
//   process.env.INFURA_SECRET
// );

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

async function createWalletSigner(userText, phoneNumber) {
  // console.log(`Create wallet called....`)
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    if (currentUser) {
      response = `END Hi, ${currentUser.name}!\n`
      response += `You already have a Shukuru crypto wallet.\n`
      response += `Address: ${truncateAddress(currentUser.address)}\n`
      return response
    } else {
      // Check to see if the user already has a wallet
      const { name, walletPin } = await getCreateUserWalletInfo(userText)

      // Lets first encrypt the walletPin
      const encryptedWalletPin = await encrypt(walletPin)

      const wallet = await ethers.Wallet.createRandom()
      // check if user with this phoneNumber exists

      const createdWallet = await new ethers.Wallet(wallet.privateKey, provider)

      // Create a Bitcoin wallet
      const { address, privateKey } = await createBitcoinWallet()

      // console.log(address)
      // console.log(privateKey)

      const encryptedPassKey = await encrypt(wallet.privateKey)
      const encryptedMnemonic = await encrypt(wallet.mnemonic.phrase)

      // Encrypt BTC private Key
      const encryptedBTCPrivateKey = await encrypt(privateKey.toString())

      // Create lightning wallet for the user
      const lightningWallet = await createLightningWallet(name)

      // Get the user default currency
      const currency = await getUserCurrency(phoneNumber)

      // // save the wallet to the database
      const user = new User({
        name: name,
        walletPin: encryptedWalletPin,
        phoneNumber: phoneNumber,
        address: createdWallet.address,
        btcAddress: address.toString(),
        passKey: encryptedPassKey,
        mnemonic: encryptedMnemonic,
        country: currency,
      })

      const res = await user.save()

      // console.log(lightningWallet)

      // Encrypt lightning admin and in Key
      const encryptedLightningAdminKey = await encrypt(
        lightningWallet.wallets[0].adminkey
      )
      const encryptedLightningInKey = await encrypt(
        lightningWallet.wallets[0].inkey
      )

      // Save the user to lightning address
      const lightningUserWallet = new LightningWallet({
        user: res._id,
        i_id: lightningWallet.id,
        adminKey: encryptedLightningAdminKey,
        inKey: encryptedLightningInKey,
      })

      // Save to user screts Schema
      const userSecrets = new AccountSecrets({
        user: res._id,
        eth: encryptedPassKey,
        btc: encryptedBTCPrivateKey,
      })
      // Save to the secrets schema
      await userSecrets.save()
      await lightningUserWallet.save()

      if (res) {
        // create BTC and USDT assets for the user
        const btcAsset = new Assets({
          user: res._id,
          name: 'Bitcoin',
          symbol: 'BTC',
          balance: 0.0,
          address: {
            live: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            test: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
          },
        })
        const usdtAsset = new Assets({
          user: res._id,
          name: 'Tether',
          symbol: 'USDT',
          balance: 0.0,
          address: {
            live: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            test: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          },
        })

        const ethAsset = new Assets({
          user: res._id,
          name: 'Wrapped Ether',
          symbol: 'WETH',
          balance: 0.0,
          address: {
            live: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            test: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          },
        })

        await btcAsset.save()
        await usdtAsset.save()
        await ethAsset.save()

        await sendSMS(
          `Welcome to Shukuru ${name}, your crypto and lightning wallet was successfully created`,
          phoneNumber
        )
      }

      response = `END Your wallet was successfully created\n`
      response += `Please wait for a confirmation SMS\n`

      // console.log(`Wallet Address: ${createdWallet.address}`)
      // console.log(`Wallet PK: ${wallet.privateKey}`)
      // console.log(`BTC Address: ${address}`)
      // console.log(`BTC PK: ${privateKey}`)

      return response
    }
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  createWalletSigner,
}
