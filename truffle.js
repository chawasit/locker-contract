require('dotenv').config()

var HDWalletProvider = require("truffle-hdwallet-provider");


module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    live: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1" // public ethereum
    },
    ropsten: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY,
        1
      ),
      network_id: 3,
      gas: 4700000
    }
  },
  mocha: {
    useColor: true
  }
};
