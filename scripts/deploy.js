const hre = require("hardhat");

async function main() {
  console.log("Deploying AgriTrace contract...");

  const AgriTrace = await hre.ethers.getContractFactory("AgriTrace");
  const agriTrace = await AgriTrace.deploy();

  await agriTrace.waitForDeployment();

  const address = await agriTrace.getAddress();
  console.log("AgriTrace deployed to:", address);

  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployed by:", deployer.address);
  console.log("Admin address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

