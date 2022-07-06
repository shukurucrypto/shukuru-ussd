const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const accounts = await ethers.getSigners();
  console.log("DEBUG HERE ------------------", accounts.length);
};

module.exports.tags = ["all", "deploy"];
