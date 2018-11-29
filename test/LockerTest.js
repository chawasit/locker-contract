var Locker = artifacts.require("./Locker.sol");

contract("Locker", function (accounts) {
    var lockerInstance;
    var fee;
    var slotTime;

    it("initializes", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance

            return instance.fee();
        }).then(function (fee) {
            assert.equal(fee, web3.toWei(0.1));

            return lockerInstance.slotTime();
        }).then(function (slotTime) {
            assert.equal(web3.toDecimal(slotTime), 3600 * 3);

            return lockerInstance.numberOfLocker();
        }).then(function (numberOflocker) {
            assert.equal(numberOflocker, 3);
        });
    });

    it("it initializes the locker must be empty", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.lockerContract(99);
        }).then(function (candidate) {
            assert.equal(candidate[1], false, "empty locker must not acquired.");
        });
    });

    it("it fee must change to 0.1 ether after call setFee(0.1 ether)", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;
            fee = web3.toWei(0.1);
            lockerInstance.setFee(fee);

            return lockerInstance.fee();
        }).then(function (newFee) {
            assert.equal(newFee, fee, "fee must be 0.1 ether.");
        });
    });

    it("it slotTime must change to 1 hour(3600sec) after call setSlotTime(3600)", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;
            slotTime = 3600;
            lockerInstance.setSlotTime(slotTime);

            return lockerInstance.slotTime();
        }).then(function (newSlotTime) {
            assert.equal(web3.toDecimal(newSlotTime), slotTime);
        });
    });

    it("it owner must change to accounts 1 after call changeOwner(accounts[1])", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;
            lockerInstance.changeOwner(accounts[1]);

            return lockerInstance.owner();
        }).then(function (owner) {
            assert.equal(web3.toDecimal(owner), accounts[1]);

            return lockerInstance.changeOwner(accounts[0], { from: accounts[1] });
        });
    });

    it("setFee should be restricted", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.setFee(web3.toWei(0.1), { from: accounts[1] });
        }).catch(assert.ok)
    });

    it("setSlotTime should be restricted", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.setSlotTime(3600, { from: accounts[1] });
        }).catch(assert.ok)
    });

    it("changeOwner should be restricted", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.changeOwner(accounts[1], { from: accounts[1] });
        }).catch(assert.ok)
    });

    it("forceRelease should be restricted", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.forceRelease(1, { from: accounts[1] });
        }).catch(assert.ok)
    });

    it("withdraw should be restricted", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.withdraw({ from: accounts[1] });
        }).catch(assert.ok)
    });

    it("owner should be able to forceRelease locker", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.acquire(3, { value: fee, from: accounts[1] });
        }).then(function (locker) {
            return lockerInstance.lockerContract(3);
        }).then(function (locker) {
            assert.equal(true, locker[1]);

            return lockerInstance.forceRelease(3, { from: accounts[0] })
        }).then(function (locker) {
            return lockerInstance.lockerContract(3);
        }).then(function (locker) {
            assert.equal(false, locker[1]);
        });
    });

    it("it should be able to set number of locker", function () {
        let currentNumberOfLocker
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;
            lockerInstance.setNumberOfLocker(10);

            return lockerInstance.numberOfLocker();
        }).then(function (numberOfLocker) {
            assert.equal(web3.toDecimal(numberOfLocker), 10);
        });
    });

    it("it should be able to acquire and release locker", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.acquire(3, { value: fee, from: accounts[1] });
        }).then(function (locker) {
            return lockerInstance.lockerContract(3);
        }).then(function (locker) {
            assert.equal(true, locker[1]);

            return lockerInstance.release(3, { from: accounts[1] })
        }).then(function (locker) {
            return lockerInstance.lockerContract(3);
        }).then(function (locker) {
            assert.equal(false, locker[1]);
        });
    });

    it("it should not be able to acquire unavailable locker", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.acquire(3, { value: fee, from: accounts[1] });
        }).then(function () {
            return lockerInstance.acquire(3, { value: fee, from: accounts[2] });
        }).catch(assert.ok);
    });

    it("it should not be able to release unowned locker", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.release(3, { value: fee, from: accounts[2] });
        }).catch(assert.ok);
    });

    it("it should not be able to release unacquired locker", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.release(1, { value: fee, from: accounts[1] });
        }).catch(assert.ok);
    });

    it("it should not be able to release overtime locker without additional fee", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.setSlotTime(0);
        }).then(function () {
            return lockerInstance.acquire(2, { value: fee, from: accounts[1] });
        }).then(function () {
            return lockerInstance.release(2, { value: 0, from: accounts[1] });
        }).then(function () {
            throw new Error();
        }).catch(assert.ok);
    });

    it("it should not be able to release overtime locker with additional fee", function () {
        return Locker.deployed().then(function (instance) {
            lockerInstance = instance;

            return lockerInstance.setSlotTime(0);
        }).then(function () {
            return lockerInstance.acquire(2, { value: fee, from: accounts[1] });
        }).then(function () {
            return lockerInstance.release(2, { value: web3.toWei(1), from: accounts[1] });
        }).then(function () {
            return lockerInstance.lockerContract(2);
        }).then(function (locker) {
            assert.equal(locker[1], false);
        }).catch(assert.fail);
    });

});