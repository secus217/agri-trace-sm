# Hướng dẫn tích hợp AgriTrace Smart Contract

## 1. Cài đặt

```bash
npm install
```

## 2. Biên dịch Contract

```bash
npx hardhat compile
```

## 3. Chạy Test

```bash
npx hardhat test
```

## 4. Chạy Demo

```bash
npx hardhat run scripts/demo.js
```

## 5. Deploy Contract

### Deploy lên Local Network

```bash
# Terminal 1: Khởi động node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy lên Testnet (Sepolia/Mumbai)

1. Tạo file `.env`:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
```

2. Cập nhật `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337
    },
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

## 6. Tích hợp với Backend

### Node.js/Express Example

```javascript
const { ethers } = require("ethers");

// Kết nối với blockchain
const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Load contract
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = require("./artifacts/contracts/AgriTrace.sol/AgriTrace.json").abi;
const contract = new ethers.Contract(contractAddress, contractABI, signer);

// API endpoint để đăng ký sản phẩm
app.post("/api/products", async (req, res) => {
  try {
    const { name, type, origin, ...productData } = req.body;
    
    // Lưu dữ liệu vào database và lấy ID
    const dbProduct = await db.products.create(productData);
    
    // Tạo hash từ dữ liệu
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(productData))
    );
    
    // Gọi smart contract
    const tx = await contract.registerProduct(dataHash);
    const receipt = await tx.wait();
    
    // Lấy productId từ event
    const event = receipt.logs.find(log => 
      log.topics[0] === ethers.id("ProductRegistered(uint256,address,bytes32)")
    );
    const productId = ethers.decodeEventLog(
      "ProductRegistered(uint256,address,bytes32)",
      event.data,
      event.topics
    )[0];
    
    // Cập nhật database với productId từ blockchain
    await db.products.update(dbProduct.id, { 
      blockchainId: productId.toString(),
      txHash: receipt.hash
    });
    
    res.json({
      success: true,
      productId: productId.toString(),
      txHash: receipt.hash
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint để tra cứu sản phẩm
app.get("/api/products/:id/trace", async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Lấy dữ liệu từ blockchain
    const [farmer, dataHash, status, registeredTime, activityIds] = 
      await contract.traceProduct(productId);
    
    // Lấy chi tiết activities
    const activities = [];
    for (let activityId of activityIds) {
      const [prodId, actor, activityHash, timestamp] = 
        await contract.getActivity(activityId);
      
      // Lấy dữ liệu chi tiết từ database dựa vào hash
      const activityData = await db.activities.findByHash(activityHash);
      
      activities.push({
        id: activityId.toString(),
        actor,
        timestamp: Number(timestamp),
        data: activityData
      });
    }
    
    // Lấy thông tin sản phẩm từ database
    const productData = await db.products.findByHash(dataHash);
    
    res.json({
      productId,
      farmer,
      status: ["Registered", "Harvested", "InTransit", "InStorage", "Sold"][status],
      registeredTime: Number(registeredTime),
      productData,
      activities
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 7. Tích hợp với Frontend

### React Example với ethers.js

```javascript
import { ethers } from "ethers";
import { useState, useEffect } from "react";

function ProductTrace({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        // Kết nối với MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Load contract
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const contractABI = [...]; // Import từ artifacts
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // Lấy thông tin sản phẩm
        const [farmer, dataHash, status, registeredTime, activityIds] = 
          await contract.traceProduct(productId);
        
        // Lấy activities
        const activities = [];
        for (let activityId of activityIds) {
          const [prodId, actor, activityHash, timestamp] = 
            await contract.getActivity(activityId);
          activities.push({ activityId, actor, activityHash, timestamp });
        }
        
        setProduct({
          farmer,
          dataHash,
          status: ["Registered", "Harvested", "InTransit", "InStorage", "Sold"][status],
          registeredTime: new Date(Number(registeredTime) * 1000),
          activities
        });
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h2>Product #{productId}</h2>
      <p>Farmer: {product.farmer}</p>
      <p>Status: {product.status}</p>
      <p>Registered: {product.registeredTime.toLocaleString()}</p>
      
      <h3>Activity History</h3>
      <ul>
        {product.activities.map((activity, index) => (
          <li key={index}>
            <strong>Activity #{activity.activityId.toString()}</strong>
            <br />Actor: {activity.actor}
            <br />Time: {new Date(Number(activity.timestamp) * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 8. Tạo QR Code cho Sản phẩm

```javascript
const QRCode = require("qrcode");

// Tạo QR code với URL tra cứu
async function generateProductQR(productId) {
  const traceUrl = `https://yourdomain.com/trace/${productId}`;
  
  const qrCode = await QRCode.toDataURL(traceUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCode; // Base64 image
}
```

## 9. Lưu trữ dữ liệu Off-chain

### Sử dụng IPFS (Khuyến nghị)

```javascript
const { create } = require("ipfs-http-client");
const ipfs = create({ host: "ipfs.infura.io", port: 5001, protocol: "https" });

async function uploadToIPFS(data) {
  const result = await ipfs.add(JSON.stringify(data));
  return result.path; // IPFS hash
}

// Khi đăng ký sản phẩm
const productData = { name: "Rice", type: "ST25", ... };
const ipfsHash = await uploadToIPFS(productData);
const dataHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsHash));

await contract.registerProduct(dataHash);
```

### Sử dụng Database truyền thống

```javascript
// Schema MongoDB
const ProductSchema = new Schema({
  name: String,
  type: String,
  origin: String,
  blockchainId: Number,
  dataHash: String,
  txHash: String,
  createdAt: Date
});

const ActivitySchema = new Schema({
  productId: Number,
  activityType: String,
  details: Object,
  activityHash: String,
  txHash: String,
  timestamp: Date
});
```

## 10. Best Practices

### Security

1. **Không lưu dữ liệu nhạy cảm on-chain**: Chỉ lưu hash
2. **Xác thực role**: Đảm bảo người dùng có quyền thực hiện action
3. **Validate dữ liệu**: Kiểm tra dữ liệu trước khi gửi lên blockchain

### Gas Optimization

1. **Batch operations**: Nhóm nhiều operations lại
2. **Use events**: Thay vì lưu trong storage, emit event
3. **Optimize structs**: Sắp xếp fields để tối ưu storage

### Error Handling

```javascript
try {
  const tx = await contract.registerProduct(dataHash);
  await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Xử lý thiếu gas
  } else if (error.message.includes('Only admin')) {
    // Xử lý lỗi permission
  } else {
    // Lỗi khác
  }
}
```

## 11. Monitoring và Analytics

```javascript
// Lắng nghe events
contract.on("ProductRegistered", (productId, farmer, dataHash) => {
  console.log(`New product registered: ${productId}`);
  // Gửi notification, update cache, etc.
});

contract.on("ProductStatusUpdated", (productId, status) => {
  console.log(`Product ${productId} status: ${status}`);
});

contract.on("ActivityRecorded", (activityId, productId, actor, hash) => {
  console.log(`New activity ${activityId} for product ${productId}`);
});
```

## 12. Testing trong Production

```javascript
// Test với mainnet fork
npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY

// Test gas prices
const gasPrice = await provider.getFeeData();
console.log("Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
```

## Troubleshooting

### Contract call reverted
- Kiểm tra role của caller
- Kiểm tra trạng thái sản phẩm
- Kiểm tra product có tồn tại không

### Transaction failed
- Kiểm tra gas limit
- Kiểm tra balance
- Kiểm tra network congestion

### Cannot find product
- Kiểm tra productId có đúng không
- Kiểm tra contract address
- Kiểm tra network (testnet/mainnet)

