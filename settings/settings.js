require('dotenv').config()

const { HARDHAT_RPC, RINKEBY_RPC_URL, ROPSTEN_URL, POLYGON_MUMBAI } =
  process.env

const providerRPCURL = RINKEBY_RPC_URL

module.exports = {
  providerRPCURL,
}
