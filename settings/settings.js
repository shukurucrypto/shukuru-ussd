require('dotenv').config()

const { HARDHAT_RPC, RINKEBY_RPC_URL, ROPSTEN_URL, POLYGON_MUMBAI, NETWORK } =
  process.env

const providerRPCURL = HARDHAT_RPC
const networkServer = 1

module.exports = {
  providerRPCURL,
  networkServer,
}
