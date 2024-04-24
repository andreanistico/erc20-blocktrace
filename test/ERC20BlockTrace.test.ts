import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IERC20BlockTrace, TestERC20BlockTrace } from "../typechain-types";

describe("ERC20BlockTrace", function () {

  let account : SignerWithAddress;
  let secondAccount: SignerWithAddress;
  let token : TestERC20BlockTrace;
  let baseBlock : number;

  beforeEach(async () => {
    let ERC20 = await ethers.getContractFactory("TestERC20BlockTrace");
    let accounts = await ethers.getSigners();
    account = accounts[0];
    secondAccount = accounts[1];

    token = await ERC20.deploy(
        "", "", 0
    );
    await token.waitForDeployment();

    baseBlock = await ethers.provider.getBlockNumber();
  }),

  it("zero if no edit", async function () {
    let balance = await token.balanceOfAtBlock(account.address, baseBlock);

    expect(balance).to.equal(0);
  })

  it("zero before first edit", async function () {
    await token.mintTo(account.address, 10); //baseBlock + 1
    let balance = await token.balanceOfAtBlock(account.address, baseBlock);

    expect(balance).to.equal(0);
  })

  it("request after three edit", async function () {
    await travelBlocks(9);
    await token.mintTo(account.address, 10); //baseBlock + 10
    await travelBlocks(9); 
    await token.mintTo(account.address, 10); //baseBlock + 20
    await travelBlocks(9);
    await token.mintTo(account.address, 10); //baseBlock + 30

    let balance = await token.balanceOf(account.address);
    expect(balance).to.equal(30);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+5);
    expect(balance).to.equal(0);
    
    balance = await token.balanceOfAtBlock(account.address, baseBlock+15);
    expect(balance).to.equal(10);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+27);
    expect(balance).to.equal(20);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+30);
    expect(balance).to.equal(30);
  })

  it("request after three edit - multiple edit in same block", async function () {

    await token.writeManualHistory(account.address, [
      { blockNumber: 0, balance: 0 },
      { blockNumber: baseBlock+10, balance: 10 },
      { blockNumber: baseBlock+10, balance: 11 },
      { blockNumber: baseBlock+20, balance: 21 },
      { blockNumber: baseBlock+20, balance: 22 },
      { blockNumber: baseBlock+20, balance: 23 },
      { blockNumber: baseBlock+30, balance: 33 },
      { blockNumber: baseBlock+30, balance: 34 },
      { blockNumber: baseBlock+30, balance: 35 },
      { blockNumber: baseBlock+30, balance: 36 },
    ]);
    await travelBlocks(30);
  
    let balance = await token.balanceOf(account.address);
    expect(balance).to.equal(36);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+5);
    expect(balance).to.equal(0);
    
    balance = await token.balanceOfAtBlock(account.address, baseBlock+15);
    expect(balance).to.equal(11);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+27);
    expect(balance).to.equal(23);

    balance = await token.balanceOfAtBlock(account.address, baseBlock+30);
    expect(balance).to.equal(36);
  })

  it("check if writes a single BlockBalance for block if multiple edits", async function () {
    await token.mintTo(secondAccount, 1000);
    await travelBlocks(10);

    //disable automine
    //await ethers.provider.send("evm_setAutomine", [false]);
    //await ethers.provider.send("evm_setIntervalMining", [0]);
    let accountAddressX3 = [account.address, account.address, account.address];
    let oneX3 = [1,1,1];
    await token.connect(secondAccount).multipleTransfers(accountAddressX3, oneX3);
    await travelBlocks(10); //balance 3 at block base + 10
    await token.connect(secondAccount).multipleTransfers(accountAddressX3, oneX3);
    await travelBlocks(10); //balance 6 at block base + 20
    await token.connect(secondAccount).multipleTransfers(accountAddressX3, oneX3);
    await travelBlocks(10); //balance 9 at block base + 30

    //if multiple updates in the same block, just once has to be memorized
    //history should have [0, base+10, base+20, base+30] with balances
    let balanceHistory = [0, 3, 6, 9] //balances at the end of the block
    let balanceHistorySecondAccount = [0, 1000, 997, 994, 991] //balances at the end of the block


    let numberOfEdits = await token.getEditLength(account.address);
    let numberOfEditsSecondAccount = await token.getEditLength(secondAccount.address);
    expect(numberOfEdits).to.equal(balanceHistory.length);
    expect(numberOfEditsSecondAccount).to.equal(balanceHistorySecondAccount.length);

    for(let i=0; i<numberOfEdits; i++) {
      let blockBalance = await token.getEditByIndex(account.address, i);
      expect(blockBalance.balance).to.equal(balanceHistory[i]);
    }
    for(let i=0; i<numberOfEditsSecondAccount; i++) {
      let blockBalance = await token.getEditByIndex(secondAccount.address, i);
      expect(blockBalance.balance).to.equal(balanceHistorySecondAccount[i]);
    }
  })


  async function travelBlocks(blocks: number) {
    for(let i=0; i<blocks; i++) await ethers.provider.send("evm_mine");
  }
})
