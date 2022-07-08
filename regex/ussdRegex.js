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
    console.log("DEBUG HERE -------------------->", myNumber);
    return myNumber;
  }
}

module.exports = {
  useMatchEthAmountEntered,
  useMatchNumberEntered,
  extractPhoneNumber,
};
