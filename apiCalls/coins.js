const axios = require("axios");

const fetchCoins = async () => {
  try {
    const result = await axios.get(`https://api.coingecko.com/api/v3/coins/`);
    //   return the first 3
    const data = await result.data;
    return data.slice(0, 2);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  fetchCoins,
};
