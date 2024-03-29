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
  BSC_TESTNET_RPC_URL,
  ADMIN_INKEY,
  ADMIN_ADDRESS,
  CUSD_CONTRACT_ADRESS,
  BUSD_TESTNET_CONTRACT_ADDRESS,
  ONERAMP_CLIENT_KEY,
  ONERAMP_SECRET_KEY,
} = process.env

// const providerRPCURL = ARBITRUM_GOERLI
const providerRPCURL = POLYGON_MUMBAI
const bscProviderURL = BSC_TESTNET_RPC_URL
const oneRampClient = ONERAMP_CLIENT_KEY
const oneRampSecret = ONERAMP_SECRET_KEY

const networkServer = 1
const ENVIRONMENT = 'DEV'
const network = {
  name: 'goerli',
  chainID: 5,
}

// const celoProviderUrl = ENVIRONMENT === 'testnet' ? CELO_TESTNET : CELO_MAINNET
const celoProviderUrl = CELO_TESTNET
const busdAddress = BUSD_TESTNET_CONTRACT_ADDRESS
const cusdAddress = CUSD_CONTRACT_ADRESS
const adminAddress = ADMIN_ADDRESS
const mumbaiProvider = POLYGON_MUMBAI

// Test URL CONFS
const celo = CELO_TESTNET
const bnb = BSC_TESTNET_RPC_URL
const polygon = POLYGON_MUMBAI

module.exports = {
  providerRPCURL,
  networkServer,
  celoProviderUrl,
  network,
  ENVIRONMENT,
  bscProviderURL,
  busdAddress,
  cusdAddress,
  adminAddress,
  oneRampClient,
  oneRampSecret,
  mumbaiProvider,

  celo,
  bnb,
  polygon,
}
