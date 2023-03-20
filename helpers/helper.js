const {
  useMatchAcceptBTCGasQuote,
  useMatchAcceptGasFees,
  useMatchNumberEntered,
  useMatchBTCAmountEntered,
  useMatchEthAmountEntered,
  useMatchBTCNumberEntered,
  useMatchETHNumberEntered,
  useMatchConfirmcUSDGas,
  useMatchUSDTEntered,
  useMatchConfirmUSDTGas,
  useMatchConfirmUSDTPay,
  useBTCTopAmountEntered,
  useSwapEthToUsdtAmountEntered,
  useSwapEthToUsdtConfirmed,
  useSwapUsdtToEthAmountEntered,
  useSwapUsdtToEthConfirmed,
  useMatchcUSDAmountEntered,
  useMatchConfirmCelloUSDPay,
  useBTCTopupMethodExternalWallet,
  useBTCTopupMethodMomo,
  useMatchCancelBTCTopupMomo,
  useMatchAcceptBTCTopupMomo,
  useBTCTopupMethodExternalWalletSelect,
  useBTCTopupMethodExternalLightning,
  useBTCTopupMethodExternalOnChain,
} = require('../regex/ussdRegex')

const switchKey = async (entryText) => {
  let entry
  if (await useMatchAcceptBTCGasQuote(entryText)) {
    entry = 'sendBtc'
  }

  if (await useMatchConfirmUSDTPay(entryText)) {
    entry = 'sendUsdt'
  }

  if (await useMatchConfirmCelloUSDPay(entryText)) {
    entry = 'sendcUSD'
  }

  if (await useMatchAcceptGasFees(entryText)) {
    entry = 'sendEth'
  }

  if (await useMatchETHNumberEntered(entryText)) {
    entry = 'confirmEthGas'
  }

  if (await useMatchConfirmUSDTGas(entryText)) {
    entry = 'confirmUSDTGas'
  }

  if (await useMatchConfirmcUSDGas(entryText)) {
    entry = 'confirmcUSDGas'
  }

  if (await useMatchBTCAmountEntered(entryText)) {
    entry = 'btcNumber'
  }
  // confirmTopUpBTCExternalWallet
  if (await useMatchUSDTEntered(entryText)) {
    entry = 'usdtNumber'
  }

  if (await useMatchEthAmountEntered(entryText)) {
    entry = 'ethNumber'
  }

  if (await useMatchcUSDAmountEntered(entryText)) {
    entry = 'cUsdNumber'
  }

  if (await useMatchBTCNumberEntered(entryText)) {
    entry = 'confirmBtcGas'
  }

  if (await useBTCTopupMethodExternalWallet(entryText)) {
    entry = 'confirmTopUpBTCExternalWallet'
  }

  if (await useBTCTopupMethodExternalLightning(entryText)) {
    entry = 'useBTCTopupMethodExternalLightning'
  }

  if (await useBTCTopupMethodExternalOnChain(entryText)) {
    entry = 'useBTCTopupMethodExternalOnChain'
  }
  if (await useBTCTopupMethodMomo(entryText)) {
    entry = 'confirmTopUpBTCMomo'
  }

  if (await useMatchAcceptBTCTopupMomo(entryText)) {
    entry = 'acceptTopUpBTCMomo'
  }

  if (await useMatchCancelBTCTopupMomo(entryText)) {
    entry = 'cancelTopUpBTCMomo'
  }

  if (await useBTCTopAmountEntered(entryText)) {
    entry = 'createTopUpInvoice'
  }

  if (await useSwapEthToUsdtAmountEntered(entryText)) {
    entry = 'swapEthToUsdtQuote'
  }

  if (await useSwapUsdtToEthAmountEntered(entryText)) {
    entry = 'swapUsdtToEthQuote'
  }

  if (await useSwapEthToUsdtConfirmed(entryText)) {
    entry = 'swapEthToUsdtConfirmed'
  }

  if (await useSwapUsdtToEthConfirmed(entryText)) {
    entry = 'swapUsdtToEthConfirmed'
  }

  return entry
}

module.exports = {
  switchKey,
}
