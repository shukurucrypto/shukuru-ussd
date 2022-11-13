const { ethers, BigNumber } = require('ethers')
const axios = require('axios')
const { AlphaRouter } = require('@uniswap/smart-order-router')
const {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
} = require('@uniswap/sdk-core')
const { providerRPCURL, network } = require('../settings/settings.js')
const Assets = require('../models/Assets.js')
const ERC20_ABI = require('../abiData/erc20.json')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
const { depositWeth } = require('../functions/depositWeth.js')
const JSBI = require('jsbi')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)
const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

const router = new AlphaRouter({ chainId: network.chainID, provider: provider })

const swapTokenRouter = async (tokenFrom, tokenTo, amount, phoneNumber) => {
  let response

  try {
    console.log(
      '----------------------SWAPPING COINS CALLED-------------------- '
    )
    let tradeToAddress, tradeFromAddress, ASSET_FROM, ASSET_TO

    const chainId = network.chainID

    const signer = await getCurrentUserSigner(phoneNumber)

    const signerAddress = await signer.getAddress()

    // get token from address from assets
    // Check to see if the token asked is ETH then we'll deposit some eth in the weth contract and use that
    if (tokenFrom === 'ETH') {
      tradeFromAddress = '0xc778417e063141139fce010982780140aa0cd5ab'

      // await depositWeth(signer, signerAddress, amount)

      // Get the token create the Token info
      ASSET_FROM = new Token(
        chainId,
        '0xc778417e063141139fce010982780140aa0cd5ab',
        18,
        'WETH',
        'Wrapped Ether'
      )
    } else {
      const tokenFromAsset = await Assets.findOne({ symbol: tokenFrom })
      tradeFromAddress = tokenFromAsset.address.test

      ASSET_FROM = new Token(
        chainId,
        tradeFromAddress,
        6,
        tokenFromAsset.symbol,
        tokenFromAsset.name
      )
    }

    if (tokenTo === 'ETH') {
      tradeFromAddress = '0xc778417e063141139fce010982780140aa0cd5ab'

      ASSET_TO = new Token(
        chainId,
        '0xc778417e063141139fce010982780140aa0cd5ab',
        18,
        'WETH',
        'Wrapped Ether'
      )
    } else {
      const tokenToAsset = await Assets.findOne({ symbol: tokenTo })
      tradeToAddress = tokenToAsset.address.test

      ASSET_TO = new Token(
        chainId,
        tradeToAddress,
        6,
        tokenToAsset.symbol,
        tokenToAsset.name
      )
    }

    // Get instances of their contracts
    const assetFromContract = new ethers.Contract(
      tradeFromAddress,
      ERC20_ABI,
      provider
    )
    const assetToContract = new ethers.Contract(
      tradeToAddress,
      ERC20_ABI,
      provider
    )

    // Extract the percentage slippage
    const percentSlippage = new Percent('2', 100)
    // Convert the amount to wei
    const wei = ethers.utils.parseUnits(amount.toString(), 18)
    // Get the currency amount of the asset from on uinswap
    const currencyAmount = CurrencyAmount.fromRawAmount(
      ASSET_FROM,
      JSBI.BigInt(amount)
    )

    // Create the route
    const route = await router.route(
      currencyAmount,
      ASSET_TO,
      TradeType.EXACT_INPUT,
      {
        recipient: signerAddress.toString(),
        slippageTolerance: percentSlippage,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time,
      }
    )
    console.log('DEBUG HERE: --------', route)

    // Create the transaction
    const transaction = {
      data: route.methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters.value),
      from: signerAddress.toString(),
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: ethers.utils.hexlify(1000000),
    }

    const quoteAmountOut = route.quote.toFixed(6)
    const ratio = (inputAmount / quoteAmountOut).toFixed(3)

    console.log(`Quote Amount: ${quoteAmountOut}`)
    console.log(`Ratio: ${ratio}`)
    return `END Swapping will go live on mainnet soon...`
  } catch (error) {
    response = `END An error occurred`
    console.log(error.message)
    return response
  }
}

const usingOxProtocol = async (signer, amount, userAddress) => {
  try {
    // Fetch quote from 0x API
    await axios
      .get(
        `https://goerli.api.0x.org/swap/v1/quote?buyToken=DAI&sellToken=ETH&buyAmount=${amount}&takerAddress=${userAddress}`
      )
      .then((response) => {
        const quote = response.data
        console.log(quote)
      })
      .catch((err) => {
        console.log(err.message)
      })
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  swapTokenRouter,
}
