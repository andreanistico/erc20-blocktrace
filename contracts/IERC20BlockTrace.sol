// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20BlockTrace is IERC20 {

    struct BlockBalance {
        uint256 blockNumber;
        uint256 balance;
    }

    function balanceOfAtBlock(address account, uint256 blockNumber) external view returns (uint256);
    function getEditByIndex(address account, uint256 index) external view returns (BlockBalance memory);
    function getEditLength(address account) external view returns (uint256);
}