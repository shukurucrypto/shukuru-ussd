const { ethers } = require('ethers')
const UNISWAP = require('@uniswap/sdk')
const fs = require('fs')
const {
  Token,
  WETH,
  Fetcher,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
  ChainId,
} = require('@uniswap/sdk')
const { getAddress } = require('ethers/lib/utils')
const { providerRPCURL } = require('../settings/settings')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)
let UNISWAP_ROUTER_CONTRACT
UNISWAP_ROUTER_ADDRESS = process.env.UNISWAP_V2_GOERLI_ADDRESS
UNISWAP_ROUTER_ABI = fs
  .readFileSync('./abiData/uniswapRouterABI.json')
  .toString()

const useUniswapTokens = async (signer) => {
  try {
    UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
      UNISWAP_ROUTER_ADDRESS,
      UNISWAP_ROUTER_ABI,
      provider
    )

    // const swapToAsset = new Token(
    //   UNISWAP.ChainId.GÖRLI,
    //   '0x73967c6a0904aA032C103b4104747E88c566B1A2',
    //   18
    // )

    const swapToAsset = await Fetcher.fetchTokenData(
      UNISWAP.ChainId.GÖRLI,
      '0x73967c6a0904aA032C103b4104747E88c566B1A2',
      provider
    )

    swapTokens(swapToAsset, WETH[swapToAsset.chainId], '1.5', signer) //first argument = token we want, second = token we have, the amount we want
    // console.log(`DAI Chain: ${JSON.stringify(WETH[DAI.chainId])}`)
    // console.log(`ASSET : ${JSON.stringify(swapToAsset, null, 2)}`)
  } catch (err) {
    console.log(err)
  }
}

async function swapTokens(token1, token2, amount, signer) {
  slippage = '1'
  try {
    const pair = await Fetcher.fetchPairData(token1, token2, provider) //creating instances of a pair
    const route = await new Route([pair], token2) // a fully specified path from input token to output token
    let amountIn = ethers.utils.parseEther(amount.toString()) //helper function to convert ETH to Wei
    // amountIn = amountIn.toString()
    // amountIn = '1000000000000000000'

    // const trade = new Trade(
    //   route,
    //   new TokenAmount(token2, amountIn),
    //   TradeType.EXACT_INPUT
    // )

    const slippageTolerance = new Percent(slippage, '10000') // 50 bips, or 0.50% - Slippage tolerance

    const trade = new Trade( //information necessary to create a swap transaction.
      route,
      new TokenAmount(token2, amountIn),
      TradeType.EXACT_INPUT
    )

    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const amountOutMinHex = ethers.BigNumber.from(
      amountOutMin.toString()
    ).toHexString()
    const path = [token2.address, token1.address] //An array of token addresses
    const to = signer.address // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
    const valueHex = await ethers.BigNumber.from(value.toString()).toHexString() //convert to hex string

    // Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
    const rawTxn =
      await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(
        amountOutMinHex,
        path,
        to,
        deadline,
        {
          value: valueHex,
        }
      )

    // console.log(`swap Eth for Tokens: ${JSON.stringify(rawTxn)}`)
    console.log('---------------------------------------------------')

    //Returns a Promise which resolves to the transaction.
    let sendTxn = (await signer).sendTransaction(rawTxn)

    //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
    let reciept = (await sendTxn).wait()

    //Logs the information about the transaction it has been mined.
    if (reciept) {
      console.log(
        ' - Transaction is mined - ' + '\n' + 'Transaction Hash:',
        (await sendTxn).hash +
          '\n' +
          'Block Number: ' +
          (await reciept).blockNumber +
          '\n' +
          'Navigate to https://rinkeby.etherscan.io/txn/' +
          (await sendTxn).hash,
        'to see your transaction'
      )
    } else {
      console.log('Error submitting transaction')
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  useUniswapTokens,
}
