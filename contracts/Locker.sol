pragma solidity ^0.4.24;

contract Locker {
    address public owner;
    uint public fee;
    uint public slotTime;
    uint public numberOfLocker;

    struct locker {
        address owner;
        bool isAcquired;
        uint safeReleaseTime;
    }

    event LockerAcquired(address _acquire, uint _safeReleaseTime, uint _locker);
    event LockerReleased(uint _locker);

    mapping(uint => locker) public lockerContract;

    modifier restricted() {
        require(
            msg.sender == owner,
            "Sender not authorized."
        );
        _;
    }

    constructor(uint _fee, uint _slotTime, uint _numberOfLocker) 
        public 
    {
        owner = msg.sender;
        fee = _fee;
        slotTime = _slotTime;
        numberOfLocker = _numberOfLocker;
    }

    function setNumberOfLocker(uint _numberOfLocker) 
        public
        restricted
    {
        require(
            _numberOfLocker > 0, 
            "number of locker must greater than zero"
        );

        if (_numberOfLocker < numberOfLocker) {
            for (uint i = _numberOfLocker + 1; i <= numberOfLocker; i++) {
                lockerContract[i].isAcquired = false;

                emit LockerReleased(i);
            }
        }

        numberOfLocker = _numberOfLocker;
    }

    function changeOwner(address _newOwner)
        public 
        restricted
    {
        owner = _newOwner;
    }

    function getBalance()
        public
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    function withdraw() 
        public 
        restricted 
    {
        msg.sender.transfer(address(this).balance);
    }

    function setFee(uint _newFee)
        public 
        restricted
    {
        fee = _newFee;
    }

    function setSlotTime(uint _slotTime)
        public
        restricted
    {
        slotTime = _slotTime;
    }

    function acquire(uint _locker)
        public
        payable
    {  
        require(_locker > 0 && _locker <= numberOfLocker, "invalid locker.");
        require(!lockerContract[_locker].isAcquired, "this locker is acquired.");
        require(msg.value >= fee, "minimum fee is required.");

        uint safeReleaseTime = now + slotTime;
        lockerContract[_locker].owner = msg.sender;
        lockerContract[_locker].isAcquired = true;
        lockerContract[_locker].safeReleaseTime = safeReleaseTime;

        emit LockerAcquired(msg.sender, safeReleaseTime, _locker);
    }

    function release(uint _locker)
        public
        payable
    {
        require(_locker > 0 && _locker <= numberOfLocker, "invalid locker.");
        require(lockerContract[_locker].isAcquired, "this locker is not acquired.");
        require(lockerContract[_locker].owner == msg.sender, "must be owner.");

        uint safeReleaseTime = lockerContract[_locker].safeReleaseTime;
        if (safeReleaseTime < now) 
            require(msg.value >= fee / 2, "Overtime, half of fee is required");
        
        lockerContract[_locker].isAcquired = false;

        emit LockerReleased(_locker);
    }

    function forceRelease(uint _locker)
        public
        restricted
    {
        require(_locker > 0 && _locker <= numberOfLocker, "invalid locker.");

        lockerContract[_locker].isAcquired = false;

        emit LockerReleased(_locker);
    }

    function() 
        external
        payable
    {
        // do nothing
    }

}
