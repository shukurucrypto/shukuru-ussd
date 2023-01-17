const AdminData = require('../models/Admin')
const UtilityCosts = require('../models/UtilityCosts')

const createUtility = async () => {
  await UtilityCosts.create({
    type: 'Data',
    package: '70MB',
    countryCurrency: 'UGX',
    network: 'Airtel',
    cost: 500,
  })
}

const createDbCollections = async () => {
  console.log('Creating admin address....')
  await AdminData.create({
    evmAddress: '0x5CBDf5f9E468dF3888e04155668CcAfC6F6C4dcf',
  })
}

module.exports = {
  createUtility,
  createDbCollections,
}
