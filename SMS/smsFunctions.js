const AfricasTalking = require("africastalking");
require("dotenv").config();

// TODO: Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AFRICA_TALKING_API_KEY,
  username: process.env.AFRICA_TALKING_APP_USERNAME,
});

module.exports = async function sendSMS(msg, phoneNumber) {
  // TODO: Send message
  try {
    const result = await africastalking.SMS.send({
      to: phoneNumber,
      message: msg,
      from: "25663",
    });
    console.log(result);
  } catch (ex) {
    console.error(ex);
  }
};
