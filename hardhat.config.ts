import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { configDotenv } from "dotenv";

configDotenv();
let accounts = [process.env.PRIVATE_KEY as string]
let alchemyKey = process.env.ALCHEMY_KEY
const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    mainnet: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`,
        accounts: accounts,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${alchemyKey}`,
      accounts: accounts,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      accounts: accounts,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${alchemyKey}`,
      accounts: accounts,
    },
  },
};

export default config;
