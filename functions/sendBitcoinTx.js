// import bitcore
const bitcore = require('bitcore-lib')
const axios = require('axios')

const network = 'BTCTEST'

let inputs = []

let totalAmountAvailable = 0

const sendBitcoinTx = async (address, privateKey, recieverAddress, amount) => {
  try {
    let satoshiToSend = amount * 100000000
    let fee = 0
    let inputCount = 0
    let outputCount = 2
    let utxo = {
      txId: '',
      satoshis: 0,
      script: '',
      address: '',
      amount: 0,
      outputIndex: 0,
    }

    // Get address transactions
    const result = await axios.get(
      `https://sochain.com/api/v2/get_tx_unspent/${network}/${address}`
    )
    const inputsAddress = result.data.data.address
    // const inputsNetwork = result.data.data.network

    result.data.data.txs.forEach((element) => {
      utxo.txId = element.txid
      utxo.satoshis = Math.floor(Number(element.value) * 100000000)
      utxo.script = element.script_hex
      utxo.address = inputsAddress
      // utxo.amount = element.value
      utxo.outputIndex = element.output_no
      totalAmountAvailable += utxo.satoshis
      inputCount += 1

      inputs.push(utxo)
    })

    // See the transaction size
    const transactionSize =
      inputCount * 146 + outputCount * 34 + 10 - inputCount

    fee = transactionSize * 20
    // Check if we have enough funds to cover the transaction and the fees
    if (totalAmountAvailable - amount - fee < 0) {
      throw new Error('Balance is too low for this transaction')
    }

    // Create a transaction
    const tx = new bitcore.Transaction()
      .from(inputs)
      .to(recieverAddress, satoshiToSend) // In satoshis
      .fee(bitcore.Unit.fromBTC(fee).toSatoshis() * 20) // In satoshis
      .change(address) // Return the change to the same address
      // .addData() // Add metadata to the transaction
      .sign(privateKey)

    const serializedTx = tx.uncheckedSerialize()
    // console.log('HERE ------------>', tx)
    const data = { tx_hex: serializedTx }

    // broadcast transaction to the Bitcoin test network
    const broadcastedTx = await axios.post(
      `https://sochain.com/api/v2/send_tx/${network}`,
      data
    )

    // console.log(broadcastedTx.data.data)
    return broadcastedTx.data.data
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  sendBitcoinTx,
}
