# AgriTrace Smart Contract

Smart contract truy xuất nguồn gốc nông sản trên blockchain, chỉ lưu hash và ID để tối ưu gas.

## 🚀 Deployed Contract

**ASD Testnet:**
- Contract Address: `0x061836B071d1519dEA4A59e41A46BF83f6546485`
- Chain ID: `6677`
- Block Explorer: https://testnet.asdscan.ai/address/0x061836B071d1519dEA4A59e41A46BF83f6546485

## Tính năng

### 1. Chức năng Nông dân (Farmer)
- ✅ Đăng ký sản phẩm nông nghiệp
- ✅ Cập nhật thông tin canh tác
- ✅ Ghi nhận quy trình sản xuất

### 2. Chức năng Nhà phân phối (Distributor)
- ✅ Tiếp nhận sản phẩm từ nông dân
- ✅ Cập nhật thông tin vận chuyển
- ✅ Ghi nhận điều kiện bảo quản
- ✅ Chuyển giao sản phẩm cho retailer

### 3. Chức năng Người bán (Retailer)
- ✅ Tiếp nhận sản phẩm từ nhà phân phối
- ✅ Cập nhật thông tin lưu kho
- ✅ Bán sản phẩm cho người tiêu dùng

### 4. Chức năng Người tiêu dùng (Consumer)
- ✅ Quét mã QR/barcode để xem thông tin
- ✅ Xem lịch sử truy xuất nguồn gốc
- ✅ Xác nhận mua hàng
- ✅ Đánh giá và phản hồi về sản phẩm

### 5. Chức năng Admin
- ✅ Đăng ký người dùng
- ✅ Vô hiệu hóa người dùng
- ✅ Xem lịch sử truy xuất nguồn gốc
- ✅ Quản lý hệ thống

## Cấu trúc dữ liệu

### Role (Vai trò)
- `None` (0): Không có vai trò
- `Farmer` (1): Nông dân
- `Distributor` (2): Nhà phân phối
- `Retailer` (3): Người bán lẻ
- `Consumer` (4): Người tiêu dùng
- `Admin` (5): Quản trị viên

### ProductStatus (Trạng thái sản phẩm)
- `Registered` (0): Đã đăng ký
- `Harvested` (1): Đã thu hoạch
- `InTransit` (2): Đang vận chuyển
- `InStorage` (3): Đang lưu kho
- `Sold` (4): Đã bán

## Nguyên tắc thiết kế

1. **Chỉ lưu hash và ID**: Tất cả dữ liệu chi tiết được lưu off-chain, chỉ lưu hash trên blockchain
2. **Single contract**: Tất cả logic nằm trong 1 contract duy nhất
3. **Role-based access**: Phân quyền theo vai trò
4. **Event-driven**: Emit event cho mọi hành động quan trọng

## Cài đặt

```bash
npm install
```

## Biên dịch

```bash
npx hardhat compile
```

## Test

```bash
npx hardhat test
```

## Deploy

### Deploy lên ASD Testnet

1. Tạo file `.env` từ `.env.example`:
```bash
copy .env.example .env
```

2. Điền private key vào `.env`:
```env
PRIVATE_KEY=your_private_key_here
ASD_RPC_URL=https://rpc.asdscan.ai
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network asd
```

Xem chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Deploy lên Local Network

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy lên testnet (ví dụ: Sepolia)

1. Cấu hình `.env`:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

2. Cập nhật `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Sử dụng

### 1. Admin đăng ký người dùng

```javascript
const farmerHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
  name: "Nguyen Van A",
  location: "Mekong Delta",
  phone: "0123456789"
})));

await agriTrace.registerUser(farmerAddress, 1, farmerHash); // 1 = Farmer role
```

### 2. Farmer đăng ký sản phẩm

```javascript
const productHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
  name: "Organic Rice",
  type: "ST25",
  origin: "An Giang",
  area: "5 hectares"
})));

await agriTrace.connect(farmer).registerProduct(productHash);
```

### 3. Farmer cập nhật hoạt động canh tác

```javascript
const activityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
  activity: "Applied organic fertilizer",
  date: "2025-11-01",
  quantity: "500kg"
})));

await agriTrace.connect(farmer).updateFarmingActivity(productId, activityHash);
```

### 4. Consumer tra cứu sản phẩm

```javascript
const [farmer, dataHash, status, registeredTime, activityIds] = 
  await agriTrace.traceProduct(productId);

// Lấy chi tiết từng activity
for (let activityId of activityIds) {
  const [productId, actor, activityHash, timestamp] = 
    await agriTrace.getActivity(activityId);
  // Decode activityHash from off-chain database
}
```

## Ví dụ Flow hoàn chỉnh

```javascript
// 1. Admin setup users
await agriTrace.registerUser(farmer.address, 1, farmerHash);
await agriTrace.registerUser(distributor.address, 2, distributorHash);
await agriTrace.registerUser(retailer.address, 3, retailerHash);
await agriTrace.registerUser(consumer.address, 4, consumerHash);

// 2. Farmer journey
await agriTrace.connect(farmer).registerProduct(productHash);
await agriTrace.connect(farmer).updateFarmingActivity(1, activity1Hash);
await agriTrace.connect(farmer).recordProductionProcess(1, harvestHash);

// 3. Distributor journey
await agriTrace.connect(distributor).receiveFromFarmer(1, receiveHash);
await agriTrace.connect(distributor).updateTransportInfo(1, transportHash);
await agriTrace.connect(distributor).recordStorageCondition(1, storageHash);
await agriTrace.connect(distributor).transferToRetailer(1, transferHash);

// 4. Retailer journey
await agriTrace.connect(retailer).receiveFromDistributor(1, receiveHash);
await agriTrace.connect(retailer).updateWarehouseInfo(1, warehouseHash);
await agriTrace.connect(retailer).sellToConsumer(1, saleHash);

// 5. Consumer journey
await agriTrace.connect(consumer).confirmPurchase(1, purchaseHash);
await agriTrace.connect(consumer).submitReview(1, reviewHash);

// 6. Anyone can trace
const traceInfo = await agriTrace.traceProduct(1);
```

## Các hàm chính

### Admin Functions
- `registerUser(address, role, infoHash)` - Đăng ký người dùng
- `deactivateUser(address)` - Vô hiệu hóa người dùng
- `getProductActivities(productId)` - Lấy danh sách activities

### Farmer Functions
- `registerProduct(dataHash)` - Đăng ký sản phẩm
- `updateFarmingActivity(productId, activityHash)` - Cập nhật canh tác
- `recordProductionProcess(productId, processHash)` - Ghi nhận thu hoạch

### Distributor Functions
- `receiveFromFarmer(productId, receiveHash)` - Nhận từ nông dân
- `updateTransportInfo(productId, transportHash)` - Cập nhật vận chuyển
- `recordStorageCondition(productId, storageHash)` - Ghi điều kiện bảo quản
- `transferToRetailer(productId, transferHash)` - Chuyển cho retailer

### Retailer Functions
- `receiveFromDistributor(productId, receiveHash)` - Nhận từ distributor
- `updateWarehouseInfo(productId, storageHash)` - Cập nhật kho
- `sellToConsumer(productId, saleHash)` - Bán cho consumer

### Consumer Functions
- `traceProduct(productId)` - Tra cứu sản phẩm (không cần role)
- `confirmPurchase(productId, purchaseHash)` - Xác nhận mua
- `submitReview(productId, reviewHash)` - Đánh giá sản phẩm

### Helper Functions
- `getUserInfo(address)` - Lấy thông tin user
- `getActivity(activityId)` - Lấy thông tin activity
- `getTotalProducts()` - Tổng số sản phẩm
- `getTotalActivities()` - Tổng số hoạt động

## Lưu ý

1. **Gas Optimization**: Contract chỉ lưu hash và ID, dữ liệu thực được lưu off-chain (database, IPFS)
2. **Security**: Sử dụng role-based access control, mỗi function có modifier kiểm tra quyền
3. **Traceability**: Mọi hoạt động được ghi lại với timestamp và actor
4. **Events**: Emit event cho tất cả hành động để dễ tracking

## License

MIT

#   a g r i - t r a c e - s m  
 #   a g r i - t r a c e - s m  
 