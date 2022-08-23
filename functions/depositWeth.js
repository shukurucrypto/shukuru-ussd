const { ethers } = require('ethers')
const { networkConfig } = require('../helper-hardhat-config')

const ERC20_ABI = require('../abiData/erc20.json')
const { ENVIRONMENT, providerRPCURL } = require('../settings/settings')

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const depositWeth = async (signer, address, amount) => {
  try {
    console.log('Depositing some weth.....')
    let wethAddress

    if (ENVIRONMENT === 'testnet') {
      wethAddress = networkConfig.weth.testAddress
    } else {
      wethAddress = networkConfig.weth.liveAddress
    }

    const wethContract = new ethers.Contract(wethAddress, ERC20_ABI, signer)

    const tx = {
      to: address,
      value: amount,
    }

    await tx.wait(1)

    console.log(tx)

    const userWethBalance = await wethContract.balanceOf(address)
    console.log(`You now have ${userWethBalance.toString()} WETH`)
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  depositWeth,
}
