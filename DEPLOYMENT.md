# Deployment Information - ASD Testnet

## Contract Details

- **Network:** ASD Testnet
- **Chain ID:** 6677
- **Contract Address:** `0x061836B071d1519dEA4A59e41A46BF83f6546485`
- **Deployer Address:** `0x272B7dD2f0335f3ce319e4943FF7EdB0086C8aE7`
- **Admin Address:** `0x272B7dD2f0335f3ce319e4943FF7EdB0086C8aE7`
- **Deployment Date:** November 23, 2025
- **Verification Status:** ✅ Verified

## Network Information

- **Network Name:** ASD Testnet
- **RPC URL:** https://rpc.asdscan.ai
- **Block Explorer:** https://testnet.asdscan.ai/
- **Native Currency:** ASDT (ASD TESTNET)

## Contract Verification

Xem contract trên block explorer:
https://testnet.asdscan.ai/address/0x061836B071d1519dEA4A59e41A46BF83f6546485

## Contract Verification

✅ Contract đã được verify thành công!

**View Verified Source Code:**
https://testnet.asdscan.ai/address/0x061836B071d1519dEA4A59e41A46BF83f6546485#code

Bây giờ bạn có thể:
- Đọc source code trực tiếp trên block explorer
- Tương tác với contract qua Web UI của explorer
- Xem tất cả transactions và events

## Sử dụng Contract

### 1. Kết nối với Web3

```javascript
const { ethers } = require("ethers");

// RPC Provider
const provider = new ethers.JsonRpcProvider("https://rpc.asdscan.ai");

// Wallet
const privateKey = "YOUR_PRIVATE_KEY";
const wallet = new ethers.Wallet(privateKey, provider);

// Contract
const contractAddress = "0x061836B071d1519dEA4A59e41A46BF83f6546485";
const contractABI = require("./artifacts/contracts/AgriTrace.sol/AgriTrace.json").abi;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
```

### 2. Thêm vào MetaMask

**Network Settings:**
- Network Name: `ASD Testnet`
- RPC URL: `https://rpc.asdscan.ai`
- Chain ID: `6677`
- Currency Symbol: `ASDT`
- Block Explorer: `https://testnet.asdscan.ai/`

### 3. Import Contract vào MetaMask

Contract Address: `0x061836B071d1519dEA4A59e41A46BF83f6546485`

## Sử dụng các chức năng

### Admin - Đăng ký người dùng

```javascript
const farmerAddress = "0x...";
const farmerHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
    name: "Nguyen Van A",
    location: "Mekong Delta",
    phone: "0123456789"
})));

const tx = await contract.registerUser(farmerAddress, 1, farmerHash);
await tx.wait();
console.log("User registered!");
```

### Farmer - Đăng ký sản phẩm

```javascript
const productData = {
    name: "Organic ST25 Rice",
    type: "Rice",
    origin: "An Giang",
    area: "5 hectares"
};

const productHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(productData)));
const tx = await contract.registerProduct(productHash);
const receipt = await tx.wait();

console.log("Product registered!");
```

### Consumer - Tra cứu sản phẩm

```javascript
const productId = 1;
const [farmer, dataHash, status, registeredTime, activityIds] = 
    await contract.traceProduct(productId);

console.log("Farmer:", farmer);
console.log("Status:", ["Registered", "Harvested", "InTransit", "InStorage", "Sold"][status]);
console.log("Activities:", activityIds.length);
```

## Frontend Integration (React + wagmi)

```javascript
import { useContract, useSigner } from 'wagmi';

const contractConfig = {
    address: '0x061836B071d1519dEA4A59e41A46BF83f6546485',
    abi: AgriTraceABI,
};

function App() {
    const { data: signer } = useSigner();
    const contract = useContract({
        ...contractConfig,
        signerOrProvider: signer,
    });

    async function registerProduct(productData) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(productData)));
        const tx = await contract.registerProduct(hash);
        await tx.wait();
        return tx.hash;
    }

    return (
        <div>
            <button onClick={() => registerProduct({name: "Rice"})}>
                Register Product
            </button>
        </div>
    );
}
```

## Hardhat Console

Tương tác với contract qua console:

```bash
npx hardhat console --network asd
```

```javascript
const AgriTrace = await ethers.getContractFactory("AgriTrace");
const contract = AgriTrace.attach("0x061836B071d1519dEA4A59e41A46BF83f6546485");

// Lấy tổng số sản phẩm
const total = await contract.getTotalProducts();
console.log("Total products:", total.toString());

// Đăng ký user (chỉ admin)
const hash = ethers.keccak256(ethers.toUtf8Bytes("user data"));
await contract.registerUser("0x...", 1, hash);
```

## Testing trên ASD Testnet

```bash
# Chạy test trên network
npx hardhat test --network asd

# Verify contract (nếu hỗ trợ)
npx hardhat verify --network asd 0x061836B071d1519dEA4A59e41A46BF83f6546485
```

## Smart Contract Functions

Xem đầy đủ API Reference tại: [API_REFERENCE.md](./API_REFERENCE.md)

### Admin Functions
- `registerUser(address, role, infoHash)` - Đăng ký người dùng
- `deactivateUser(address)` - Vô hiệu hóa người dùng
- `getProductActivities(productId)` - Lấy activities

### Farmer Functions  
- `registerProduct(dataHash)` - Đăng ký sản phẩm
- `updateFarmingActivity(productId, activityHash)` - Cập nhật canh tác
- `recordProductionProcess(productId, processHash)` - Ghi nhận thu hoạch

### Distributor Functions
- `receiveFromFarmer(productId, receiveHash)` - Nhận từ farmer
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
- `submitReview(productId, reviewHash)` - Đánh giá

## Notes

- Contract admin là deployer: `0x272B7dD2f0335f3ce319e4943FF7EdB0086C8aE7`
- Chỉ admin mới có thể đăng ký users
- Tất cả dữ liệu được lưu dưới dạng hash để tiết kiệm gas
- Dữ liệu thực nên lưu off-chain (database hoặc IPFS)
- Mọi người đều có thể tra cứu sản phẩm (không cần đăng ký)

## Security

⚠️ **QUAN TRỌNG:** 
- Đã lưu private key trong `.env` - KHÔNG commit file này lên Git
- File `.gitignore` đã được cấu hình để ignore `.env`
- Không chia sẻ private key với ai
- Backup private key an toàn

## Support

Nếu cần hỗ trợ:
1. Kiểm tra [README.md](./README.md)
2. Xem [API_REFERENCE.md](./API_REFERENCE.md)
3. Xem [INTEGRATION.md](./INTEGRATION.md)
4. Chạy demo: `npx hardhat run scripts/demo.js --network asd`

