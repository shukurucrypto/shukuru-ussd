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
const { Masa } = require('@masa-finance/masa-sdk')
const { boltBarePOSTRequest } = require('../helpers/boltRequests.js')

require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

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

    const generatedEmail = username + '@shukuru.com'

    let data = {
      name: username,
      email: generatedEmail,
      password: password,
    }
    // Save the user to bolt here...
    const boltInstance = await boltBarePOSTRequest(data, '/users')

    if (!boltInstance.success)
      return res
        .status(403)
        .json({ success: false, error: 'Failed to create account' })

    // Encrypt the password of the user
    const encryptedPassword = await encrypt(password)

    const wallet = await ethers.Wallet.createRandom()
    // check if user with this phoneNumber exists

    const createdWallet = await new ethers.Wallet(wallet.privateKey, provider)

    const encryptedPassKey = await encrypt(wallet.privateKey)
    const encryptedMnemonic = await encrypt(wallet.mnemonic.phrase)

    // // save the wallet to the database
    const user = new User({
      name: username,
      email: email,
      password: encryptedPassword,
      phoneNumber: phone,
      accountType: accountType,
      address: createdWallet.address,
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

    // Save to user screts Schema
    const userSecrets = new AccountSecrets({
      user: savedUser._id,
      eth: encryptedPassKey,
    })

    const userTx = new UserTransactions({
      user: savedUser._id,
    })

    // Save to the secrets schema
    await userSecrets.save()

    await userTx.save()

    // newSignup(res)
    return res.status(201).json({
      success: true,
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        token: token,
        bolt: boltInstance.token,
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

    let data = {
      name: username,
      password: password,
    }

    let boltInstance

    // Check if user exists in bolt backend. If they do just log them in, if they don't create an account for them...
    const exists = await boltBarePOSTRequest({ username }, '/users/raw')

    if (exists.success) {
      // The user has a bolt account, we can just log them in from here
      // Save the user to bolt here...
      boltInstance = await boltBarePOSTRequest(data, '/auth/login/')

      if (!boltInstance.success)
        return res
          .status(403)
          .json({ success: false, error: 'Failed to create account' })
    } else {
      const generatedEmail = username + '@shukuru.com'

      let userData = {
        name: username,
        email: generatedEmail,
        password: password,
      }

      // Save the user to bolt here...
      boltInstance = await boltBarePOSTRequest(userData, '/users')

      if (!boltInstance.success)
        return res
          .status(403)
          .json({ success: false, error: 'Failed to create bolt account' })
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
        bolt: boltInstance.token,
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

async function createBTCApiUser(req, res) {
  try {
    const { username, phone, email, password, accountType, country } = req.body
    let token

    const currentUser = await User.findOne({ phoneNumber: phone })

    if (currentUser) {
      return res.json({
        response: 'User with account already exists',
      })
    }

    // here,...

    // Encrypt the password of the user
    const encryptedPassword = await encrypt(password)

    // Create lightning wallet for the user
    const lightningWallet = await createLightningWallet(username)

    // // save the wallet to the database
    const user = new User({
      name: username,
      email: email,
      password: encryptedPassword,
      phoneNumber: phone,
      accountType: accountType,
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
      btc: '0x',
      eth: '0xbtc',
    })

    const userTx = new UserTransactions({
      user: savedUser._id,
    })

    // Save to the secrets schema
    await userSecrets.save()
    await lightningUserWallet.save()

    await userTx.save()

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
module.exports = {
  createApiUser,
  login,
  verifyPhone,
  verifyCode,
  checkVerify,
  createBTCApiUser,
}
