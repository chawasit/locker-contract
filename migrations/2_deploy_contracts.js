var Locker = artifacts.require("./Locker.sol");

module.exports = function(deployer) {
  // initial 0.1 ether fee, 3 hours slot time, 3 lockers
  deployer.deploy(Locker, web3.toWei(0.1), 3600 * 3, 3);
};
