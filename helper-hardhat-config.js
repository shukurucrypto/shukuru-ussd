const networkConfig = {
  31337: {
    name: 'local',
    usdtContractAddress: '',
  },
  4: {
    name: 'Rinkeby',
    usdtContractAddress: '',
  },
  usdt: {
    liveAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    testAddress: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9',
  },
  usdc: {
    liveAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    testAddress: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9',
  },
  dai: {
    liveAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    testAddress: '0xdc31ee1784292379fbb2964b3b9c4124d8f89c60',
  },
  weth: {
    liveAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    testAddress: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  },
}

module.exports = {
  networkConfig,
}
