const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriTrace Contract", function () {
  let agriTrace;
  let admin, farmer, distributor, retailer, consumer;

  beforeEach(async function () {
    [admin, farmer, distributor, retailer, consumer] = await ethers.getSigners();

    const AgriTrace = await ethers.getContractFactory("AgriTrace");
    agriTrace = await AgriTrace.deploy();
    await agriTrace.waitForDeployment();
  });

  describe("User Management", function () {
    it("Should register users with different roles", async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);

      const userInfo = await agriTrace.getUserInfo(farmer.address);
      expect(userInfo.role).to.equal(1); // Farmer role
      expect(userInfo.isActive).to.equal(true);
    });

    it("Should not allow non-admin to register users", async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      await expect(
        agriTrace.connect(farmer).registerUser(distributor.address, 2, farmerHash)
      ).to.be.revertedWith("Only admin");
    });
  });

  describe("Farmer Functions", function () {
    beforeEach(async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
    });

    it("Should register a product", async function () {
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      const product = await agriTrace.products(1);
      expect(product.farmer).to.equal(farmer.address);
      expect(product.dataHash).to.equal(productHash);
      expect(product.status).to.equal(0); // Registered
    });

    it("Should update farming activity", async function () {
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      const activityHash = ethers.keccak256(ethers.toUtf8Bytes("Fertilizer applied"));
      await agriTrace.connect(farmer).updateFarmingActivity(1, activityHash);

      const activities = await agriTrace.getProductActivities(1);
      expect(activities.length).to.equal(1);
    });

    it("Should record production process and update status", async function () {
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      const processHash = ethers.keccak256(ethers.toUtf8Bytes("Harvesting completed"));
      await agriTrace.connect(farmer).recordProductionProcess(1, processHash);

      const product = await agriTrace.products(1);
      expect(product.status).to.equal(1); // Harvested
    });
  });

  describe("Distributor Functions", function () {
    beforeEach(async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      const distributorHash = ethers.keccak256(ethers.toUtf8Bytes("Distributor Info"));

      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
      await agriTrace.connect(admin).registerUser(distributor.address, 2, distributorHash);

      // Register and harvest product
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      const processHash = ethers.keccak256(ethers.toUtf8Bytes("Harvesting completed"));
      await agriTrace.connect(farmer).recordProductionProcess(1, processHash);
    });

    it("Should receive product from farmer", async function () {
      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from farmer"));
      await agriTrace.connect(distributor).receiveFromFarmer(1, receiveHash);

      const product = await agriTrace.products(1);
      expect(product.status).to.equal(2); // InTransit
    });

    it("Should update transport info", async function () {
      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from farmer"));
      await agriTrace.connect(distributor).receiveFromFarmer(1, receiveHash);

      const transportHash = ethers.keccak256(ethers.toUtf8Bytes("Temperature: 5C, Location: Hanoi"));
      await agriTrace.connect(distributor).updateTransportInfo(1, transportHash);

      const activities = await agriTrace.getProductActivities(1);
      expect(activities.length).to.be.greaterThan(0);
    });

    it("Should record storage condition", async function () {
      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from farmer"));
      await agriTrace.connect(distributor).receiveFromFarmer(1, receiveHash);

      const storageHash = ethers.keccak256(ethers.toUtf8Bytes("Stored at 4C"));
      await agriTrace.connect(distributor).recordStorageCondition(1, storageHash);

      const totalActivities = await agriTrace.getTotalActivities();
      expect(totalActivities).to.be.greaterThan(0);
    });
  });

  describe("Retailer Functions", function () {
    beforeEach(async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      const distributorHash = ethers.keccak256(ethers.toUtf8Bytes("Distributor Info"));
      const retailerHash = ethers.keccak256(ethers.toUtf8Bytes("Retailer Info"));

      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
      await agriTrace.connect(admin).registerUser(distributor.address, 2, distributorHash);
      await agriTrace.connect(admin).registerUser(retailer.address, 3, retailerHash);

      // Product flow to distributor
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      const processHash = ethers.keccak256(ethers.toUtf8Bytes("Harvesting completed"));
      await agriTrace.connect(farmer).recordProductionProcess(1, processHash);

      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from farmer"));
      await agriTrace.connect(distributor).receiveFromFarmer(1, receiveHash);
    });

    it("Should receive product from distributor", async function () {
      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from distributor"));
      await agriTrace.connect(retailer).receiveFromDistributor(1, receiveHash);

      const product = await agriTrace.products(1);
      expect(product.status).to.equal(3); // InStorage
    });

    it("Should sell to consumer", async function () {
      const receiveHash = ethers.keccak256(ethers.toUtf8Bytes("Received from distributor"));
      await agriTrace.connect(retailer).receiveFromDistributor(1, receiveHash);

      const saleHash = ethers.keccak256(ethers.toUtf8Bytes("Sold to consumer"));
      await agriTrace.connect(retailer).sellToConsumer(1, saleHash);

      const product = await agriTrace.products(1);
      expect(product.status).to.equal(4); // Sold
    });
  });

  describe("Consumer Functions", function () {
    beforeEach(async function () {
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      const distributorHash = ethers.keccak256(ethers.toUtf8Bytes("Distributor Info"));
      const retailerHash = ethers.keccak256(ethers.toUtf8Bytes("Retailer Info"));
      const consumerHash = ethers.keccak256(ethers.toUtf8Bytes("Consumer Info"));

      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
      await agriTrace.connect(admin).registerUser(distributor.address, 2, distributorHash);
      await agriTrace.connect(admin).registerUser(retailer.address, 3, retailerHash);
      await agriTrace.connect(admin).registerUser(consumer.address, 4, consumerHash);

      // Complete product flow
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Rice Product Data"));
      await agriTrace.connect(farmer).registerProduct(productHash);
      await agriTrace.connect(farmer).recordProductionProcess(1, ethers.keccak256(ethers.toUtf8Bytes("Harvested")));
      await agriTrace.connect(distributor).receiveFromFarmer(1, ethers.keccak256(ethers.toUtf8Bytes("Received")));
      await agriTrace.connect(retailer).receiveFromDistributor(1, ethers.keccak256(ethers.toUtf8Bytes("Received")));
      await agriTrace.connect(retailer).sellToConsumer(1, ethers.keccak256(ethers.toUtf8Bytes("Sold")));
    });

    it("Should trace product (anyone can trace)", async function () {
      const [farmerAddr, dataHash, status, registeredTime, activityIds] =
        await agriTrace.connect(consumer).traceProduct(1);

      expect(farmerAddr).to.equal(farmer.address);
      expect(status).to.equal(4); // Sold
      expect(activityIds.length).to.be.greaterThan(0);
    });

    it("Should confirm purchase", async function () {
      const purchaseHash = ethers.keccak256(ethers.toUtf8Bytes("Purchase confirmed"));
      await agriTrace.connect(consumer).confirmPurchase(1, purchaseHash);

      const totalActivities = await agriTrace.getTotalActivities();
      expect(totalActivities).to.be.greaterThan(0);
    });

    it("Should submit review", async function () {
      const reviewHash = ethers.keccak256(ethers.toUtf8Bytes("5 stars - Great quality!"));
      await agriTrace.connect(consumer).submitReview(1, reviewHash);

      const activities = await agriTrace.getProductActivities(1);
      expect(activities.length).to.be.greaterThan(0);
    });
  });

  describe("Full Product Journey", function () {
    it("Should complete full traceability journey", async function () {
      // Setup users
      const farmerHash = ethers.keccak256(ethers.toUtf8Bytes("Farmer Info"));
      const distributorHash = ethers.keccak256(ethers.toUtf8Bytes("Distributor Info"));
      const retailerHash = ethers.keccak256(ethers.toUtf8Bytes("Retailer Info"));
      const consumerHash = ethers.keccak256(ethers.toUtf8Bytes("Consumer Info"));

      await agriTrace.connect(admin).registerUser(farmer.address, 1, farmerHash);
      await agriTrace.connect(admin).registerUser(distributor.address, 2, distributorHash);
      await agriTrace.connect(admin).registerUser(retailer.address, 3, retailerHash);
      await agriTrace.connect(admin).registerUser(consumer.address, 4, consumerHash);

      // 1. Farmer registers product
      const productHash = ethers.keccak256(ethers.toUtf8Bytes("Organic Rice from Mekong Delta"));
      await agriTrace.connect(farmer).registerProduct(productHash);

      // 2. Farmer updates farming activities
      await agriTrace.connect(farmer).updateFarmingActivity(1, ethers.keccak256(ethers.toUtf8Bytes("Planted seeds")));
      await agriTrace.connect(farmer).updateFarmingActivity(1, ethers.keccak256(ethers.toUtf8Bytes("Applied fertilizer")));

      // 3. Farmer records harvest
      await agriTrace.connect(farmer).recordProductionProcess(1, ethers.keccak256(ethers.toUtf8Bytes("Harvested")));

      // 4. Distributor receives and transports
      await agriTrace.connect(distributor).receiveFromFarmer(1, ethers.keccak256(ethers.toUtf8Bytes("Received")));
      await agriTrace.connect(distributor).updateTransportInfo(1, ethers.keccak256(ethers.toUtf8Bytes("In transit")));
      await agriTrace.connect(distributor).recordStorageCondition(1, ethers.keccak256(ethers.toUtf8Bytes("Temp: 5C")));

      // 5. Retailer receives and stores
      await agriTrace.connect(retailer).receiveFromDistributor(1, ethers.keccak256(ethers.toUtf8Bytes("Received")));
      await agriTrace.connect(retailer).updateWarehouseInfo(1, ethers.keccak256(ethers.toUtf8Bytes("In warehouse")));

      // 6. Retailer sells to consumer
      await agriTrace.connect(retailer).sellToConsumer(1, ethers.keccak256(ethers.toUtf8Bytes("Sold")));

      // 7. Consumer confirms and reviews
      await agriTrace.connect(consumer).confirmPurchase(1, ethers.keccak256(ethers.toUtf8Bytes("Confirmed")));
      await agriTrace.connect(consumer).submitReview(1, ethers.keccak256(ethers.toUtf8Bytes("5 stars")));

      // Verify complete journey
      const activities = await agriTrace.getProductActivities(1);
      expect(activities.length).to.equal(11); // Total activities in the journey

      const [farmerAddr, dataHash, status] = await agriTrace.traceProduct(1);
      expect(farmerAddr).to.equal(farmer.address);
      expect(status).to.equal(4); // Sold
    });
  });
});

