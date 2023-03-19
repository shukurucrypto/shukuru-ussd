function useMatchEthAmountEntered(input) {
  let regex = /^1\*1\*2\*[0-9]*\.[0-9]+$/i
  return regex.test(input)
}

function useMatchBTCAmountEntered(input) {
  let regex =
    /^1\*1\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}

function useMatchcUSDAmountEntered(input) {
  let regex =
    /^1\*1\*4\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}
async function useMatchUSDTAmountEntered(input) {
  let regex = /^1\*1\*3\*[0-9]*\.[0-9]+$/is
  return regex.test(input)
}

async function useMatchUSDTEntered(input) {
  let regex =
    /^1\*1\*3\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}

function useMatchAcceptGasFees(input) {
  let regex = /1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+\*1/is
  return regex.test(input)
}

function useMatchAcceptBtcGasFees(input) {
  let regex =
    /^1\*1\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+\*1$/is
  return regex.test(input)
}

function useRejectGasFees(input) {
  let regex = /1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+\*2/is
  return regex.test(input)
}

function useMatchAcceptUSDTGasFees(input) {
  let regex = /1\*1\*3\*[0-9]*\.[0-9]+\*[0-9]+\*1/is
  return regex.test(input)
}

async function useMatchUsdtRecieverNumberEntered(input) {
  let regex = /^1\*1\*3\*[0-9]*\.[0-9]+\*[0-9]+$/is
  return regex.test(input)
}

async function useMatchNumberUsdtEntered(input) {
  let regex = /^1\*1\*3\*\d\.\d\*[0-9]+$/is
  return regex.test(input)
}

async function useMatchBtcEntered(input) {
  let regex = /^1\*1\*1\*[0-9]*\.[0-9]+$/is
  return regex.test(input)
}

async function useMatchBtcAndNumberEntered(input) {
  let regex = /^1\*1\*1\*[0-9]*\.[0-9]+\*[0-9]+$/is
  return regex.test(input)
}

async function useMatchCancelBTCTopupMomo(input) {
  const regex = /1\*2\*1\*(\d+(\.\d+)?)\*2\*2/ // defining the regex pattern
  return regex.test(input)
}

async function useMatchAcceptBTCTopupMomo(input) {
  const regex = /1\*2\*1\*(\d+(\.\d+)?)\*2\*1/ // defining the regex pattern
  return regex.test(input)
}

async function useMatchETHNumberEntered(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*2\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useMatchConfirmcUSDGas(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*4\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+$/is
  const response = regex.test(input)
  return response
}

async function useMatchConfirmUSDTGas(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*3\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useMatchConfirmUSDTPay(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*3\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+\*1$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useMatchConfirmCelloUSDPay(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*4\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+\*1$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}
async function useMatchNumberEntered(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex = /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useMatchBTCNumberEntered(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*[0-9]+$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useMatchAcceptBTCGasQuote(input) {
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex =
    /^1\*1\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*1$/is
  const response = regex.test(input)
  // console.log(`Match number entered: ${response}`)
  return response
}

async function useSelectedUsdt(input) {
  // console.log(`Selected USDT: ${input}`)
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex = /^1\*1\*3$/is
  return regex.test(input)
}

async function useBTCTopAmountEntered(input) {
  let regex =
    /^1\*2\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}

async function useBTCTopupMethodExternalWallet(input) {
  let regex =
    /1\*2\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?\*1/i
  return regex.test(input)
}

async function useBTCTopupMethodExternalLightning(input) {
  let regex =
    /1\*2\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?\*1\*1/i

  return regex.test(input)
}

async function useBTCTopupMethodExternalOnChain(input) {
  let regex =
    /1\*2\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?\*1\*2/i
  return regex.test(input)
}

async function useBTCTopupMethodMomo(input) {
  let regex =
    /1\*2\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?\*2/i

  return regex.test(input)
}

async function useSwapEthToUsdtAmountEntered(input) {
  let regex =
    /^1\*5\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}

async function useSwapUsdtToEthConfirmed(input) {
  let regex =
    /^1\*5\*2\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*1$/is
  return regex.test(input)
}

async function useSwapUsdtToEthAmountEntered(input) {
  let regex =
    /^1\*5\*2\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?$/is
  return regex.test(input)
}

async function useSwapEthToUsdtConfirmed(input) {
  let regex =
    /^1\*5\*1\*([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[eE]([+-]?\d+))?\*1$/is
  return regex.test(input)
}

async function useSwapEthToUsdtPrice(input) {
  // console.log(`Selected USDT: ${input}`)
  // /^1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+$/is;
  let regex = /^1\*5\*1\*[0-9]*\.[0-9]+$/is
  return regex.test(input)
}

function extractPhoneNumber(text) {
  const regex = /(?:[-+() ]*\d){10,13}/gm

  let m
  let myNumber

  while ((m = regex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // console.log(`Found match, group ${groupIndex}: ${match}`);
      myNumber = match
    })
    return myNumber
  }
}

async function getUserPaymentAmountBefore(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[words.length - 2]
  return price
}

async function getTopupBTCAmount(text) {
  const regex = /1\*2\*1\*(\d+(\.\d+)?)\*1/ // defining the regex pattern
  const match = regex.exec(text) // applying the regex on the string
  const price = parseFloat(match[1]) // extracting the price and parsing it as a float
  console.log(price)
  return price
}
// Initialized payment 8000 BTC
async function useSelectedBTCToBuy(text) {
  let regex = /^1\*2\*1\*[0-9]*\.[0-9]+$/is
  let buyBTC = regex.test(text)
  return buyBTC
}

async function getUserPaymentAmount(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[words.length - 3]
  // console.log(`words -----: ${words}`);
  return price
}

async function getUserSwapAmount(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[3]
  return price
}

async function getUserPaymentAmountForGasFees(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[words.length - 2]
  return price
}

async function getUserToPayPhoneNumber(text) {
  let words = text.match(/[.\d]+/g)
  let number = words[words.length - 2]
  return number
}

async function getCreateUserWalletInfo(text) {
  let words = text.match(/\w+|\((.*?)\)/g)
  let name = words[0]
  let walletPin = words[words.length - 1]

  return {
    name,
    walletPin,
  }
}

function truncateAddress(address) {
  // Clear out that junk in your trunk
  const newAddress = address.slice(0, 3) + '...' + address.slice(-3)
  return newAddress
}

module.exports = {
  useMatchEthAmountEntered,
  useMatchNumberEntered,
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  getCreateUserWalletInfo,
  truncateAddress,
  useMatchAcceptGasFees,
  getUserPaymentAmountBefore,
  getUserPaymentAmountForGasFees,
  useRejectGasFees,
  useSelectedBTCToBuy,
  useMatchUSDTAmountEntered,
  useMatchNumberUsdtEntered,
  useSelectedUsdt,
  useMatchAcceptUSDTGasFees,
  useMatchUsdtRecieverNumberEntered,
  useSwapUsdtToEthAmountEntered,
  useSwapEthToUsdtPrice,
  getUserSwapAmount,
  useMatchBtcAndNumberEntered,
  useMatchBtcEntered,
  useMatchBTCAmountEntered,
  useMatchBTCNumberEntered,
  useMatchAcceptBtcGasFees,
  getTopupBTCAmount,
  useMatchAcceptBTCGasQuote,
  useMatchETHNumberEntered,
  useMatchUSDTEntered,
  useMatchConfirmUSDTGas,
  useMatchConfirmUSDTPay,
  useBTCTopAmountEntered,
  useSwapEthToUsdtAmountEntered,
  useSwapEthToUsdtConfirmed,
  useSwapUsdtToEthConfirmed,
  useMatchConfirmcUSDGas,
  useMatchcUSDAmountEntered,
  useBTCTopupMethodExternalWallet,
  useMatchConfirmCelloUSDPay,
  useBTCTopupMethodMomo,
  useMatchCancelBTCTopupMomo,
  useMatchAcceptBTCTopupMomo,
  useBTCTopupMethodExternalLightning,
  useBTCTopupMethodExternalOnChain,
}
