require("@nomicfoundation/hardhat-toolbox");

/**
 * Configuración de Hardhat para el proyecto FaucetToken
 * Incluye configuración para la red Sepolia testnet
 */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Red local de desarrollo
    hardhat: {
      chainId: 31337,
    },
    // Red Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};