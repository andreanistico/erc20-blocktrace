import { ethers } from "hardhat";

async function main() {
  let ERC20 = await ethers.getContractFactory("MintableERC20BlockTrace");
  let token = await ERC20.deploy(
      "", "", 0
  );
  await token.waitForDeployment();

  console.log(
    `Token ${process.env.NAME} deployed to ${token.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
