const { ethers } = require('ethers')
const BUSDABI = require('./abiData/erc20.json')
const { bscProviderURL, busdAddress } = require('./settings/settings')

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)

async function test() {
  // Create a new transaction object
  const transaction = {
    to: '0xce5Af15d59434EffB35237C7Fdf394d4e4FfC679',
    value: ethers.utils.parseEther('0.049301752899959649'), // Set the value in ether
  }

  // Estimate the gas required for the transaction
  provider
    .estimateGas(transaction)
    .then((gasEstimate) => {
      console.log('Gas Estimate:', gasEstimate.toString())
      console.log(
        'Gas Fee:',
        ethers.utils.formatUnits(gasEstimate, 'gwei'),
        'gwei'
      )
    })
    .catch((error) => {
      console.error('Error estimating gas:', error)
    })
}

test()

// const axios = require('axios')

// const options = {
//   method: 'POST',
//   url: 'https://onesignal.com/api/v1/notifications',
//   headers: {
//     accept: 'application/json',
//     Authorization: 'Basic MzE1NDBmMjItNzRiOS00MGYwLWE1MDQtNzNkMGE2MzMwOGIy',
//     'content-type': 'application/json',
//   },
//   data: {
//     app_id: 'bdb34439-82ae-4091-bcb3-664874f10810',
//     // app_id: 'bdb34439-82ae-4091-bcb3-664874f10810',
//     // include_player_ids: ['6bac8ac3-f7b8-4017-8ee5-36f60588e731'],
//     include_external_user_ids: ['645f30dcf686496260b20340'],
//     headings: {
//       en: 'You sent a payment!',
//       es: 'You sent a payment!',
//     },
//     contents: {
//       en: 'Payment done with your card! 😎',
//       es: 'Payment sent',
//     },
//     name: 'Payments',
//     small_icon: 'ic_stat_onesignal_default',
//   },
// }

// axios
//   .request(options)
//   .then(function (response) {
//     console.log(response.data)
//   })
//   .catch(function (error) {
//     console.error(error.message)
//   })
