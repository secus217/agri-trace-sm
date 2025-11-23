# AgriTrace Contract - API Reference

## Enums

### Role
```solidity
enum Role { 
    None,        // 0
    Farmer,      // 1
    Distributor, // 2
    Retailer,    // 3
    Consumer,    // 4
    Admin        // 5
}
```

### ProductStatus
```solidity
enum ProductStatus { 
    Registered,  // 0
    Harvested,   // 1
    InTransit,   // 2
    InStorage,   // 3
    Sold         // 4
}
```

## Structs

### User
```solidity
struct User {
    address userAddress;
    Role role;
    bytes32 infoHash;
    bool isActive;
}
```

### Product
```solidity
struct Product {
    uint256 productId;
    address farmer;
    bytes32 dataHash;
    ProductStatus status;
    uint256 registeredTime;
    bool exists;
}
```

### Activity
```solidity
struct Activity {
    uint256 activityId;
    uint256 productId;
    address actor;
    bytes32 activityHash;
    uint256 timestamp;
}
```

## Admin Functions

### registerUser
```solidity
function registerUser(address _userAddress, Role _role, bytes32 _infoHash) external onlyAdmin
```
Đăng ký người dùng mới vào hệ thống.

**Parameters:**
- `_userAddress`: Địa chỉ wallet của người dùng
- `_role`: Role (1=Farmer, 2=Distributor, 3=Retailer, 4=Consumer)
- `_infoHash`: Hash của thông tin người dùng

**Events:** `UserRegistered(address indexed userAddress, Role role, bytes32 infoHash)`

**Example:**
```javascript
const userHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
    name: "Nguyen Van A",
    phone: "0123456789"
})));
await contract.registerUser(farmerAddress, 1, userHash);
```

---

### deactivateUser
```solidity
function deactivateUser(address _userAddress) external onlyAdmin
```
Vô hiệu hóa người dùng.

---

### getProductActivities
```solidity
function getProductActivities(uint256 _productId) external view returns (uint256[] memory)
```
Lấy danh sách ID của tất cả activities của một sản phẩm.

**Returns:** Array of activity IDs

---

## Farmer Functions

### registerProduct
```solidity
function registerProduct(bytes32 _dataHash) external onlyRole(Role.Farmer) returns (uint256)
```
Đăng ký sản phẩm mới.

**Parameters:**
- `_dataHash`: Hash của thông tin sản phẩm

**Returns:** Product ID

**Events:** `ProductRegistered(uint256 indexed productId, address indexed farmer, bytes32 dataHash)`

**Example:**
```javascript
const productData = {
    name: "Organic Rice",
    type: "ST25",
    origin: "An Giang"
};
const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(productData)));
const tx = await contract.connect(farmer).registerProduct(dataHash);
const receipt = await tx.wait();
// productId sẽ là 1, 2, 3, ...
```

---

### updateFarmingActivity
```solidity
function updateFarmingActivity(uint256 _productId, bytes32 _activityHash) external onlyRole(Role.Farmer)
```
Cập nhật thông tin canh tác (tưới nước, bón phân, phun thuốc, etc).

**Parameters:**
- `_productId`: ID sản phẩm
- `_activityHash`: Hash của hoạt động canh tác

**Events:** `ActivityRecorded(...)`

**Example:**
```javascript
const activity = {
    type: "fertilizer",
    date: "2025-01-15",
    fertilizer: "Organic compost",
    quantity: "500kg"
};
const activityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(activity)));
await contract.connect(farmer).updateFarmingActivity(productId, activityHash);
```

---

### recordProductionProcess
```solidity
function recordProductionProcess(uint256 _productId, bytes32 _processHash) external onlyRole(Role.Farmer)
```
Ghi nhận quy trình sản xuất và đánh dấu đã thu hoạch.

**Parameters:**
- `_productId`: ID sản phẩm
- `_processHash`: Hash của quy trình sản xuất

**Side effects:** Cập nhật status thành `Harvested`

**Events:** 
- `ActivityRecorded(...)`
- `ProductStatusUpdated(uint256 indexed productId, ProductStatus status)`

---

## Distributor Functions

### receiveFromFarmer
```solidity
function receiveFromFarmer(uint256 _productId, bytes32 _receiveHash) external onlyRole(Role.Distributor)
```
Tiếp nhận sản phẩm từ nông dân.

**Requirements:** Product status phải là `Harvested`

**Side effects:** Cập nhật status thành `InTransit`

**Events:**
- `ActivityRecorded(...)`
- `ProductStatusUpdated(...)`
- `ProductTransferred(uint256 indexed productId, address from, address to)`

---

### updateTransportInfo
```solidity
function updateTransportInfo(uint256 _productId, bytes32 _transportHash) external onlyRole(Role.Distributor)
```
Cập nhật thông tin vận chuyển (nhiệt độ, vị trí, etc).

**Requirements:** Product status phải là `InTransit`

**Example:**
```javascript
const transportData = {
    location: "Highway 1, km 50",
    temperature: "5°C",
    humidity: "60%",
    timestamp: new Date().toISOString()
};
const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(transportData)));
await contract.connect(distributor).updateTransportInfo(productId, hash);
```

---

### recordStorageCondition
```solidity
function recordStorageCondition(uint256 _productId, bytes32 _storageHash) external onlyRole(Role.Distributor)
```
Ghi nhận điều kiện bảo quản trong quá trình vận chuyển.

---

### transferToRetailer
```solidity
function transferToRetailer(uint256 _productId, bytes32 _transferHash) external onlyRole(Role.Distributor)
```
Chuyển giao sản phẩm cho retailer.

**Requirements:** Product status phải là `InTransit`

---

## Retailer Functions

### receiveFromDistributor
```solidity
function receiveFromDistributor(uint256 _productId, bytes32 _receiveHash) external onlyRole(Role.Retailer)
```
Tiếp nhận sản phẩm từ nhà phân phối.

**Requirements:** Product status phải là `InTransit`

**Side effects:** Cập nhật status thành `InStorage`

**Events:**
- `ActivityRecorded(...)`
- `ProductStatusUpdated(...)`

---

### updateWarehouseInfo
```solidity
function updateWarehouseInfo(uint256 _productId, bytes32 _storageHash) external onlyRole(Role.Retailer)
```
Cập nhật thông tin lưu kho.

**Requirements:** Product status phải là `InStorage`

---

### sellToConsumer
```solidity
function sellToConsumer(uint256 _productId, bytes32 _saleHash) external onlyRole(Role.Retailer)
```
Bán sản phẩm cho người tiêu dùng.

**Requirements:** Product status phải là `InStorage`

**Side effects:** Cập nhật status thành `Sold`

**Events:**
- `ActivityRecorded(...)`
- `ProductStatusUpdated(...)`

---

## Consumer Functions

### traceProduct
```solidity
function traceProduct(uint256 _productId) external view returns (
    address farmer,
    bytes32 dataHash,
    ProductStatus status,
    uint256 registeredTime,
    uint256[] memory activityIds
)
```
Xem lịch sử truy xuất nguồn gốc (KHÔNG CẦN ROLE - ai cũng có thể xem).

**Returns:**
- `farmer`: Địa chỉ nông dân
- `dataHash`: Hash thông tin sản phẩm
- `status`: Trạng thái hiện tại
- `registeredTime`: Thời gian đăng ký
- `activityIds`: Array các activity IDs

**Example:**
```javascript
const [farmer, dataHash, status, registeredTime, activityIds] = 
    await contract.traceProduct(productId);

console.log("Farmer:", farmer);
console.log("Status:", ["Registered", "Harvested", "InTransit", "InStorage", "Sold"][status]);
console.log("Activities:", activityIds.length);

// Lấy chi tiết từng activity
for (let activityId of activityIds) {
    const [prodId, actor, activityHash, timestamp] = 
        await contract.getActivity(activityId);
    // Decode activityHash from database
}
```

---

### confirmPurchase
```solidity
function confirmPurchase(uint256 _productId, bytes32 _purchaseHash) external onlyRole(Role.Consumer)
```
Xác nhận mua hàng.

**Requirements:** Product status phải là `Sold`

---

### submitReview
```solidity
function submitReview(uint256 _productId, bytes32 _reviewHash) external onlyRole(Role.Consumer)
```
Đánh giá và phản hồi về sản phẩm.

**Example:**
```javascript
const review = {
    rating: 5,
    comment: "Excellent quality!",
    date: new Date().toISOString()
};
const reviewHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(review)));
await contract.connect(consumer).submitReview(productId, reviewHash);
```

---

## Helper Functions

### getUserInfo
```solidity
function getUserInfo(address _userAddress) external view returns (
    Role role, 
    bytes32 infoHash, 
    bool isActive
)
```
Lấy thông tin người dùng.

---

### getActivity
```solidity
function getActivity(uint256 _activityId) external view returns (
    uint256 productId,
    address actor,
    bytes32 activityHash,
    uint256 timestamp
)
```
Lấy thông tin chi tiết của một activity.

---

### getTotalProducts
```solidity
function getTotalProducts() external view returns (uint256)
```
Lấy tổng số sản phẩm đã đăng ký.

---

### getTotalActivities
```solidity
function getTotalActivities() external view returns (uint256)
```
Lấy tổng số hoạt động đã ghi nhận.

---

## Events

### UserRegistered
```solidity
event UserRegistered(address indexed userAddress, Role role, bytes32 infoHash)
```

### ProductRegistered
```solidity
event ProductRegistered(uint256 indexed productId, address indexed farmer, bytes32 dataHash)
```

### ProductStatusUpdated
```solidity
event ProductStatusUpdated(uint256 indexed productId, ProductStatus status)
```

### ActivityRecorded
```solidity
event ActivityRecorded(uint256 indexed activityId, uint256 indexed productId, address indexed actor, bytes32 activityHash)
```

### ProductTransferred
```solidity
event ProductTransferred(uint256 indexed productId, address from, address to)
```

---

## Error Messages

- `"Only admin"` - Chỉ admin mới có quyền thực hiện
- `"Invalid role"` - Role không hợp lệ
- `"User already registered"` - User đã được đăng ký
- `"User not active"` - User không active
- `"Product not exists"` - Sản phẩm không tồn tại
- `"Not product owner"` - Không phải chủ sản phẩm
- `"Product not ready"` - Sản phẩm chưa sẵn sàng
- `"Not in transit"` - Sản phẩm không trong trạng thái vận chuyển
- `"Not in storage"` - Sản phẩm không trong trạng thái lưu kho
- `"Not available for sale"` - Sản phẩm không sẵn sàng bán
- `"Product not sold"` - Sản phẩm chưa được bán
- `"Activity not found"` - Activity không tồn tại

---

## Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| registerUser | ~50,000 |
| registerProduct | ~100,000 |
| updateFarmingActivity | ~80,000 |
| recordProductionProcess | ~90,000 |
| receiveFromFarmer | ~90,000 |
| updateTransportInfo | ~80,000 |
| traceProduct (view) | 0 (free) |
| getActivity (view) | 0 (free) |

*Lưu ý: Gas estimates có thể thay đổi tùy theo network conditions*

