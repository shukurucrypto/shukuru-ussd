const axios = require('axios')
const { erc20Contract } = require('../abiData/abiData')

task('swap', 'Test swap token on 0xAPI').setAction(
  async (_, { ethers, network }) => {
    const AMOUNT = ethers.utils.parseEther('0.045')
    const ABI = erc20Contract

    // Quote parameters
    const sellToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // ETH
    const buyToken = '0x6b175474e89094c44da98b954eedeac495271d0f' // DAI
    const sellAmount = AMOUNT
    const takerAddress = '0xab5801a7d398351b8be11c439e05c5b3259aec9b' // An account with sufficient balance on mainnet

    const quoteResponse = await axios.get(
      `https://api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellAmount=${sellAmount}&sellToken=${sellToken}&takerAddress=${takerAddress}`
    )
    // Check for error from 0x API
    if (quoteResponse.status !== 200) {
      const body = await quoteResponse.text()
      throw new Error(body)
    }

    const quote = await quoteResponse.data

    // Impersonate the taker account so that we can submit the quote transaction
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [takerAddress],
    })

    // Get a signer for the account we are impersonating
    const signer = await ethers.getSigner(takerAddress)
    const dai = new ethers.Contract(buyToken, ABI, signer)

    console.log(`Signer / taker Address ${signer.address}`)
    console.log(`Swap to contract address ${dai.address}`)

    // Get pre-swap balances for comparison
    const etherBalanceBefore = await signer.getBalance()
    const daiBalalanceBefore = await dai.balanceOf(takerAddress)

    console.log(`Taker ETH balance before swap ${etherBalanceBefore}`)
    console.log(`Taker DAI balance before swap ${daiBalalanceBefore}`)

    console.log(
      `----------------------START SWAPING THE TX-----------------------------`
    )

    // Send the transaction
    const txResponse = await signer.sendTransaction({
      from: quote.from,
      to: quote.to,
      data: quote.data,
      value: ethers.BigNumber.from(quote.value || 0),
      gasPrice: ethers.BigNumber.from(quote.gasPrice),
      gasLimit: ethers.BigNumber.from(quote.gas),
    })

    // Wait for transaction to confirm
    const txReceipt = await txResponse.wait()

    console.log(`Transaction ${txReceipt.hash}`)
    console.log(
      `----------------------END SWAPING THE TX-----------------------------`
    )

    // Get post-swap balances
    const etherBalanceAfter = await signer.getBalance()
    const daiBalanceAfter = await dai.balanceOf(takerAddress)

    console.log(
      `ETH: ${etherBalanceBefore.toString()} -> ${etherBalanceAfter.toString()}`
    )
    console.log(
      `DAI: ${daiBalalanceBefore.toString()} -> ${daiBalanceAfter.toString()}`
    )
  }
)
