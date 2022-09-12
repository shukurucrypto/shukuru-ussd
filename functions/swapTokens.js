const {
  AlphaRouter,
  SWAP_ROUTER_ADDRESS,
  ChainId,
} = require('@uniswap/smart-order-router')
const {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
} = require('@uniswap/sdk-core')
const { ethers, BigNumber } = require('ethers')
const JSBI = require('jsbi')
require('dotenv').config()

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
const ERC20_ABI = require('../abiData/erc20.json')
const { providerRPCURL } = require('../settings/settings')

const chainId = ChainId.GÖRLI

// Initialise the provider
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const swapRouter = new AlphaRouter({ chainId: chainId, provider: provider })

const swapTokens = async (tokenFrom, tokenTo, amount, wallet) => {
  try {
    // Tokens info
    const name1 = tokenFrom.name
    const symbol1 = tokenFrom.symbol
    const address1 = tokenFrom.address
    const decimals1 = 18

    // const name2 = tokenTo.name
    // const symbol2 = tokenTo.symbol
    // const address2 = tokenTo.address
    // const decimals2 = 18
    // const decimals2 = 18

    const name2 = 'Dai'
    const symbol2 = 'DAI'
    const decimals2 = 18
    const address2 = '0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60'

    // Get the tokens details
    const TOKEN_FROM = new Token(chainId, address1, decimals1, symbol1, name1)
    const TOKEN_TO = new Token(chainId, address2, decimals2, symbol2, name2)

    // Convert the amount to swap into wei -> uniswap input amounts
    const wei = ethers.utils.parseUnits(amount, decimals1)
    const inputAmount = CurrencyAmount.fromRawAmount(
      TOKEN_FROM,
      JSBI.BigInt(wei)
    )

    // const txNounce = await provider.getTransactionCount()
    // const blockNumber = await provider.getBlockNumber()
    // console.log(`txNounce - ${txNounce}`)
    // console.log(`blockNumber - ${blockNumber}`)

    // Create a route instance that -> returns a quote price...
    const route = await swapRouter.route(
      inputAmount,
      TOKEN_TO,
      TradeType.EXACT_INPUT,
      {
        recepient: wallet.address,
        slippageTolerance: new Percent(25, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
      }
    )
    console.log(`Quote Exact In: ${route.quote.toFixed(10)}`)

    function getNonce() {
      let nonceOffset = 1
      return txNounce + nonceOffset++
    }
    // Create a transaction to be broadcasted to the network
    const transaction = {
      data: route.methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters.value),
      from: wallet.address,
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: ethers.utils.hexlify(10000000),
      // gasLimit: ethers.utils.hexlify(10000000),
      // nonce: getNonce(),
    }

    const connectedWallet = wallet.connect(provider)

    // Grant approval of the swap contract to withdraw the amount to swap from your wallet
    // await approve(connectedWallet, V3_SWAP_ROUTER_ADDRESS, address1)

    await approveERC20(address1, V3_SWAP_ROUTER_ADDRESS, wei, connectedWallet)

    // Bradcast the transaction to the network
    const tradeTransaction = await connectedWallet.sendTransaction(transaction)
    // await tradeTransaction.wait(1)

    console.log(tradeTransaction)
  } catch (error) {
    console.log(error.message)
  }
}

// function to approve token
const approve = async (connectedSigner, toApproveAddress, contractAddress) => {
  const approvalAmount = ethers.utils.parseEther('1').toString()
  const contract0 = new ethers.Contract(contractAddress, ERC20_ABI, provider)
  await contract0
    .connect(connectedSigner)
    .approve(toApproveAddress, approvalAmount)
}

const approveERC20 = async (
  contractAddress,
  spenderAddress,
  amount,
  connectedSigner
) => {
  const erc20Token = new ethers.Contract(
    contractAddress,
    ERC20_ABI,
    connectedSigner
  )
  txResponse = await erc20Token.approve(spenderAddress, amount)
  await txResponse.wait(1)
  console.log('Approved!')
}

module.exports = {
  swapTokens,
}
