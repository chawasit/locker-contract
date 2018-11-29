App = {
  web3Provider: null,
  contracts: {},
  lockerId: function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    return parseInt(id);
  },

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
      return App.markLocker();
    });
  },

  markLocker: function () {
    var lockerInstance;

    App.contracts.Locker.deployed().then(function (instance) {
      lockerInstance = instance;

      return lockerInstance.lockerContract(App.lockerId());
    }).then(function (locker) {
      let owner = locker[0];
      let isAcquired = locker[1];
      let expire = new Date(locker[2] * 1000);

      App.render(App.lockerId(), owner, expire, isAcquired);

      lockerInstance.LockerAcquired().watch((error, event) => {
        if (error) 
          return;
        console.log(event)
        let args = event.args;
        let owner = args._acquire;
        let expire = new Date(web3.toDecimal(args._safeReleaseTime) * 1000);
        let id = web3.toDecimal(args._locker);

        if (App.lockerId() == id) {
          App.render(id, owner, expire, true);
        }
      });

      lockerInstance.LockerReleased().watch((error, event) => {
        if (error) 
          return;
        console.log(event)
        let args = event.args;
        let id = web3.toDecimal(args._locker);

        if (App.lockerId() == id) {
          App.render(id, "owner", expire, false);
        }
      })
    });
  },

  render: function (id, owner, expireDate, isAcquired) {
    let $id = $("#id");
    let $image = $("#image");
    let $owner = $("#owner");
    let $expire = $("#expire");
    let $description = $("#description");

    $id.html(id);
    $owner.html(owner);
    $expire.html(expireDate.toString());

    if (isAcquired) {
      $description.show();
      if (new Date() > expireDate) {
        $image.attr('src', '/images/overtimelock.svg');
      } else {
        $image.attr('src', '/images/safelock.svg');
      }
    } else {
      $description.hide();
      $image.attr('src', '/images/unlock.svg');
    }
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
