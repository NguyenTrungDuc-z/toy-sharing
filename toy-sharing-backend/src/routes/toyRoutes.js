const router = require("express").Router();
const Toy = require("../models/Toy");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware xác thực
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'toyshare_secret');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const getCurrentUserId = (req) => req.userId || req.headers["x-user-id"] || req.query.userId || req.body.userId;

// Lấy tất cả toys (public - trang Home) - chỉ hiển thị toys đã được duyệt
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    // Trang danh sách hiển thị toàn bộ đồ chơi của các chủ sở hữu
    // Chỉ hiển thị những toys đã được admin phê duyệt (status !== 'pending' và status !== 'rejected')
    const filter = {
      status: { $in: ['available', 'borrowed', 'unavailable'] }
    };

    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const toys = await Toy.find(filter).populate("ownerId", "name email");
    res.json(toys);
  } catch (err) {
    console.error("Error fetching toys:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Lấy toys của user hiện tại
router.get("/my-toys", auth, async (req, res) => {
  try {
    console.log("[DEBUG] Fetching my-toys for userId:", req.userId);
    const toys = await Toy.find({ ownerId: req.userId }).sort({ createdAt: -1 });
    console.log("[DEBUG] Found toys count:", toys.length);
    res.json(toys);
  } catch (err) {
    console.error("[ERROR] Fetching my-toys:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Lấy toys pending (admin)
router.get("/pending", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const toys = await Toy.find({ status: "pending" }).populate(
      "ownerId",
      "name email"
    );
    res.json(toys);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Tạo toy mới
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, category, ageRange, condition, depositRequired, imageUrl, images } =
      req.body;
    
    // Validate required fields
    if (!name || !ageRange || !condition) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ tên, độ tuổi và tình trạng đồ chơi" });
    }
    
    // Prepare images array - filter out empty/undefined values
    let finalImages = [];
    if (images && Array.isArray(images)) {
      finalImages = images.filter(img => img && img.trim());
    } else if (imageUrl && imageUrl.trim()) {
      finalImages = [imageUrl];
    }
    
    const toy = new Toy({
      name,
      description,
      category,
      ageRange,
      condition,
      depositRequired: Number(depositRequired) || 0,
      images: finalImages,
      ownerId: req.userId,
      status: "pending",
    });
    
    await toy.save();
    res.status(201).json({ message: "Đồ chơi đã được đăng thành công! Chờ duyệt từ admin.", toy });
  } catch (err) {
    console.error("[ERROR] Creating toy:", err);
    res.status(500).json({ message: "Lỗi khi lưu dữ liệu đồ chơi", error: err.message });
  }
});

// Cập nhật toy
router.put("/:id", auth, async (req, res) => {
  try {
    const toy = await Toy.findById(req.params.id);
    if (!toy) return res.status(404).json({ message: "Toy not found" });
    if (toy.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { name, description, category, ageRange, condition, depositRequired, imageUrl, images } =
      req.body;
    const updateData = { name, description, category, ageRange, condition, depositRequired };
    if (images) {
      updateData.images = images;
    } else if (imageUrl) {
      updateData.images = [imageUrl];
    }
    const updatedToy = await Toy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedToy);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Moderate toy (admin approve/reject)
router.put("/:id/moderate", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const toy = await Toy.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!toy) return res.status(404).json({ message: "Toy not found" });
    res.json(toy);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Xóa toy (không yêu cầu xác thực vì frontend không gửi token)
router.delete("/:id", async (req, res) => {
  try {
    const toy = await Toy.findById(req.params.id);
    if (!toy) return res.status(404).json({ message: "Toy not found" });
    await Toy.findByIdAndDelete(req.params.id);
    res.json({ message: "Toy deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;