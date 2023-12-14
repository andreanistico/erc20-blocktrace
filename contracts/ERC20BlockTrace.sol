// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./IERC20BlockTrace.sol";

contract ERC20BlockTrace is IERC20BlockTrace {

    struct BlockBalance {
        uint256 blockNumber;
        uint256 balance;
    }
    string public name;
    string public symbol;
    uint8 private _decimals;
    uint256 _totalSupply;
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => BlockBalance[]) public editBlocks;

    error InsufficientBalance();
    error InsufficientAllowance();
    error OneOperationForBlock();
    error FutureBlockRequested();
    
    constructor (string memory _name, string memory _symbol, uint8 __decimals) {
        name = _name;
        symbol = _symbol;
        _decimals = __decimals;
    }

    //classical erc20
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        return _transfer(msg.sender, to, value);
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if(from != msg.sender && allowance(from, msg.sender) < value) revert InsufficientAllowance();
        return _transfer(from, to, value);
    }

    // internal erc20 methods
    function _mint(address to, uint256 value) internal {
        _add(to, value);
        _totalSupply += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        _subtract(from, value);
        _totalSupply -= value;
        emit Transfer(from, address(0), value);
    }

    // modified erc20 methods
    function _transfer(address from, address to, uint256 value) internal returns(bool) {
        if(balanceOf(from) < value) revert InsufficientBalance();
        
        //increase balance of receiver
        _add(to, value);
        //decrease balance of sender
        _subtract(from, value);

        emit Transfer(from, to, value);
        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return lastBlockForAddress(account).balance;
    }

    // block-specific methods
    function lastBlockForAddress(address account) public view returns(BlockBalance memory) {
        if(editBlocks[account].length == 0) return BlockBalance(0, 0);

        return editBlocks[account][editBlocks[account].length - 1];
    }

    function getBlockEditsLength(address account) public view returns(uint256) {
        return editBlocks[account].length;
    }

    //every time balance is modified, is modified through these _add and _subtract methods
    function _add(address account, uint256 value) internal { 
        BlockBalance memory lastBlockForAddr = lastBlockForAddress(account);

        //first edit (it can only be an add) - explicitely write 0 for search purposes
        if(lastBlockForAddr.blockNumber == 0) {
            editBlocks[account].push(BlockBalance(0, 0));
        }

        //copy last balance and apply update
        editBlocks[account].push(
            BlockBalance(block.number, lastBlockForAddr.balance + value)
        );
    }

    function _subtract(address account, uint256 value) internal {
        BlockBalance memory lastBlockForAddr = lastBlockForAddress(account);

        //copy last balance and apply update
        editBlocks[account].push(
            BlockBalance(block.number, lastBlockForAddr.balance - value)
        );
    }

    // --------------------------------------------------------------------------------------------------------

    // HISTORIC BALANCE AT A BLOCK NUMBER

    // O(log(n)) on the size of user balance edits
    function balanceOfAtBlock(address account, uint256 blockNumber) override public view returns(uint256) { 

        BlockBalance memory lastBlock = nearestLowerOrEqualBlockForAddress(account, blockNumber);
        return lastBlock.balance;
    }

    //binary search to find nearest lower Block for address - O(log(n)) on the size of user balance edit
    function nearestLowerOrEqualBlockForAddress(address account, uint256 blockNumber) public view returns(BlockBalance memory) {
         if(blockNumber > block.number) revert FutureBlockRequested();

        BlockBalance[] storage blockList = editBlocks[account];

        //check if latest is already good - cover also length == 0
        BlockBalance memory lastBlockForAddr = lastBlockForAddress(account);
        if(blockNumber >= lastBlockForAddr.blockNumber) return lastBlockForAddr;

        //variables for binary search
        uint256 lowerIndex; // = 0
        uint256 upperIndex = blockList.length - 1; 
        //upper is -1 because if the latest was good we already had found that
        //we're sure that length >= 2 because we checked for length == 0 and length cannot be 1 (first "_add" add two BlockBalances)
        uint256 currentIndex;
        BlockBalance memory currentBlock;
        BlockBalance memory immediatelyUpperBlock;

        while(lowerIndex < upperIndex) {
            currentIndex = (lowerIndex + upperIndex) / 2;
            currentBlock = blockList[currentIndex];
            immediatelyUpperBlock = blockList[currentIndex + 1]; // since max is -2, this won't overflow

            //check if we reached the exact value or the nearest lower
            //optimization of value == blockNumber || (value < blockNumber && immediatelyUpperValue > blockNumber)
            if(currentBlock.blockNumber <= blockNumber && immediatelyUpperBlock.blockNumber > blockNumber) break;

            //update search indexes
            if(currentBlock.blockNumber > blockNumber) upperIndex = currentIndex; //we're too high, let's go down
            else lowerIndex = currentIndex; //we're too low, let's go up
        }

        //be sure to be on the last update of that block
        //this could make the method collapse to O(n) if all the edits are in the same block
        //strange case, i don't care about it
        while(currentIndex < blockList.length) {
            currentIndex++;
            BlockBalance memory next = blockList[currentIndex];
            if(next.blockNumber > currentBlock.blockNumber) break; //found
            //else we're in the same block but there is an updated value
            currentBlock = next;
        }
        return currentBlock;
    }
}