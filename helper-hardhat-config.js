// ALL ADDRESSES USING ARBITRUM NAINET
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
    liveAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    testAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    goerliAddress: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9',
    mumbaiAddress: '0xddfcdA702205e7E65229ede5D50c760FCC60cf1e',
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
