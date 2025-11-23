require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    "asd-testnet": {
      url: process.env.ASD_RPC_URL || "https://rpc.asdscan.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 6677
    }
  },
  etherscan: {
    apiKey: {
      "asd-testnet": "empty"
    },
    customChains: [
      {
        network: "asd-testnet",
        chainId: 6677,
        urls: {
          apiURL: "https://testnet.asdscan.ai/api",
          browserURL: "https://testnet.asdscan.ai"
        }
      }
    ]
  }
};

