// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./ERC20BlockTrace.sol";

contract MintableERC20BlockTrace is ERC20BlockTrace {

    constructor (string memory _name, string memory _symbol, uint8 _decimals) 
        ERC20BlockTrace(_name, _symbol, _decimals) {}

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }
}