const axios = require('axios')
const { erc20Contract } = require('../abiData/abiData')
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
} = require('@uniswap/sdk')
const { getAddress } = require('ethers/lib/utils')
const { providerRPCURL } = require('../settings/settings')
require('dotenv').config()

let UNISWAP_ROUTER_CONTRACT
UNISWAP_ROUTER_ADDRESS = process.env.UNISWAP_V2_GOERLI_ADDRESS
UNISWAP_ROUTER_ABI = fs
  .readFileSync('./abiData/uniswapRouterABI.json')
  .toString()
// UNISWAP_ROUTER_ABI = fs
//   .readFileSync('../abiData/uniswapRouterABI.json')
//   .toString()

task('uniswap', 'Use Uniswap router to swap the tokens').setAction(
  async (_, { ethers, network }) => {
    UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
      UNISWAP_ROUTER_ADDRESS,
      UNISWAP_ROUTER_ABI,
      network.provider
    )

    // Impersonate the taker account so that we can submit the quote transaction
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [takerAddress],
    })

    // DAI token info
    const DAI = new Token(
      UNISWAP.ChainId.GOERLI,
      '0x73967c6a0904aA032C103b4104747E88c566B1A2',
      18
    )

    // swap function
    async function swapTokens(token1, token2, amount, slippage = '50') {
      try {
        const pair = await Fetcher.fetchPairData(
          token1,
          token2,
          network.provider
        ) //creating instances of a pair
        const route = await new Route([pair], token2) // a fully specified path from input token to output token
        let amountIn = ethers.utils.parseEther(amount.toString()) //helper function to convert ETH to Wei
        amountIn = amountIn.toString()

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
        const to = wallet.address // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
        const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(
          value.toString()
        ).toHexString() //convert to hex string

        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
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

        //Returns a Promise which resolves to the transaction.
        let sendTxn = (await wallet).sendTransaction(rawTxn)

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

    swapTokens(DAI, WETH[DAI.chainId], 0.02) //first argument = token we want, second = token we have, the amount we want
  }
)
