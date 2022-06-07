
const axios = require('axios');


const fetchCoin = async (name) => {
    try {
        const result = await axios.get(`https://api.coingecko.com/api/v3/coins/${name}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`)
        const data = await result.data;
        return data;
    } catch (error) {
        console.log(error.message);
    }
}


const markets = async(req, res) => {
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text,
    } = req.body;

    let response = '';

    if (text === '') {
        // This is the first request. Note how we start the response with CON
        response = `CON Welcome to Shukuru App, What would you like to do?\n`;
        response += `1. My Wallet\n`;
        response += `2. See Markets`;
    }else if(text === '1') {
        // ============================= OPTION 1 MY WALLETS =============================
        // Showing all the markets menu
        response = `CON Bal - 0.02467 (BTC), 0.425 (ETH)\n`;
        response += `1. Withdraw\n`;
        response += `2. Buy\n`;
        response += `3. Make crypto payment\n`;
        response += `4. Wallet info\n`;
    }else if(text === "1*1") {
        // Selected withdraw option 1
        response = `CON Please enter amount to withdraw\n`;
    // }else if(text.match("1*1*")) {
        // Enter amount to withdraw
        // response = `CON Please your wallet PIN\n`;
    // }else if(text.match(text)) {
        // Transaction initiated successfully
        // response = `END Wallet transfer has been initiated.\n`;
        // response += `Wait for a confirmation message.\n`;
    }else if(text === '1*2') {
        // ============================= OPTION 1/2 BUY =============================
        // Showing coins to buy
        response = `CON Select coin to buy\n`;
        response += `1. BTC - Bitcoin\n`;
        response += `2. ETH - Ethereum\n`;
        response += `3. USDT - Tether\n`;
    }else if(text === '1*2*1') {
        // Selected buy option 1
        response = `CON Please enter amount to buy BTC\n`;
    }else if(text === '1*2*2') {
        // Selected buy option 2
        response = `CON Please enter amount to buy ETH\n`;
    }else if(text === '1*2*3') {
        // Selected buy option 3
        response = `CON Please enter amount to buy USDT\n`;
    }else if(text === '1*3') {
        // ============================= OPTION 1/3 MAKE CRYPTO PAYMENTS =============================
        response = `CON Select the coin to pay using\n`;
        response += `1. BTC - Bitcoin\n`;
        response += `2. ETH - Ethereum\n`;
        response += `3. USDT - Tether\n`;
    }else if(text === '1*3*1') {
        // Selected payment option 1
        response = `CON Please enter amount of BTC to pay\n`;
    }else if(text === '1*3*2') {
        // Selected payment option 2
        response = `CON Please enter amount of ETH to pay\n`;
    }else if(text === '1*3*3') {
        // Selected payment option 3
        response = `CON Please enter amount of USDT to pay\n`;
    // }else if(text.match("1*3*")) {   
        // Enter amount to pay
        // response = `CON Enter reciver address number\n`;
    } else if (text === '2'){
        // Showing all the markets menu
        response = `CON Shukuru Top cryptocurrencies\n`;
        response += `1. BTC - Bitcoin\n`;
        response += `2. ETH - Ethereum\n`;
        response += `3. USDT - Tether\n`;
    } else if (text === '2*1') {
        // Showing BTC coin options
        response = `CON BTC - Bitcoin\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;
        response += `3. Check balance\n`;
        response += `4. Market Stats`;
    } else if (text === '2*1*4') {
        // Option 4 to check the BTC market
        const coin = await fetchCoin('bitcoin')
        response = `CON ${coin.name} (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`;
        response += `Up ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;
    } else if (text === '2*2') {
        // Business logic for first level response
        response = `CON ETH - Ethereum\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;
        response += `3. Check balance\n`;
        response += `4. Market`;
    } else if (text === '2*2*4') {
        // Option 4 to check the ETH market
        const coin = await fetchCoin('ethereum')
        response = `CON ${coin.name} (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`;
        response += `Up ${coin.market_data.ath_change_percentage.eth}% last 24hr\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;    
    }else if (text === '2*3') {
        // Business logic for first level response
        response = `CON USDT - Tether\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;
        response += `3. Check balance\n`;
        response += `4. Market`;
    } else if (text === '2*3*4') {
        // Option 4 to check the USDT market
        const coin = await fetchCoin('tether')
        response = `CON ${coin.name} (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`;
        response += `Down ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`;
        response += `1. Buy\n`;
        response += `2. Sell\n`;
    }

    console.log(text);
    // Send the response back to the API
    res.set('Content-Type: text/plain');
    res.send(response);
}

const createWallet = async(req, res) => {
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text,
    } = req.body;

    let response = '';

     
    
    if (text === '') {
        // This is the first request. Note how we start the response with CON
        response += `CON Welcome to Shukuru App\n`;
        response += `Enter your name to create a crypto wallet\n`;
    }

    if(text !== '') {
        response = `END Your wallet has been created successfully\n`;
        response += ` We're going to send you a link to secure your account\n`;
    }


    console.log(text);
    // Send the response back to the API
    res.set('Content-Type: text/plain');
    res.send(response);
}

module.exports = {
    markets,
    createWallet
}