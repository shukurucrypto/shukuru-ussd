task('CheckBalance', 'Check BTC balance').setAction(
  async (_, { ethers, network, getNamedAccounts }) => {
    const MINIMAL_ERC20_ABI = [
      'function balanceOf(address account) external view returns (uint256)',
    ]

    const { deployer } = await getNamedAccounts()

    const ercContract = new ethers.Contract(
      '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      MINIMAL_ERC20_ABI,
      deployer.address
    )

    const userBuyAssetBalance = await ercContract.balanceOf(deployer.address)

    // console.log(`BTC balance of ${deployer.address} is ${userBuyAssetBalance}`)
  }
)
