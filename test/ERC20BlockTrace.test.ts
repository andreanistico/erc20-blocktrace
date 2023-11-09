import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TestERC20BlockTrace } from "../typechain-types";

describe("ERC20BlockTrace", function () {

  let account : SignerWithAddress;
  let token : TestERC20BlockTrace;
  let baseBlock : number;

  beforeEach(async () => {
    let ERC20 = await ethers.getContractFactory("TestERC20BlockTrace");
    let accounts = await ethers.getSigners();
    account = accounts[0];

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


  async function travelBlocks(blocks: number) {
    for(let i=0; i<blocks; i++) await ethers.provider.send("evm_mine");
  }
})
