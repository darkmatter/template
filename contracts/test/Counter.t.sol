// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Counter} from "../src/Counter.sol";

contract UnauthorizedCaller {
    function setNumber(Counter counter, uint256 value) external {
        counter.setNumber(value);
    }
}

contract CounterTest {
    Counter private counter;

    function setUp() public {
        counter = new Counter(address(this));
    }

    function testInitialState() public view {
        require(counter.owner() == address(this), "owner mismatch");
        require(counter.number() == 0, "initial number mismatch");
    }

    function testSetNumber(uint256 value) public {
        counter.setNumber(value);

        require(counter.number() == value, "set number mismatch");
    }

    function testIncrementReturnsAndStoresNextNumber() public {
        counter.setNumber(41);

        uint256 next = counter.increment();

        require(next == 42, "increment return mismatch");
        require(counter.number() == 42, "increment storage mismatch");
    }

    function testNonOwnerCannotSetNumber() public {
        UnauthorizedCaller caller = new UnauthorizedCaller();

        (bool ok, bytes memory data) = address(caller).call(abi.encodeCall(UnauthorizedCaller.setNumber, (counter, 7)));

        require(!ok, "non-owner setNumber succeeded");
        require(bytes4(data) == Counter.Unauthorized.selector, "wrong revert selector");
    }
}
