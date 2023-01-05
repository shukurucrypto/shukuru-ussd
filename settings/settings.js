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
  CELO_MAINNET,
  ADMIN_KEY,
  ADMIN_INKEY,
} = process.env

// const providerRPCURL = ARBITRUM_GOERLI
const providerRPCURL = POLYGON_MUMBAI

const networkServer = 1
const ENVIRONMENT = 'testnet'
const network = {
  name: 'goerli',
  chainID: 5,
}

// const celoProviderUrl = ENVIRONMENT === 'testnet' ? CELO_TESTNET : CELO_MAINNET
const celoProviderUrl = CELO_TESTNET

module.exports = {
  providerRPCURL,
  networkServer,
  celoProviderUrl,
  network,
  ENVIRONMENT,
}
