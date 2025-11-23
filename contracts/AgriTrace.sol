// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgriTrace
 * @dev Smart contract cho hệ thống truy xuất nguồn gốc nông sản
 * Chỉ lưu hash và ID để tối ưu gas
 */
contract AgriTrace {

    // Các role trong hệ thống
    enum Role { None, Farmer, Distributor, Retailer, Consumer, Admin }

    // Trạng thái sản phẩm
    enum ProductStatus { Registered, Harvested, InTransit, InStorage, Sold }

    // Struct người dùng - chỉ lưu hash của thông tin
    struct User {
        address userAddress;
        Role role;
        bytes32 infoHash; // Hash của thông tin người dùng (lưu off-chain)
        bool isActive;
    }

    // Struct sản phẩm - chỉ lưu hash và ID
    struct Product {
        uint256 productId;
        address farmer;
        bytes32 dataHash; // Hash của dữ liệu sản phẩm (tên, loại, vv)
        ProductStatus status;
        uint256 registeredTime;
        bool exists;
    }

    // Struct hoạt động - chỉ lưu ID và hash
    struct Activity {
        uint256 activityId;
        uint256 productId;
        address actor;
        bytes32 activityHash; // Hash của dữ liệu hoạt động
        uint256 timestamp;
    }

    // State variables
    address public admin;
    uint256 private productCounter;
    uint256 private activityCounter;

    // Mappings
    mapping(address => User) public users;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Activity) public activities;
    mapping(uint256 => uint256[]) public productActivities; // productId => activityIds[]

    // Events
    event UserRegistered(address indexed userAddress, Role role, bytes32 infoHash);
    event ProductRegistered(uint256 indexed productId, address indexed farmer, bytes32 dataHash);
    event ProductStatusUpdated(uint256 indexed productId, ProductStatus status);
    event ActivityRecorded(uint256 indexed activityId, uint256 indexed productId, address indexed actor, bytes32 activityHash);
    event ProductTransferred(uint256 indexed productId, address from, address to);

    // Modifiers
    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin, "Only admin");
        _;
    }

    modifier onlyRole(Role _role) {
        require(users[msg.sender].role == _role, "Invalid role");
        _;
    }

    modifier productExists(uint256 _productId) {
        require(products[_productId].exists, "Product not exists");
        _;
    }

    constructor() {
        admin = msg.sender;
        users[msg.sender] = User(msg.sender, Role.Admin, bytes32(0), true);
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Đăng ký người dùng mới
     * @param _userAddress Địa chỉ người dùng
     * @param _role Role của người dùng
     * @param _infoHash Hash thông tin người dùng
     */
    function registerUser(address _userAddress, Role _role, bytes32 _infoHash) external onlyAdmin {
        require(_role != Role.None && _role != Role.Admin, "Invalid role");
        require(!users[_userAddress].isActive, "User already registered");

        users[_userAddress] = User(_userAddress, _role, _infoHash, true);
        emit UserRegistered(_userAddress, _role, _infoHash);
    }

    /**
     * @dev Vô hiệu hóa người dùng
     */
    function deactivateUser(address _userAddress) external onlyAdmin {
        require(users[_userAddress].isActive, "User not active");
        users[_userAddress].isActive = false;
    }

    /**
     * @dev Lấy tất cả hoạt động của một sản phẩm
     */
    function getProductActivities(uint256 _productId) external view productExists(_productId) returns (uint256[] memory) {
        return productActivities[_productId];
    }

    // ==================== FARMER FUNCTIONS ====================

    /**
     * @dev Đăng ký sản phẩm mới
     * @param _dataHash Hash của thông tin sản phẩm (tên, loại, nguồn gốc, vv)
     */
    function registerProduct(bytes32 _dataHash) external onlyRole(Role.Farmer) returns (uint256) {
        productCounter++;
        uint256 productId = productCounter;

        products[productId] = Product({
            productId: productId,
            farmer: msg.sender,
            dataHash: _dataHash,
            status: ProductStatus.Registered,
            registeredTime: block.timestamp,
            exists: true
        });

        emit ProductRegistered(productId, msg.sender, _dataHash);
        return productId;
    }

    /**
     * @dev Cập nhật thông tin canh tác
     * @param _productId ID sản phẩm
     * @param _activityHash Hash của hoạt động canh tác
     */
    function updateFarmingActivity(uint256 _productId, bytes32 _activityHash)
        external
        onlyRole(Role.Farmer)
        productExists(_productId)
    {
        require(products[_productId].farmer == msg.sender, "Not product owner");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _activityHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _activityHash);
    }

    /**
     * @dev Ghi nhận quy trình sản xuất và đánh dấu đã thu hoạch
     * @param _productId ID sản phẩm
     * @param _processHash Hash của quy trình sản xuất
     */
    function recordProductionProcess(uint256 _productId, bytes32 _processHash)
        external
        onlyRole(Role.Farmer)
        productExists(_productId)
    {
        require(products[_productId].farmer == msg.sender, "Not product owner");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _processHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        products[_productId].status = ProductStatus.Harvested;

        emit ActivityRecorded(activityCounter, _productId, msg.sender, _processHash);
        emit ProductStatusUpdated(_productId, ProductStatus.Harvested);
    }

    // ==================== DISTRIBUTOR FUNCTIONS ====================

    /**
     * @dev Tiếp nhận sản phẩm từ nông dân
     * @param _productId ID sản phẩm
     * @param _receiveHash Hash thông tin tiếp nhận
     */
    function receiveFromFarmer(uint256 _productId, bytes32 _receiveHash)
        external
        onlyRole(Role.Distributor)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.Harvested, "Product not ready");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _receiveHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        products[_productId].status = ProductStatus.InTransit;

        emit ActivityRecorded(activityCounter, _productId, msg.sender, _receiveHash);
        emit ProductStatusUpdated(_productId, ProductStatus.InTransit);
        emit ProductTransferred(_productId, products[_productId].farmer, msg.sender);
    }

    /**
     * @dev Cập nhật thông tin vận chuyển
     * @param _productId ID sản phẩm
     * @param _transportHash Hash thông tin vận chuyển
     */
    function updateTransportInfo(uint256 _productId, bytes32 _transportHash)
        external
        onlyRole(Role.Distributor)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.InTransit, "Not in transit");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _transportHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _transportHash);
    }

    /**
     * @dev Ghi nhận điều kiện bảo quản
     * @param _productId ID sản phẩm
     * @param _storageHash Hash điều kiện bảo quản
     */
    function recordStorageCondition(uint256 _productId, bytes32 _storageHash)
        external
        onlyRole(Role.Distributor)
        productExists(_productId)
    {
        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _storageHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _storageHash);
    }

    /**
     * @dev Chuyển giao sản phẩm cho retailer
     * @param _productId ID sản phẩm
     * @param _transferHash Hash thông tin chuyển giao
     */
    function transferToRetailer(uint256 _productId, bytes32 _transferHash)
        external
        onlyRole(Role.Distributor)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.InTransit, "Not in transit");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _transferHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _transferHash);
    }

    // ==================== RETAILER FUNCTIONS ====================

    /**
     * @dev Tiếp nhận sản phẩm từ nhà phân phối
     * @param _productId ID sản phẩm
     * @param _receiveHash Hash thông tin tiếp nhận
     */
    function receiveFromDistributor(uint256 _productId, bytes32 _receiveHash)
        external
        onlyRole(Role.Retailer)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.InTransit, "Not in transit");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _receiveHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        products[_productId].status = ProductStatus.InStorage;

        emit ActivityRecorded(activityCounter, _productId, msg.sender, _receiveHash);
        emit ProductStatusUpdated(_productId, ProductStatus.InStorage);
    }

    /**
     * @dev Cập nhật thông tin lưu kho
     * @param _productId ID sản phẩm
     * @param _storageHash Hash thông tin lưu kho
     */
    function updateWarehouseInfo(uint256 _productId, bytes32 _storageHash)
        external
        onlyRole(Role.Retailer)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.InStorage, "Not in storage");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _storageHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _storageHash);
    }

    /**
     * @dev Bán sản phẩm cho người tiêu dùng
     * @param _productId ID sản phẩm
     * @param _saleHash Hash thông tin bán hàng
     */
    function sellToConsumer(uint256 _productId, bytes32 _saleHash)
        external
        onlyRole(Role.Retailer)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.InStorage, "Not available for sale");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _saleHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        products[_productId].status = ProductStatus.Sold;

        emit ActivityRecorded(activityCounter, _productId, msg.sender, _saleHash);
        emit ProductStatusUpdated(_productId, ProductStatus.Sold);
    }

    // ==================== CONSUMER FUNCTIONS ====================

    /**
     * @dev Xem lịch sử truy xuất nguồn gốc (không cần role)
     * @param _productId ID sản phẩm
     */
    function traceProduct(uint256 _productId)
        external
        view
        productExists(_productId)
        returns (
            address farmer,
            bytes32 dataHash,
            ProductStatus status,
            uint256 registeredTime,
            uint256[] memory activityIds
        )
    {
        Product memory product = products[_productId];
        return (
            product.farmer,
            product.dataHash,
            product.status,
            product.registeredTime,
            productActivities[_productId]
        );
    }

    /**
     * @dev Xác nhận mua hàng
     * @param _productId ID sản phẩm
     * @param _purchaseHash Hash xác nhận mua hàng
     */
    function confirmPurchase(uint256 _productId, bytes32 _purchaseHash)
        external
        onlyRole(Role.Consumer)
        productExists(_productId)
    {
        require(products[_productId].status == ProductStatus.Sold, "Product not sold");

        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _purchaseHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _purchaseHash);
    }

    /**
     * @dev Đánh giá và phản hồi về sản phẩm
     * @param _productId ID sản phẩm
     * @param _reviewHash Hash đánh giá
     */
    function submitReview(uint256 _productId, bytes32 _reviewHash)
        external
        onlyRole(Role.Consumer)
        productExists(_productId)
    {
        activityCounter++;
        activities[activityCounter] = Activity({
            activityId: activityCounter,
            productId: _productId,
            actor: msg.sender,
            activityHash: _reviewHash,
            timestamp: block.timestamp
        });

        productActivities[_productId].push(activityCounter);
        emit ActivityRecorded(activityCounter, _productId, msg.sender, _reviewHash);
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * @dev Lấy thông tin người dùng
     */
    function getUserInfo(address _userAddress)
        external
        view
        returns (Role role, bytes32 infoHash, bool isActive)
    {
        User memory user = users[_userAddress];
        return (user.role, user.infoHash, user.isActive);
    }

    /**
     * @dev Lấy thông tin hoạt động
     */
    function getActivity(uint256 _activityId)
        external
        view
        returns (
            uint256 productId,
            address actor,
            bytes32 activityHash,
            uint256 timestamp
        )
    {
        Activity memory activity = activities[_activityId];
        require(activity.timestamp > 0, "Activity not found");
        return (
            activity.productId,
            activity.actor,
            activity.activityHash,
            activity.timestamp
        );
    }

    /**
     * @dev Lấy tổng số sản phẩm
     */
    function getTotalProducts() external view returns (uint256) {
        return productCounter;
    }

    /**
     * @dev Lấy tổng số hoạt động
     */
    function getTotalActivities() external view returns (uint256) {
        return activityCounter;
    }
}

