const ActiveTransactions = require('../models/ActiveTransactions')
const User = require('../models/User')

const createTxState = async (assetName, phoneNumber) => {
  try {
    const currentUser = await User.findOne({ phoneNumber: phoneNumber })

    if (currentUser) {
      const activeTx = await ActiveTransactions.findOne({
        user: currentUser._id,
      })
      //   console.log(`Active asset: ${activeTx}`)
      // console.log(`Current user: ${currentUser}`)
      if (activeTx) {
        // change the activeTx state name
        activeTx.asset.name = assetName
        // activeTx.completed = true
        const res = await activeTx.save()
        return res.asset
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

const getActiveTx = async (phoneNumber) => {
  try {
    const currentUser = await User.findOne({ phoneNumber })
    if (currentUser) {
      const activeTx = await ActiveTransactions.findOne({
        user: currentUser._id,
        completed: false,
      })
      if (activeTx) {
        return activeTx
      } else {
        return null
      }
    } else {
      return null
    }
  } catch (err) {
    console.log(err)
  }
}

const setNextStep = async (activeTx) => {
  try {
    const res = await ActiveTransactions.findOneAndUpdate(
      { _id: activeTx._id },
      { $inc: { step: 2 } }
    )
    return res.step
  } catch (err) {
    console.log(err.message)
  }
}

const acceptGasFees = async (activeTx) => {
  try {
    const res = await ActiveTransactions.findOneAndUpdate(
      { _id: activeTx._id },
      { $set: { accepted: true } }
    )
    return res.accepted
  } catch (err) {
    console.log(err.message)
  }
}

const removeActiveTx = async (phoneNumber) => {
  try {
    const res = await ActiveTransactions.findOneAndDelete({
      phoneNumber: phoneNumber,
    })
    return res
  } catch (err) {
    console.log(err.message)
  }
}

module.exports = {
  createTxState,
  getActiveTx,
  setNextStep,
  removeActiveTx,
  acceptGasFees,
}
