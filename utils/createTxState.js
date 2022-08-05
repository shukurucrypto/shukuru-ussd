const ActiveTransactions = require('../models/ActiveTransactions')
const User = require('../models/User')

const createTxState = async (assetName, phoneNumber) => {
  try {
    const currentUser = await User.findOne({ phoneNumber })

    if (currentUser) {
      const activeTx = await ActiveTransactions.findOne({
        user: currentUser._id,
      })
      if (activeTx) {
        // change the activeTx state name
        activeTx.asset.name = assetName
        // activeTx.completed = true
      } else {
        const tx = new ActiveTransactions({
          user: currentUser._id,
          asset: {
            name: assetName,
          },
          completed: false,
        })
        const res = await tx.save()
        // response = `END You have an active transaction`
        return res.asset
      }
    } else {
      return null
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports = createTxState
