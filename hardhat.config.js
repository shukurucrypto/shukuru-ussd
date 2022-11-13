require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('./tasks/swapTask')
require('./tasks/checkBalanceTask')
require('./tasks/uniswapToken')
require('dotenv').config()

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
      forking: {
        url: process.env.MAINNET,
        // url: process.env.POLYGON_MAINET,
      },
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      blockConfirmations: 6,
    },
  },
  solidity: '0.8.7',
  gasReporter: {
    enabled: false,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: 'MATIC',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 300000,
  },
}
