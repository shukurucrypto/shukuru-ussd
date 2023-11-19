const Transaction = require('../models/Transaction')
const User = require('../models/User')
const UserTransactions = require('../models/UserTransactions')
const { boltGETRequest } = require('./boltRequests')

const boltSendSatsHelper = async (data) => {
  try {
    const { from, to, invoice, amount, userId, bolt, r_hash } = data

    const sender = await User.findById(userId)

    let reciever

    reciever = await User.findOne({ name: to })

    const boltReqData = {
      payment_hash: invoice,
      r_hash,
    }

    // Pay the invoice here..
    // Here we first check to see in there's an invoice passed,
    // 1. No-Invoice means it's an in house payment which won't need an invoice
    // 2. Invoice means there's an invoice so we can pay using that
    if (!invoice) {
      const inhouseReqData = {
        reciever: to,
        amount,
      }

      const houseBoltInstance = await boltGETRequest(
        inhouseReqData,
        bolt,
        '/invoice/house/pay'
      )

      if (!houseBoltInstance.success) return houseBoltInstance
    } else {
      const boltInstance = await boltGETRequest(
        boltReqData,
        bolt,
        '/invoice/pay'
      )

      if (!boltInstance.success) return boltInstance
    }

    if (reciever) {
      // if (invoice) {
      //   const activeInvoice = await ActiveInvoice.findOne({
      //     hash: invoice,
      //   })

      //   reciever = await User.findById(activeInvoice.user._id)
      // }

      // Create TX Objects here...
      const senderTx = await new Transaction({
        sender: sender._id,
        receiver: reciever._id,
        currency: sender.country,
        asset: 'Lightning',
        amount: amount,
        txType: 'sent',
        phoneNumber: reciever.phoneNumber,
      })

      const recieverTx = await new Transaction({
        sender: sender._id,
        receiver: reciever._id,
        currency: sender.country,
        asset: 'Lightning',
        amount: amount,
        txType: 'recieved',
        phoneNumber: sender.phoneNumber,
      })

      const tx = await senderTx.save()

      const toTx = await recieverTx.save()

      // Check to see if the user has a UserTransactions table
      const userTx = await UserTransactions.findOne({ user: sender._id })

      const receiverTx = await UserTransactions.findOne({
        user: reciever._id,
      })

      await userTx.transactions.push(tx._id)

      await receiverTx.transactions.push(toTx._id)

      await receiverTx.save()
      await userTx.save()

      return {
        success: true,
        status: 200,
        tx,
      }
    }

    // Create TX Objects here...
    const senderTx = await new Transaction({
      sender: sender._id,
      receiver: 'External',
      currency: sender.country,
      asset: 'Lightning',
      amount: amount,
      txType: 'sent',
      phoneNumber: 'External payment',
    })

    const tx = await senderTx.save()

    // Check to see if the user has a UserTransactions table
    const userTx = await UserTransactions.findOne({ user: sender._id })

    await userTx.transactions.push(tx._id)

    await userTx.save()

    return {
      success: true,
      status: 200,
      tx,
    }
  } catch (error) {
    return error
  }
}

module.exports = {
  boltSendSatsHelper,
}
