const CryptoJS = require("crypto-js");
require("dotenv").config();

const encrypt = async text => {
  // Encrypt
  const ciphertext = CryptoJS.AES.encrypt(
    text,
    process.env.ENCRYPTION_KEY
  ).toString();

  return ciphertext;
};

const decrypt = async text => {
  // Decrypt
  const bytes = CryptoJS.AES.decrypt(text, process.env.ENCRYPTION_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);

  return originalText;
};

module.exports = {
  encrypt,
  decrypt,
};
