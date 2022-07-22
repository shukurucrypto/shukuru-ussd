function useMatchEthAmountEntered(input) {
  let regex = /^1\*1\*2\*[0-9]*\.[0-9]+$/i
  return regex.test(input)
}

function useMatchAcceptGasFees(input) {
  let regex = /1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+\*1/is
  return regex.test(input)
}

function useRejectGasFees(input) {
  let regex = /1\*1\*2\*[0-9]*\.[0-9]+\*[0-9]+\*2/is
  return regex.test(input)
}

async function useMatchNumberEntered(input) {
  let regex = /^1\*1\*2\*\d\.\d\*[0-9]+$/is
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

async function getUserPaymentAmount(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[words.length - 3]
  // console.log(`words -----: ${words}`);
  return price
}

async function getUserPaymentAmountForGasFees(text) {
  let words = text.match(/[.\d]+/g)
  let price = words[words.length - 2]
  // console.log(`words -----: ${words}`);
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
}
