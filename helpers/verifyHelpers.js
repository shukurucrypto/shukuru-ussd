const redisClient = require('../config/redisConfig')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const dotenv = require('dotenv')
dotenv.config()

const sendUserOTPEmailCode = async (email, userId) => {
  const transporter = nodemailer.createTransport({
    host: `smtp.gmail.com`,
    port: 465,
    secure: true,
    auth: {
      user: 'jovanmwesigwa79@gmail.com',
      pass: process.env.EMAIL_PASSKEY,
    },
    debug: true,
  })

  const generatedOTP = await otpGenerator.generate(6, {
    upperCaseAlphabets: true,
    specialChars: false,
  })

  const otp = generatedOTP.toLocaleUpperCase()

  // Send the otp code to the user email
  transporter.sendMail({
    from: '"Jovan from Shukuru 👻" <jovanmwesigwa79@gmail.com>', // sender address
    to: email, // list of receivers
    subject: 'Reset Password ✔', // Subject line
    text: 'Your OTP password reset code is ' + otp, // plain text body
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; background-color: #facc14; color: #000; margin: 0; padding: 24px;">

        <div style="width: 25px, height: 25px; border-radius: 25px; background-color: #fff; padding: 4px;">
            <img src="https://widget-shukuru.vercel.app/_next/image?url=%2Flogo.png&w=48&q=75" alt="Shukuru Logo" style="width: 25px; height: 25px;" >
        </div>

            <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);">
                <tr>
                    <td style="padding: 20px;">
                        <h1 style="font-size: 24px; color: #000;">Password Reset</h1>
                        <p style="font-size: 16px; color: #333;">You have requested to reset your password. Use the following OTP code:</p>
                        <div style="background-color: #facc14; padding: 10px; border-radius: 5px; margin: 20px 0;">
                            <p style="font-size: 20px; color: #000; font-weight: bold;">OTP: ${otp}</p>
                        </div>
                        <p style="font-size: 12px; color: #333;">Please enter the OTP code in your app to reset your password. If you didn't request this, you can safely ignore this email.</p>
                    </td>
                </tr>
            </table>

            <p style="font-size: 12px; margin-top: 12px;">This email was sent to you by Shukuru. &copy; 2023. All rights reserved.</p>

        </body>
        </html>
      `,
  })

  // save the generated OTP code to the redis cache
  await redisClient.set(`user-otp:${userId}`, otp, {
    EX: 3600,
  })
}

module.exports = {
  sendUserOTPEmailCode,
}
