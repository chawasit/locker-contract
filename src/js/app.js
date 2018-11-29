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
    $(document).on('click', '.btn-acquire', App.handleAcquire);
    $(document).on('click', '.btn-release', App.handleRelease);
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
            if (owner == account) {
              $button
                .text('Release')
                .attr('disabled', false)
                .removeClass('btn-acquire')
                .addClass('btn-release');
                if (new Date() > expireDate) {
                  $button
                    .text('Overtime Release')
                }
            } else {
              $button
                .text('Acquired')
                .attr('disabled', true)
                .removeClass('btn-acquire');

            }
          } else {
            lockerTemplate.find('img').attr('src', '/images/unlock.svg');
            $description.hide();
            $button
              .text('Acquire')
              .attr('disabled', false)
              .removeClass('btn-release')
              .addClass('btn-acquire');
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

  handleAcquire: function (event) {
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
                
        return lockerInstance.fee();
      }).then(function (fee) {
        // Execute acquire as a transaction by sending account
        return lockerInstance.acquire(lockerId, { from: account, value: fee });
      }).then(function (result) {
        return App.markLockers(account);
      }).catch(function (err) {
        console.log(err.message);
      });
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
      var fee;
      App.contracts.Locker.deployed().then(function (instance) {
        lockerInstance = instance;
        
        return lockerInstance.fee();
      }).then(function (_fee) {
        fee = _fee

        return lockerInstance.lockerContract(lockerId);
      }).then(function (locker) {
        let expireTime = new Date(locker[2] * 1000);

        if (expireTime < new Date()) {
        // Execute release as a transaction by sending account
          return lockerInstance.release(lockerId, { from: account, value: fee / 2 });
        } else {
          return lockerInstance.release(lockerId, { from: account });
        }
      }).then(function (result) {
        return App.markLockers(account);
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
