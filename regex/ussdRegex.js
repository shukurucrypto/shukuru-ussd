function useMatchEthAmountEntered(input) {
  let regex = /^1\*3\*2\*[0-9]*\.[0-9]+$/i;
  return regex.test(input);
}

async function useMatchNumberEntered(input) {
  let regex = /^1\*3\*2\*\d\.\d\*[0-9]+$/is;
  return regex.test(input);
}

function extractPhoneNumber(text) {
  const regex = /(?:[-+() ]*\d){10,13}/gm;

  let m;
  let myNumber;

  while ((m = regex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // console.log(`Found match, group ${groupIndex}: ${match}`);
      myNumber = match;
    });
    return myNumber;
  }
}

async function getUserPaymentAmount(text) {
  let words = text.match(/[.\d]+/g);
  let price = words[words.length - 2];
  console.log(price);
  return price;
}

async function getUserToPayPhoneNumber(text) {
  let words = text.match(/[.\d]+/g);
  let number = words[words.length - 1];
  return number;
}

module.exports = {
  useMatchEthAmountEntered,
  useMatchNumberEntered,
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
};
