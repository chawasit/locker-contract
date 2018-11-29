App = {
  web3Provider: null,
  contracts: {},

  init: async function () {

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Locker.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var LockerArtifact = data;
      App.contracts.Locker = TruffleContract(LockerArtifact);

      // Set the provider for our contract
      App.contracts.Locker.setProvider(App.web3Provider);

      App.drawDashboard();

      // Use our contract to retrieve and mark the lockers
      return web3.eth.getAccounts(function (error, accounts) {
        if (error) {
          console.log(error);
        }

        return App.markLockers(accounts[0]);
      });
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-release', App.handleRelease);
    $(document).on('click', '#btn-fee', App.setFee);
    $(document).on('click', '#btn-slottime', App.setSlotTime);
    $(document).on('click', '#btn-capacity', App.setCapacity);
    $(document).on('click', '#btn-owner', App.transferOwner);
    $(document).on('click', '#btn-withdraw', App.withdraw);
  },

  markLockers: function (account) {
    var lockerInstance;
    var numberOfLocker;

    App.contracts.Locker.deployed().then(function (instance) {
      lockerInstance = instance;

      return lockerInstance.numberOfLocker();
    }).then(function (_numberOfLocker) {
      numberOfLocker = _numberOfLocker;

      console.log(`number of locker = ${numberOfLocker}`)

      var lockersRow = $('#lockersRow');
      var lockerTemplate = $('#lockerTemplate').clone(deepWithDataAndEvents = true);

      lockersRow.empty();

      for (i = 1; i <= numberOfLocker; i++) {
        let id = i;

        lockerInstance.lockerContract(id).then(function (locker) {
          console.log(`locker ${id} = ${locker}`)

          let owner = locker[0];
          let isAcquired = locker[1];
          let unixExpireTime = locker[2];

          let expireDate = new Date(unixExpireTime * 1000);

          lockerTemplate.find('.panel-title').text(`Locker No.${id}`);

          let $button = lockerTemplate.find('button');
          let $description = lockerTemplate.find('#description');

          if (isAcquired) {
            if (new Date() < expireDate) {
              lockerTemplate.find('img').attr('src', '/images/safelock.svg');
            } else {
              lockerTemplate.find('img').attr('src', '/images/overtimelock.svg');
            }

            $description.show();
            $button
              .attr('disabled', false)
              .addClass('btn-release');
          } else {
            lockerTemplate.find('img').attr('src', '/images/unlock.svg');
            $description.hide();
            $button
              .attr('disabled', true)
              .removeClass('btn-release')
          }

          lockerTemplate.find('.locker-owner').text(owner);
          lockerTemplate.find('.locker-expire').text(expireDate.toString());
          lockerTemplate.find('.btn-toggle').attr('data-id', id);

          lockersRow.append(lockerTemplate.html());
        })
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleRelease: function (event) {
    event.preventDefault();

    var lockerId = parseInt($(event.target).data('id'));

    var lockerInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.Locker.deployed().then(function (instance) {
        lockerInstance = instance;

        return lockerInstance.forceRelease(lockerId, { from: account });
      }).then(function (result) {
        return App.markLockers(account);
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },

  drawDashboard: function () {
    App.contracts.Locker.deployed().then(function (instance) {
      lockerInstance = instance;

      return lockerInstance.getBalance();
    }).then(function (balance) {
      let balanceDecimal = web3.toDecimal(balance)
      $("#balance").html(web3.fromWei(balanceDecimal));

      return lockerInstance.fee();
    }).then(function (fee) {
      let feeDecimal = web3.toDecimal(fee)
      $("#fee").html(web3.fromWei(feeDecimal));

      return lockerInstance.slotTime();
    }).then(function (slotTime) {
      let slotTimeDecimal = web3.toDecimal(slotTime)
      $("#slottime").html(slotTimeDecimal);

      return lockerInstance.numberOfLocker();
    }).then(function (numberOfLocker) {
      let numberOfLockerDecimal = web3.toDecimal(numberOfLocker)
      $("#capacity").html(numberOfLockerDecimal);

      return lockerInstance.owner();
    }).then(function (owner) {
      $("#owner").html(owner);

    }).catch(function (err) {
      console.log(err.message);
    });
  },

  setFee: function (event) {
    event.preventDefault();

    let fee = web3.toWei(parseFloat($("#form-fee").val()))

    App.contracts.Locker.deployed().then(function (instance) {
      return instance.setFee(fee);
    }).then(function () {
      return App.drawDashboard();
    });
  },

  setSlotTime: function (event) {
    event.preventDefault();

    let slotTime = parseInt($("#form-slottime").val());

    App.contracts.Locker.deployed().then(function (instance) {
      return instance.setSlotTime(slotTime);
    }).then(function () {
      return App.drawDashboard();
    });
  },

  setCapacity: function (event) {
    event.preventDefault();

    let numberOfLocker = parseInt($("#form-capacity").val())

    App.contracts.Locker.deployed().then(function (instance) {
      return instance.setNumberOfLocker(numberOfLocker);
    }).then(function () {
      return App.drawDashboard();
    });
  },

  transferOwner: function (event) {
    event.preventDefault();

    let owner = $("#form-owner").val();

    App.contracts.Locker.deployed().then(function (instance) {
      return instance.changeOwner(owner);
    }).then(function () {
      return App.drawDashboard();
    });
  },

  withdraw: function (event) {
    event.preventDefault();


    App.contracts.Locker.deployed().then(function (instance) {
      return instance.withdraw();
    }).then(function () {
      return App.drawDashboard();
    });
  },

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
