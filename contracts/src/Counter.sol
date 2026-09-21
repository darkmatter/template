// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Counter {
    address public immutable owner;
    uint256 public number;

    event NumberChanged(uint256 indexed newNumber, address indexed caller);

    error InvalidOwner();
    error Unauthorized(address caller);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert InvalidOwner();
        }

        owner = initialOwner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender);
        }

        _;
    }

    function setNumber(uint256 newNumber) external onlyOwner {
        number = newNumber;

        emit NumberChanged(newNumber, msg.sender);
    }

    function increment() external returns (uint256 newNumber) {
        newNumber = number + 1;
        number = newNumber;

        emit NumberChanged(newNumber, msg.sender);
    }
}
