const ethers = require('ethers')
const User = require('../models/User.js')
const Assets = require('../models/Assets.js')
const UserTransactions = require('../models/UserTransactions.js')

const Redis = require('redis')
const { encrypt, decrypt } = require('../security/encrypt.js')
const {
  getCreateUserWalletInfo,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const jwt = require('jsonwebtoken')

const passport = require('passport-local')
const sendSMS = require('../SMS/smsFunctions.js')
const { providerRPCURL, celoProviderUrl } = require('../settings/settings.js')
const { createBitcoinWallet } = require('../functions/createBitcoinWallet.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { createLightningWallet } = require('../lightning/createWallet.js')
const LightningWallet = require('../models/LightningWallet.js')
const { getUserCurrency } = require('../functions/getUserCurrency.js')
const { newSignup } = require('../sockets/sockets.js')
const { Masa } = require('@masa-finance/masa-sdk')

require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(celoProviderUrl)
const redisClient = Redis.createClient()
const DEFAULT_REDIS_EXPIRATION = 36000

async function createApiUser(req, res) {
  try {
    const { username, phone, email, password, accountType, country } = req.body
    let token

    const currentUser = await User.findOne({ phoneNumber: phone })

    if (currentUser) {
      return res.json({
        response: 'User with account already exists',
      })
    }

    // Encrypt the password of the user
    const encryptedPassword = await encrypt(password)

    // Check to see if the user already has a wallet
    // const { name, walletPin } = await getCreateUserWalletInfo(userText)

    // Lets first encrypt the walletPin
    // const encryptedWalletPin = await encrypt(walletPin)

    const wallet = await ethers.Wallet.createRandom()
    // check if user with this phoneNumber exists

    const createdWallet = await new ethers.Wallet(wallet.privateKey, provider)

    // Create a Bitcoin wallet
    const { address, privateKey } = await createBitcoinWallet()

    const encryptedPassKey = await encrypt(wallet.privateKey)
    const encryptedMnemonic = await encrypt(wallet.mnemonic.phrase)

    // Encrypt BTC private Key
    const encryptedBTCPrivateKey = await encrypt(privateKey.toString())

    // Create lightning wallet for the user
    const lightningWallet = await createLightningWallet(username)

    // // save the wallet to the database
    const user = new User({
      name: username,
      //   walletPin: encryptedWalletPin,
      email: email,
      password: encryptedPassword,
      phoneNumber: phone,
      accountType: accountType,
      address: createdWallet.address,
      btcAddress: address.toString(),
      passKey: encryptedPassKey,
      mnemonic: encryptedMnemonic,
      country: country,
    })

    const savedUser = await user.save()

    // Create jwt here...
    token = await jwt.sign(
      { userId: savedUser._id, phoneNumber: savedUser.phoneNumber },
      process.env.ENCRYPTION_KEY
    )

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
      user: savedUser._id,
      i_id: lightningWallet.id,
      adminKey: encryptedLightningAdminKey,
      walletId: lightningWallet.wallets[0].id,
      inKey: encryptedLightningInKey,
    })

    // Save to user screts Schema
    const userSecrets = new AccountSecrets({
      user: savedUser._id,
      eth: encryptedPassKey,
      btc: encryptedBTCPrivateKey,
    })

    const userTx = new UserTransactions({
      user: savedUser._id,
    })

    // Save to the secrets schema
    await userSecrets.save()
    await lightningUserWallet.save()

    await userTx.save()

    if (savedUser) {
      // create BTC and USDT assets for the user
      const btcAsset = new Assets({
        user: savedUser._id,
        name: 'Bitcoin',
        symbol: 'BTC',
        balance: 0.0,
        address: {
          live: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          test: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
        },
      })
      const usdtAsset = new Assets({
        user: savedUser._id,
        name: 'Tether',
        symbol: 'USDT',
        balance: 0.0,
        address: {
          live: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          test: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        },
      })

      const ethAsset = new Assets({
        user: savedUser._id,
        name: 'Tether',
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
    }

    // newSignup(res)
    return res.status(201).json({
      success: true,
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        token: token,
        phone: savedUser.phoneNumber,
      },
    })
  } catch (error) {
    console.log(error.message)
    return res.json(error.message)
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body

    const existingUser = await User.findOne({ name: username })

    if (!existingUser) {
      return res.json({ response: 'username or password incorrect' })
    }

    // Check the encrypted password
    const decryptedPassword = await decrypt(existingUser.password)

    if (decryptedPassword != password) {
      return res.json({ response: 'username or password incorrect' })
    }

    const token = await jwt.sign(
      { userId: existingUser._id, phoneNumber: existingUser.phoneNumber },
      process.env.ENCRYPTION_KEY
    )

    return res.status(201).json({
      success: true,
      data: {
        userId: existingUser._id,
        email: existingUser.email,
        token: token,
        phone: existingUser.phoneNumber,
      },
    })
  } catch (error) {
    console.log(error.message)
    return res.json(error.message)
  }
}

async function verifyPhone(req, res) {
  try {
    const { userId } = req.user

    const { phoneNumber } = req.body

    const existingUser = await User.findById(userId)

    // Decrypt the passKey
    const privateKey = await decrypt(existingUser.passKey)

    const wallet = new ethers.Wallet(privateKey, provider)

    const masa = new Masa({
      signer: wallet,
      networkName: process.env.MASA_NETWORK_NAME,
    })

    // Login user
    await masa.session.login()

    const fullPhone = `+${phoneNumber}`

    const generateResult = await masa.green.generate(fullPhone)

    if (generateResult.success) {
      return res.status(200).json({
        success: true,
        response: 'Verified',
        data: generateResult.data,
      })
    } else {
      return res.status(204).json({
        success: false,
        response: 'failed',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function verifyCode(req, res) {
  try {
    const { userId } = req.user

    const { phoneNumber, code } = req.body

    const existingUser = await User.findById(userId)

    // Decrypt the passKey
    const privateKey = await decrypt(existingUser.passKey)

    const wallet = new ethers.Wallet(privateKey, provider)

    const masa = new Masa({
      signer: wallet,
      networkName: process.env.MASA_NETWORK_NAME,
    })

    // const userCode = await readLine(code)

    await masa.session.login()

    const fullPhone = `+${phoneNumber}`

    const verifyGreenResult = await masa.green.verify(fullPhone, code)

    if (!verifyGreenResult?.success) {
      console.error(`Verifying Green failed! '${verifyGreenResult?.message}'`)

      return res.status(204).json({
        success: false,
        response: verifyGreenResult?.message,
      })
    }

    existingUser.verified = true
    await existingUser.save()

    return res.status(200).json({
      success: true,
      response: 'Verified',
      data: verifyGreenResult,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function checkVerify(req, res) {
  try {
    const { userId } = req.user

    const existingUser = await User.findById(userId)

    // Decrypt the passKey
    const privateKey = await decrypt(existingUser.passKey)

    const wallet = new ethers.Wallet(privateKey, provider)

    const masa = new Masa({
      signer: wallet,
      networkName: process.env.MASA_NETWORK_NAME,
    })

    // const userCode = await readLine(code)

    await masa.session.login()

    const greens = await masa.green.list()

    if (greens.length === 0) {
      console.warn('No Masa Green found')
      return res.status(204).json({
        success: false,
        response: 'No Masa Green found',
      })
    }

    let i = 1
    for (const green of greens) {
      console.log(`Token: ${i}`)
      console.log(`Token ID: ${green.tokenId}`)
      i++
      if (green.metadata) {
        console.log(`Metadata: ${JSON.stringify(green.metadata, null, 2)}`)
      }
    }

    return res.status(200).json({
      success: true,
      response: 'Verified',
      // data: verifyGreenResult,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

module.exports = {
  createApiUser,
  login,
  verifyPhone,
  verifyCode,
  checkVerify,
}
