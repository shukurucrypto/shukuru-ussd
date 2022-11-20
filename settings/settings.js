require('dotenv').config()

const {
  HARDHAT_RPC,
  RINKEBY_RPC_URL,
  ROPSTEN_URL,
  POLYGON_MUMBAI,
  NETWORK,
  GOERLI_RPC_URL,
  POLYGON_MAINET,
  ARBITRUM_GOERLI,
  ARBITRUM_MAINET,
  CELO_TESTNET,
  CELO_MAINNET
} = process.env

const providerRPCURL = ARBITRUM_MAINET
const celoProviderUrl = CELO_TESTNET

const networkServer = 1
const ENVIRONMENT = 'testnet'
const network = {
  name: 'goerli',
  chainID: 5,
}

module.exports = {
  providerRPCURL,
  networkServer,
  celoProviderUrl,
  network,
  ENVIRONMENT,
}
