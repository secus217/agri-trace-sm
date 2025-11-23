const hre = require("hardhat");

/**
 * Script demo cách sử dụng AgriTrace contract
 * Minh họa flow hoàn chỉnh từ farmer -> distributor -> retailer -> consumer
 */

async function main() {
  console.log("\n=== DEMO AGRITRACE SMART CONTRACT ===\n");

  // Get signers
  const [admin, farmer, distributor, retailer, consumer] = await hre.ethers.getSigners();

  console.log("Accounts:");
  console.log("Admin:", admin.address);
  console.log("Farmer:", farmer.address);
  console.log("Distributor:", distributor.address);
  console.log("Retailer:", retailer.address);
  console.log("Consumer:", consumer.address);

  // Deploy contract
  console.log("\n1. Deploying contract...");
  const AgriTrace = await hre.ethers.getContractFactory("AgriTrace");
  const agriTrace = await AgriTrace.deploy();
  await agriTrace.waitForDeployment();

  const contractAddress = await agriTrace.getAddress();
  console.log("✓ Contract deployed at:", contractAddress);

  // Register users
  console.log("\n2. Admin registering users...");

  const farmerHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    name: "Nguyen Van A",
    location: "Mekong Delta",
    phone: "0123456789"
  })));
  await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
  console.log("✓ Farmer registered");

  const distributorHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    name: "VN Express Logistics",
    location: "Hanoi",
    phone: "0987654321"
  })));
  await agriTrace.connect(admin).registerUser(distributor.address, 2, distributorHash);
  console.log("✓ Distributor registered");

  const retailerHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    name: "VinMart Supermarket",
    location: "Ho Chi Minh City",
    phone: "0111222333"
  })));
  await agriTrace.connect(admin).registerUser(retailer.address, 3, retailerHash);
  console.log("✓ Retailer registered");

  const consumerHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    name: "Tran Thi B",
    phone: "0444555666"
  })));
  await agriTrace.connect(admin).registerUser(consumer.address, 4, consumerHash);
  console.log("✓ Consumer registered");

  // Farmer registers product
  console.log("\n3. Farmer registering product...");
  const productHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    name: "Organic ST25 Rice",
    type: "Rice",
    variety: "ST25",
    origin: "An Giang Province",
    area: "5 hectares",
    farmingMethod: "Organic",
    certifications: ["VietGAP", "Organic Cert"]
  })));

  const tx1 = await agriTrace.connect(farmer).registerProduct(productHash);
  await tx1.wait();
  const productId = 1;
  console.log("✓ Product registered with ID:", productId);

  // Farmer updates farming activities
  console.log("\n4. Farmer updating farming activities...");

  const activity1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Planted seeds",
    date: "2025-01-15",
    details: "ST25 rice seeds planted"
  })));
  await (await agriTrace.connect(farmer).updateFarmingActivity(productId, activity1)).wait();
  console.log("✓ Activity 1: Planted seeds");

  const activity2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Applied organic fertilizer",
    date: "2025-02-01",
    fertilizer: "Organic compost",
    quantity: "500kg"
  })));
  await (await agriTrace.connect(farmer).updateFarmingActivity(productId, activity2)).wait();
  console.log("✓ Activity 2: Applied organic fertilizer");

  const activity3 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Pest control",
    date: "2025-03-01",
    method: "Biological pest control"
  })));
  await (await agriTrace.connect(farmer).updateFarmingActivity(productId, activity3)).wait();
  console.log("✓ Activity 3: Pest control");

  // Farmer records harvest
  console.log("\n5. Farmer recording harvest...");
  const harvestHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Harvested",
    date: "2025-05-20",
    quantity: "25 tons",
    quality: "Grade A"
  })));
  await (await agriTrace.connect(farmer).recordProductionProcess(productId, harvestHash)).wait();
  console.log("✓ Harvest recorded");

  // Distributor receives from farmer
  console.log("\n6. Distributor receiving from farmer...");
  const receiveFromFarmerHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Received from farmer",
    date: "2025-05-21",
    location: "An Giang",
    quantity: "25 tons",
    condition: "Fresh, Grade A"
  })));
  await (await agriTrace.connect(distributor).receiveFromFarmer(productId, receiveFromFarmerHash)).wait();
  console.log("✓ Distributor received product");

  // Distributor updates transport info
  console.log("\n7. Distributor updating transport...");
  const transport1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Transport update",
    date: "2025-05-21 10:00",
    location: "On Highway 1",
    temperature: "5°C",
    humidity: "60%"
  })));
  await (await agriTrace.connect(distributor).updateTransportInfo(productId, transport1)).wait();
  console.log("✓ Transport update 1");

  const transport2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Transport update",
    date: "2025-05-21 18:00",
    location: "Arrived in HCMC",
    temperature: "5°C",
    humidity: "58%"
  })));
  await (await agriTrace.connect(distributor).updateTransportInfo(productId, transport2)).wait();
  console.log("✓ Transport update 2");

  // Distributor records storage condition
  const storageHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Storage condition",
    date: "2025-05-21",
    temperature: "4°C",
    humidity: "55%",
    duration: "24 hours"
  })));
  await (await agriTrace.connect(distributor).recordStorageCondition(productId, storageHash)).wait();
  console.log("✓ Storage condition recorded");

  // Distributor transfers to retailer
  const transferHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Transfer to retailer",
    date: "2025-05-22",
    quantity: "25 tons"
  })));
  await (await agriTrace.connect(distributor).transferToRetailer(productId, transferHash)).wait();
  console.log("✓ Transferred to retailer");

  // Retailer receives from distributor
  console.log("\n8. Retailer receiving from distributor...");
  const receiveFromDistHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Received from distributor",
    date: "2025-05-22",
    quantity: "25 tons",
    condition: "Good"
  })));
  await (await agriTrace.connect(retailer).receiveFromDistributor(productId, receiveFromDistHash)).wait();
  console.log("✓ Retailer received product");

  // Retailer updates warehouse
  const warehouseHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Warehouse storage",
    date: "2025-05-22",
    location: "VinMart Central Warehouse",
    temperature: "18°C",
    section: "A-12"
  })));
  await (await agriTrace.connect(retailer).updateWarehouseInfo(productId, warehouseHash)).wait();
  console.log("✓ Warehouse info updated");

  // Retailer sells to consumer
  console.log("\n9. Retailer selling to consumer...");
  const saleHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Sold to consumer",
    date: "2025-05-25",
    quantity: "5kg",
    price: "150000 VND",
    store: "VinMart District 1"
  })));
  await (await agriTrace.connect(retailer).sellToConsumer(productId, saleHash)).wait();
  console.log("✓ Product sold");

  // Consumer confirms purchase
  console.log("\n10. Consumer confirming purchase...");
  const purchaseHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Purchase confirmed",
    date: "2025-05-25",
    quantity: "5kg",
    paymentMethod: "Cash"
  })));
  await (await agriTrace.connect(consumer).confirmPurchase(productId, purchaseHash)).wait();
  console.log("✓ Purchase confirmed");

  // Consumer submits review
  const reviewHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify({
    activity: "Product review",
    date: "2025-05-26",
    rating: 5,
    comment: "Excellent quality rice! Very fragrant and tasty.",
    recommend: true
  })));
  await (await agriTrace.connect(consumer).submitReview(productId, reviewHash)).wait();
  console.log("✓ Review submitted");

  // Trace product
  console.log("\n11. Tracing product history...");
  const [farmerAddr, dataHash, status, registeredTime, activityIds] =
    await agriTrace.traceProduct(productId);

  console.log("\nProduct Information:");
  console.log("- Product ID:", productId);
  console.log("- Farmer:", farmerAddr);
  console.log("- Data Hash:", dataHash);
  console.log("- Status:", ["Registered", "Harvested", "InTransit", "InStorage", "Sold"][status]);
  console.log("- Registered Time:", new Date(Number(registeredTime) * 1000).toISOString());
  console.log("- Total Activities:", activityIds.length);

  console.log("\nActivity Timeline:");
  for (let i = 0; i < activityIds.length; i++) {
    const [prodId, actor, actHash, timestamp] = await agriTrace.getActivity(activityIds[i]);
    console.log(`\nActivity ${i + 1}:`);
    console.log("  - ID:", activityIds[i].toString());
    console.log("  - Actor:", actor);
    console.log("  - Hash:", actHash);
    console.log("  - Time:", new Date(Number(timestamp) * 1000).toISOString());
  }

  // Get totals
  const totalProducts = await agriTrace.getTotalProducts();
  const totalActivities = await agriTrace.getTotalActivities();

  console.log("\n=== SUMMARY ===");
  console.log("Total Products:", totalProducts.toString());
  console.log("Total Activities:", totalActivities.toString());
  console.log("\n✓ Demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

