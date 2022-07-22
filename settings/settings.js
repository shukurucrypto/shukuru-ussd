require('dotenv').config()

const { HARDHAT_RPC, RINKEBY_RPC_URL, ROPSTEN_URL } = process.env

const providerRPCURL = HARDHAT_RPC

module.exports = {
  providerRPCURL,
}
