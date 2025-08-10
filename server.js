// server.js - Main Express server
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Database connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/spending-tracker",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Expense = mongoose.model("Expense", expenseSchema);
const Budget = mongoose.model("Budget", budgetSchema);
const Goal = mongoose.model("Goal", goalSchema);

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Expense Routes
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, category, limit = 50, page = 1 } = req.query;

    let query = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res
        .status(400)
        .json({ error: "Amount, category, and date are required" });
    }

    const expense = new Expense({
      userId: req.userId,
      amount: parseFloat(amount),
      category,
      description: description || "",
      date: new Date(date),
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Budget Routes
app.get("/api/budgets", authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const budgets = await Budget.find({
      userId: req.userId,
      month: parseInt(currentMonth),
      year: parseInt(currentYear),
    });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", authenticateToken, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const existingBudget = await Budget.findOne({
      userId: req.userId,
      category,
      month: currentMonth,
      year: currentYear,
    });

    if (existingBudget) {
      existingBudget.amount = parseFloat(amount);
      existingBudget.updatedAt = new Date();
      await existingBudget.save();
      return res.json(existingBudget);
    }

    const budget = new Budget({
      userId: req.userId,
      category,
      amount: parseFloat(amount),
      month: currentMonth,
      year: currentYear,
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: "Failed to create/update budget" });
  }
});

// Goal Routes
app.get("/api/goals", authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId, isActive: true });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

app.post("/api/goals", authenticateToken, async (req, res) => {
  try {
    const { name, targetAmount, targetDate } = req.body;

    const goal = new Goal({
      userId: req.userId,
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to create goal" });
  }
});

app.put("/api/goals/:id/add-savings", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $inc: { currentAmount: parseFloat(amount) },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// Analytics Routes
app.get(
  "/api/analytics/spending-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let matchStage = { userId: new mongoose.Types.ObjectId(req.userId) };

      if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) matchStage.date.$lte = new Date(endDate);
      }

      const summary = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]);

      const totalSpending = await Expense.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      res.json({
        categoryBreakdown: summary,
        totalSpending: totalSpending[0]?.total || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
