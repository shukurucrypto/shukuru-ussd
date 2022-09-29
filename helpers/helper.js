const {
  useMatchAcceptBTCGasQuote,
  useMatchAcceptGasFees,
  useMatchNumberEntered,
  useMatchBTCAmountEntered,
  useMatchEthAmountEntered,
  useMatchBTCNumberEntered,
  useMatchETHNumberEntered,
  useMatchUSDTEntered,
  useMatchConfirmUSDTGas,
  useMatchConfirmUSDTPay,
  useBTCTopAmountEntered,
} = require('../regex/ussdRegex')

const switchKey = async (entryText) => {
  let entry
  if (await useMatchAcceptBTCGasQuote(entryText)) {
    entry = 'sendBtc'
  }

  if (await useMatchConfirmUSDTPay(entryText)) {
    entry = 'sendUsdt'
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

  if (await useMatchBTCAmountEntered(entryText)) {
    entry = 'btcNumber'
  }

  if (await useMatchUSDTEntered(entryText)) {
    entry = 'usdtNumber'
  }

  if (await useMatchEthAmountEntered(entryText)) {
    entry = 'ethNumber'
  }

  if (await useMatchBTCNumberEntered(entryText)) {
    entry = 'confirmBtcGas'
  }

  if (await useBTCTopAmountEntered(entryText)) {
    entry = 'createTopUpInvoice'
  }

  return entry
}

module.exports = {
  switchKey,
}
