const axios = require('axios')

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
    // app_id: 'bdb34439-82ae-4091-bcb3-664874f10810',
    // include_player_ids: ['6bac8ac3-f7b8-4017-8ee5-36f60588e731'],
    include_external_user_ids: ['645f30dcf686496260b20340'],
    headings: {
      en: 'You sent a payment!',
      es: 'You sent a payment!',
    },
    contents: {
      en: 'Payment done with your card! 😎',
      es: 'Payment sent',
    },
    name: 'Payments',
    small_icon: 'ic_stat_onesignal_default',
  },
}

axios
  .request(options)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.error(error.message)
  })
