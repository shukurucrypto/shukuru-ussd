const Invoices = require('../models/Invoices')

const getInvoice = async (req, res) => {
  try {
    const { hash } = req.body

    const invoice = await Invoices.findOne({ paymentHash: hash })

    if (!invoice) {
      return res.send({
        status: 404,
        response: 'We could not that invoice',
      })
    }

    return res.send({
      status: 200,
      response: invoice,
    })
  } catch (error) {
    res.send(error.message)
    return error.message
  }
}

module.exports = {
  getInvoice,
}
