const User = require('../models/User')
const { default: axios } = require('axios')

const sdk = require('api')('@onesignal/v11.0#18i3iim3olli9343r')

require('dotenv').config()

async function telegramOrder(htmlText) {
  try {
    // const htmlText = `<b>Incoming</b>, <strong>Airtel Data</strong>
    // Send +256700719619 25MB (500UGX) data.`

    const options = {
      method: 'POST',
      url: 'https://api.telegram.org/bot6268061148%3AAAGi5lzr9LRQp5jr5I5xpWfkmZlNo3268Tg/sendMessage',
      headers: {
        accept: 'application/json',
        'User-Agent':
          'Telegram Bot SDK - (https://github.com/irazasyed/telegram-bot-sdk)',
        'content-type': 'application/json',
      },
      data: {
        chat_id: '6196117698',
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        disable_notification: false,
        reply_to_message_id: 0,
      },
    }

    const result = await axios
      .request(options)
      .then(function (response) {
        return response.data
      })
      .catch(function (error) {
        return error.message
      })

    return {
      success: true,
      response: 'Order request sent',
      data: result,
    }
  } catch (error) {
    console.log(error.message)
    return {
      success: false,
      response: error.message,
    }
  }
}

const sendPushNotification = async (req, res) => {
  const options = {
    method: 'GET',
    url: 'https://onesignal.com/api/v1/notifications',
    headers: {
      accept: 'application/json',
      Authorization: 'Basic MzE1NDBmMjItNzRiOS00MGYwLWE1MDQtNzNkMGE2MzMwOGIy',
      'content-type': 'application/json',
    },
  }

  const result = await axios
    .request(options)
    .then(function (response) {
      console.log(response.data)
      return response.data
    })
    .catch(function (error) {
      console.error(error)
      return error
    })

  res.send(result)
}

const sendUserPush = async (req, res) => {
  try {
    const { user, msg, name } = req.body

    const targetedUser = await User.findOne({ name: user })

    if (!targetedUser) {
      return res
        .status(404)
        .json({ success: false, response: 'User not found' })
    }

    const result = await sendPush(targetedUser._id, msg, name)

    res.status(200).json({ success: true, response: result })
  } catch (error) {
    return res.status(500).json({ success: false, response: error.message })
  }
}

const sendPush = async (userId, msg, name) => {
  try {
    const options = {
      method: 'POST',
      url: 'https://onesignal.com/api/v1/notifications',
      headers: {
        accept: 'application/json',
        Authorization: 'Basic MzE1NDBmMjItNzRiOS00MGYwLWE1MDQtNzNkMGE2MzMwOGIy',
        'content-type': 'application/json',
      },
      data: {
        app_id: 'bdb34439-82ae-4091-bcb3-664874f10810',

        include_external_user_ids: [userId],
        contents: {
          en: msg,
        },
        name,
      },
    }

    const result = await axios
      .request(options)
      .then(function (response) {
        return response.data
      })
      .catch(function (error) {
        return error
      })

    return result
  } catch (error) {
    return error
  }
}

module.exports = {
  telegramOrder,
  sendPushNotification,
  sendUserPush,
  sendPush,
}
