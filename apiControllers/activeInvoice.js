const ActiveInvoice = require('../models/ActiveInvoice')

const getActiveInvoice = async (req, res) => {
  try {
    const { hash } = req.body

    const result = await ActiveInvoice.findOne({ hash })

    if (!result) {
      return res.status(404).json({
        response: 'Invoice not found',
      })
    }

    // Create the active invoice
    return res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const createActiveInvoice = async (req, res) => {
  try {
    const { user, hash, amount } = req.body

    // Create the active invoice
    const result = new ActiveInvoice({
      user: user,
      hash: hash,
      amount: amount,
    })

    const created = await result.save()

    return res.status(201).json({
      success: true,
      data: created,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

module.exports = {
  createActiveInvoice,
  getActiveInvoice,
}
