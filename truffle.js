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
      network_id: "1", // main ethereum
      from: "0x3b20c0a9c1bf9828c7d50d6355ee5AD8B037b015"
    }
  },
  mocha: {
    useColor: true
  }
};
