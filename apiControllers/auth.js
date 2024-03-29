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
const redisClient = require('../config/redisConfig.js')
const { sendUserOTPEmailCode } = require('../helpers/verifyHelpers.js')

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
      return res.status(403).json({
        success: false,
        error: 'Failed to create account ' + boltInstance.response.data.error,
      })

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

    const cleanedUser = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      country: savedUser.country,
      accountType: savedUser.accountType,
      verified: savedUser.verified,
      balance: savedUser.balance,
      btcBalance: savedUser.btcBalance,
      address: savedUser.address,
      phoneNumber: savedUser.phoneNumber,
    }

    await redisClient.set(`user:${savedUser._id}`, JSON.stringify(cleanedUser))

    // Send the user an OTP to verify their email
    sendUserOTPEmailCode(savedUser.email, savedUser._id)

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

async function resetPassword(req, res) {
  try {
    const { password, code } = req.body

    const { userId } = req.user

    const currentUser = await User.findById(userId)

    // Try to find an existing UserOTP record for the user
    const existingOTP = await UserOtp.findOne({ user: userId })

    if (!existingOTP) {
      return res.status(401).json({
        success: false,
        response: 'Bad request',
      })
    }

    if (existingOTP.code != code) {
      return res.status(403).json({
        success: false,
        response: 'Invalid OTP Code',
      })
    }

    // Encrypt the password of the user
    const encryptedPassword = await encrypt(password)

    // const updatedUser = await User.findOneAndUpdate(userId, {
    //   password: encryptedPassword,
    // })

    currentUser.password = encryptedPassword

    const savedUser = await currentUser.save()

    await existingOTP.delete()

    // Create jwt here...
    token = await jwt.sign(
      { userId: savedUser._id, phoneNumber: savedUser.phoneNumber },
      process.env.ENCRYPTION_KEY
    )

    // newSignup(res)
    return res.status(201).json({
      success: true,
      response: 'Password Changed!',
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

    const user = {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      country: existingUser.country,
      accountType: existingUser.accountType,
      verified: existingUser.verified,
      balance: existingUser.balance,
      btcBalance: existingUser.btcBalance,
      address: existingUser.address,
      phoneNumber: existingUser.phoneNumber,
    }

    // Save the user to redis
    await redisClient.set(`user:${existingUser._id}`, JSON.stringify(user))

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

async function sendOtpCode(req, res) {
  try {
    const { userId } = req.user
    const { email } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        response: 'User not found',
      })
    }

    if (user.email != email) {
      return res.status(403).json({
        success: false,
        response: 'Invalid email',
      })
    }

    // Send the otp code to the user email
    sendUserOTPEmailCode(email, userId)

    return res.send()
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function sendRawOtpCode(req, res) {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    const otp = await otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    })

    // Send the otp code to the user email
    const info = await transporter.sendMail({
      from: '"Jovan from Shukuru 🟡" <jovanmwesigwa79@gmail.com>', // sender address
      to: email, // list of receivers
      subject: 'Shukuru Verification OTP Code ✔', // Subject line
      text: 'Your OTP code is ' + otp, // plain text body
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Your Requested OTP Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; background-color: #facc14; color: #000; margin: 0; padding: 24px;">

        <div style="width: 25px, height: 25px; border-radius: 25px; background-color: #fff; padding: 4px;">
            <img src="https://widget-shukuru.vercel.app/_next/image?url=%2Flogo.png&w=48&q=75" alt="Shukuru Logo" style="width: 25px; height: 25px;" >
        </div>

            <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);">
                <tr>
                    <td style="padding: 20px;">
                        <h1 style="font-size: 24px; color: #000;">Password Reset</h1>
                        <p style="font-size: 16px; color: #333;">You have requested to an OTP code for your Shukuru Wallet account:</p>
                        <div style="background-color: #facc14; padding: 10px; border-radius: 5px; margin: 20px 0;">
                            <p style="font-size: 20px; color: #000; font-weight: bold;">OTP: ${otp}</p>
                        </div>
                        <p style="font-size: 12px; color: #333;">Your requested OTP Code is here. If you didn't request this, you can safely ignore this email.</p>
                    </td>
                </tr>
            </table>

            <p style="font-size: 12px; margin-top: 12px;">This email was sent to you by Shukuru. &copy; 2024. All rights reserved.</p>

        </body>
        </html>

      `,
    })

    await redisClient.set(`user-otp:${userId}`, otp, {
      EX: 3600,
    })

    return res.send()
    // Try to find an existing UserOTP record for the user
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function verifyOtpCode(req, res) {
  try {
    const { userId } = req.user

    const { code } = req.body

    // Try to find an existing UserOTP record for the user
    // const existingOTP = await UserOtp.findOne({ user: userId })

    const existingOTP = await redisClient.get(`user-otp:${userId}`)

    if (!existingOTP) {
      return res.status(401).json({
        success: false,
        response: 'OTP expired',
      })
    }

    if (existingOTP != code) {
      return res.status(403).json({
        success: false,
        response: 'Invalid OTP Code',
      })
    }

    // Update the user's verified status in redis and the database

    const user = await User.findById(userId)

    user.verified = true

    await user.save()

    // Delete the OTP from the redis cache
    await redisClient.del(`user-otp:${userId}`)

    const cleanedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      country: user.country,
      accountType: user.accountType,
      verified: user.verified,
      balance: user.balance,
      btcBalance: user.btcBalance,
      address: user.address,
      phoneNumber: user.phoneNumber,
    }

    await redisClient.set(`user:${userId}`, JSON.stringify(cleanedUser), {
      EX: 3600,
    })

    return res.status(201).json({
      success: true,
      response: 'Validated otp code',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function updateEmail(req, res) {
  try {
    const { userId } = req.user

    const { email } = req.body

    // Try to find an existing UserOTP record for the user
    // const existingOTP = await UserOtp.findOne({ user: userId })

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        response: 'User not found',
      })
    }

    const emailOccupied = await User.findOne({ email })

    if (emailOccupied) {
      return res.status(403).json({
        success: false,
        response: 'Email already in use',
      })
    }

    user.email = email

    await user.save()

    const cleanedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      country: user.country,
      accountType: user.accountType,
      verified: user.verified,
      balance: user.balance,
      btcBalance: user.btcBalance,
      address: user.address,
      phoneNumber: user.phoneNumber,
    }

    await redisClient.set(`user:${userId}`, JSON.stringify(cleanedUser), {
      EX: 3600,
    })

    return res.status(201).json({
      success: true,
      response: 'Email updated',
    })
  } catch (error) {
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

async function verifyRawOtpCode(req, res) {
  try {
    const { code, email } = req.body

    const currentUser = await User.findOne({ email })

    const userId = currentUser._id

    // Try to find an existing UserOTP record for the user
    const existingOTP = await UserOtp.findOne({ user: userId })

    if (!existingOTP) {
      return res.status(401).json({
        success: false,
        response: 'Bad request',
      })
    }

    if (existingOTP.code != code) {
      return res.status(403).json({
        success: false,
        response: 'Invalid OTP Code',
      })
    }

    return res.status(200).json({
      success: true,
      response: 'Valid otp code',
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function resetRawPassword(req, res) {
  try {
    const { password, code, email } = req.body

    const currentUser = await User.findOne({ email })

    const userId = currentUser._id

    // Try to find an existing UserOTP record for the user
    const existingOTP = await UserOtp.findOne({ user: userId })

    if (!existingOTP) {
      return res.status(401).json({
        success: false,
        response: 'Bad request',
      })
    }

    if (existingOTP.code != code) {
      return res.status(403).json({
        success: false,
        response: 'Invalid OTP Code',
      })
    }

    // Encrypt the password of the user
    const encryptedPassword = await encrypt(password)

    // const updatedUser = await User.findOneAndUpdate(userId, {
    //   password: encryptedPassword,
    // })

    currentUser.password = encryptedPassword

    const savedUser = await currentUser.save()

    await existingOTP.delete()

    // Create jwt here...
    token = await jwt.sign(
      { userId: savedUser._id, phoneNumber: savedUser.phoneNumber },
      process.env.ENCRYPTION_KEY
    )

    // newSignup(res)
    return res.status(201).json({
      success: true,
      response: 'Password Changed!',
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
  sendOtpCode,
  verifyOtpCode,
  resetPassword,
  sendRawOtpCode,
  verifyRawOtpCode,
  resetRawPassword,
  updateEmail,
}
