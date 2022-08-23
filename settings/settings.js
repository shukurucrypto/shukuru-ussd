require('dotenv').config()

const {
  HARDHAT_RPC,
  RINKEBY_RPC_URL,
  ROPSTEN_URL,
  POLYGON_MUMBAI,
  NETWORK,
  GOERLI_RPC_URL,
  POLYGON_MAINET,
} = process.env

const providerRPCURL = GOERLI_RPC_URL
const networkServer = 1
const ENVIRONMENT = 'testnet'
const network = {
  name: 'goerli',
  chainID: 5,
}

module.exports = {
  providerRPCURL,
  networkServer,
  network,
  ENVIRONMENT,
}
