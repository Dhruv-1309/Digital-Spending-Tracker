import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Wallet,
} from "lucide-react";

const SpendingTracker = () => {
  // State Management
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({
    "🍕 Food": 10000,
    "🎮 Entertainment": 5000,
    "👕 Shopping": 8000,
    "🚌 Transport": 3000,
    "📚 School": 4000,
    "💄 Other": 2500,
    "🍰 Birthday": 3000,
  });
  const [savingsGoal, setSavingsGoal] = useState({
    name: "New Phone",
    target: 50000,
    saved: 0,
  });
  const [accountBalance, setAccountBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("quick-add");
  const [formData, setFormData] = useState({
    amount: "",
    category: "🍕 Food",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculationPreview, setCalculationPreview] = useState("");
  const [balanceInput, setBalanceInput] = useState("");

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses");
    const savedBudgets = localStorage.getItem("budgets");
    const savedGoal = localStorage.getItem("savingsGoal");
    const savedBalance = localStorage.getItem("accountBalance");

    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    if (savedGoal) setSavingsGoal(JSON.parse(savedGoal));
    if (savedBalance) setAccountBalance(JSON.parse(savedBalance));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("savingsGoal", JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  useEffect(() => {
    localStorage.setItem("accountBalance", JSON.stringify(accountBalance));
  }, [accountBalance]);

  // Utility Functions
  const showToast = (message) => {
    // Simple toast implementation - in a real app, use a toast library
    alert(message);
  };

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  // Amount Calculation Feature
  const calculateAmount = (value) => {
    if (!value.trim()) {
      setCalculationResult(null);
      setCalculationPreview("");
      return null;
    }

    // Check if input contains mathematical operations
    if (
      value.includes("+") ||
      value.includes("-") ||
      value.includes("*") ||
      value.includes("/")
    ) {
      try {
        // Sanitize input - only allow numbers and basic math operators
        const sanitized = value.replace(/[^0-9+\-*/.() ]/g, "");

        if (sanitized !== value) {
          setCalculationPreview("Only numbers and +, -, *, / are allowed");
          setCalculationResult(null);
          return null;
        }

        // Evaluate the expression safely
        const result = Function('"use strict"; return (' + sanitized + ")")();

        if (isNaN(result) || !isFinite(result) || result < 0) {
          setCalculationPreview("Invalid calculation");
          setCalculationResult(null);
          return null;
        }

        setCalculationPreview(`${sanitized} = ₹${result.toFixed(2)}`);
        setCalculationResult(result);
        return result;
      } catch (error) {
        setCalculationPreview("Invalid calculation");
        setCalculationResult(null);
        return null;
      }
    } else {
      // Simple number input
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setCalculationResult(numValue);
        setCalculationPreview("");
        return numValue;
      } else {
        setCalculationResult(null);
        setCalculationPreview("");
        return null;
      }
    }
  };

  const getDateStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    const todayTotal = expenses
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
    const weekTotal = expenses
      .filter((e) => e.date >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = expenses
      .filter((e) => e.date >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);

    return { todayTotal, weekTotal, monthTotal };
  };

  // Event Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      // Handle amount calculation
      calculateAmount(value);
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Use calculated result or direct input
    const amount = calculationResult || parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount!");
      return;
    }

    // Check if sufficient balance is available
    if (accountBalance < amount) {
      showToast("Insufficient balance! Please add money to your account.");
      return;
    }

    const newExpense = {
      id: Date.now(),
      amount: amount,
      category: formData.category,
      description: formData.description || "No description",
      date: formData.date,
      timestamp: new Date().toISOString(),
    };

    setExpenses([...expenses, newExpense]);

    // Deduct from account balance
    setAccountBalance((prev) => prev - amount);

    setFormData({
      amount: "",
      category: "🍕 Food",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });

    // Clear calculation states
    setCalculationResult(null);
    setCalculationPreview("");

    showToast(
      `Added ${formatCurrency(newExpense.amount)} for ${
        newExpense.description
      }!`
    );
  };

  const deleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      const expense = expenses.find((e) => e.id === id);
      if (expense) {
        // Add the amount back to account balance
        setAccountBalance((prev) => prev + expense.amount);
      }

      setExpenses(expenses.filter((expense) => expense.id !== id));
      showToast("Expense deleted and amount refunded to balance!");
    }
  };

  const updateBudget = (category, value) => {
    setBudgets({
      ...budgets,
      [category]: parseFloat(value) || 0,
    });
  };

  const addToGoal = (amount) => {
    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount!");
      return;
    }

    setSavingsGoal({
      ...savingsGoal,
      saved: savingsGoal.saved + amount,
    });

    showToast(`Added ${formatCurrency(amount)} to your goal!`);
  };

  const addToBalance = (amount) => {
    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount!");
      return;
    }

    setAccountBalance((prev) => prev + amount);
    setBalanceInput("");
    showToast(`Added ${formatCurrency(amount)} to your account!`);
  };

  const getBudgetProgress = () => {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];
    const monthExpenses = expenses.filter((e) => e.date >= monthStart);

    const spending = {};
    monthExpenses.forEach((expense) => {
      spending[expense.category] =
        (spending[expense.category] || 0) + expense.amount;
    });

    return Object.entries(budgets).map(([category, budget]) => {
      const spent = spending[category] || 0;
      const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const remaining = Math.max(budget - spent, 0);

      let status = "On track";
      let color = "bg-green-500";

      if (percentage >= 100) {
        status = "Over budget!";
        color = "bg-red-500";
      } else if (percentage >= 90) {
        status = "Almost over!";
        color = "bg-red-400";
      } else if (percentage >= 70) {
        status = "Watch out";
        color = "bg-yellow-500";
      }

      return { category, budget, spent, percentage, remaining, status, color };
    });
  };

  const getGoalProgress = () => {
    const percentage =
      savingsGoal.target > 0
        ? Math.min((savingsGoal.saved / savingsGoal.target) * 100, 100)
        : 0;
    const remaining = Math.max(savingsGoal.target - savingsGoal.saved, 0);
    return { percentage, remaining };
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  const getBalanceStatus = () => {
    if (accountBalance < 1000) return { status: "low", color: "text-red-400" };
    if (accountBalance < 5000)
      return { status: "medium", color: "text-yellow-400" };
    return { status: "high", color: "text-green-400" };
  };

  // Component Data
  const { todayTotal, weekTotal, monthTotal } = getDateStats();
  const budgetProgress = getBudgetProgress();
  const { percentage: goalPercentage, remaining: goalRemaining } =
    getGoalProgress();
  const categoryData = getCategoryData();
  const recentExpenses = expenses.slice(-5).reverse();
  const balanceStatus = getBalanceStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 animate-gradient-x">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <h1 className="text-5xl font-bold text-white mb-4">
              Your Spending Tracker
            </h1>
            <p className="text-xl text-white/90">
              Take control of your money, one expense at a time!
            </p>
          </div>
        </div>

        {/* Account Balance Section */}
        <div className="flex justify-center mb-8">
          <div
            className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border-2 transition-all duration-300 ${
              balanceStatus.status === "low"
                ? "border-red-500/50 bg-red-500/10"
                : balanceStatus.status === "medium"
                ? "border-yellow-500/50 bg-yellow-500/10"
                : "border-green-500/50 bg-green-500/10"
            }`}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                Account Balance
              </h3>
              <div className={`text-3xl font-bold mb-4 ${balanceStatus.color}`}>
                {formatCurrency(accountBalance)}
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="Add money"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                />
                <button
                  onClick={() => {
                    const amount = parseFloat(balanceInput);
                    if (amount > 0) {
                      addToBalance(amount);
                    }
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 flex space-x-2 border border-white/20">
            {[
              { id: "quick-add", label: "📱 Quick Add" },
              { id: "dashboard", label: "📊 Dashboard" },
              { id: "budget", label: "💰 Budget" },
              { id: "goals", label: "🎯 Goals" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Quick Add Tab */}
          {activeTab === "quick-add" && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Expense Form */}
              <div className="lg:col-span-2">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Add New Expense
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-white font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Amount (₹)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                              calculationResult
                                ? "focus:ring-green-400 border-green-400/50"
                                : "focus:ring-purple-400"
                            }`}
                            placeholder="e.g., 250+300+50 or 600"
                          />
                          {calculationResult && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 font-semibold text-sm">
                              = ₹{calculationResult.toFixed(2)}
                            </div>
                          )}
                        </div>
                        {calculationPreview && (
                          <div
                            className={`text-sm px-3 py-2 rounded-lg ${
                              calculationPreview.includes("Invalid") ||
                              calculationPreview.includes("Only")
                                ? "text-red-400 bg-red-500/10"
                                : "text-green-400 bg-green-500/10"
                            }`}
                          >
                            {calculationPreview}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-white font-semibold flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                        >
                          {Object.keys(budgets).map((category) => (
                            <option
                              key={category}
                              value={category}
                              className="bg-gray-800"
                            >
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                        placeholder="e.g., Lunch at McDonald's"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-white font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={
                            !calculationResult && !parseFloat(formData.amount)
                          }
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <PlusCircle className="w-5 h-5" />
                          Add Expense
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                {/* Account Balance Widget */}
                <div
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all duration-300 hover:transform hover:-translate-y-1 ${
                    balanceStatus.status === "low"
                      ? "border-red-500/50 bg-red-500/10"
                      : balanceStatus.status === "medium"
                      ? "border-yellow-500/50 bg-yellow-500/10"
                      : "border-green-500/50 bg-green-500/10"
                  }`}
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Current Balance
                  </h3>
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold mb-4 ${balanceStatus.color}`}
                    >
                      {formatCurrency(accountBalance)}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={balanceInput}
                        onChange={(e) => setBalanceInput(e.target.value)}
                        placeholder="Add money"
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300 text-sm"
                      />
                      <button
                        onClick={() => {
                          const amount = parseFloat(balanceInput);
                          if (amount > 0) {
                            addToBalance(amount);
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300 text-sm"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {balanceStatus.status === "low" && (
                      <div className="text-red-400 text-xs mt-2 animate-pulse">
                        ⚠️ Low balance! Consider adding more funds.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-white/70 text-sm">Today</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(todayTotal)}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-white/70 text-sm">This Week</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(weekTotal)}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-white/70 text-sm">This Month</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(monthTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Balance Overview */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all duration-300 ${
                    balanceStatus.status === "low"
                      ? "border-red-500/50"
                      : balanceStatus.status === "medium"
                      ? "border-yellow-500/50"
                      : "border-green-500/50"
                  }`}
                >
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Account Balance
                  </h3>
                  <div className={`text-2xl font-bold ${balanceStatus.color}`}>
                    {formatCurrency(accountBalance)}
                  </div>
                  <div className="text-white/70 text-sm mt-1">
                    {balanceStatus.status === "low"
                      ? "Low balance"
                      : balanceStatus.status === "medium"
                      ? "Moderate balance"
                      : "Good balance"}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Total Spent
                  </h3>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(
                      expenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </div>
                  <div className="text-white/70 text-sm mt-1">All time</div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Available
                  </h3>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(Math.max(0, accountBalance))}
                  </div>
                  <div className="text-white/70 text-sm mt-1">To spend</div>
                </div>
              </div>

              {/* Category Overview */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Spending by Category
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(categoryData).map(([category, amount]) => (
                      <div
                        key={category}
                        className="flex justify-between items-center text-white"
                      >
                        <span>{category}</span>
                        <span className="font-semibold">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                    {Object.keys(categoryData).length === 0 && (
                      <div className="text-center text-white/70 py-8">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Add some expenses to see your spending breakdown!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("budget")}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white p-3 rounded-xl transition-all duration-300 text-left"
                    >
                      💰 Review Budget Progress
                    </button>
                    <button
                      onClick={() => setActiveTab("goals")}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 text-white p-3 rounded-xl transition-all duration-300 text-left"
                    >
                      🎯 Check Savings Goal
                    </button>
                    <button
                      onClick={() => setActiveTab("quick-add")}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white p-3 rounded-xl transition-all duration-300 text-left"
                    >
                      ➕ Add New Expense
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">
                  Recent Expenses
                </h3>
                <div className="space-y-3">
                  {recentExpenses.length > 0 ? (
                    recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-semibold">
                              {expense.category} -{" "}
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="text-white/70">
                              {expense.description}
                            </div>
                            <div className="text-white/50 text-sm">
                              {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-white/70 py-8">
                      <div className="text-4xl mb-4">📱</div>
                      <p>
                        Add some expenses to see your dashboard come to life!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === "budget" && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">
                  Set Your Monthly Budgets
                </h3>
                <div className="space-y-4">
                  {Object.entries(budgets).map(([category, amount]) => (
                    <div key={category} className="space-y-2">
                      <label className="text-white font-semibold">
                        {category}
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => updateBudget(category, e.target.value)}
                        min="0"
                        step="100"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">
                  Budget Progress This Month
                </h3>
                <div className="space-y-4">
                  {budgetProgress.map(
                    ({
                      category,
                      budget,
                      spent,
                      percentage,
                      remaining,
                      status,
                      color,
                    }) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-white">
                          <span className="font-semibold">{category}</span>
                          <span className="text-sm">{status}</span>
                        </div>
                        <div className="flex justify-between text-white/90 text-sm">
                          <span>
                            {formatCurrency(spent)} / {formatCurrency(budget)}
                          </span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-white/70 text-sm">
                          Remaining: {formatCurrency(remaining)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">
                  Current Goal
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-white font-semibold">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      value={savingsGoal.name}
                      onChange={(e) =>
                        setSavingsGoal({ ...savingsGoal, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white font-semibold">
                      Target Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={savingsGoal.target}
                      onChange={(e) =>
                        setSavingsGoal({
                          ...savingsGoal,
                          target: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white font-semibold">
                        Add to Savings (₹)
                      </label>
                      <input
                        type="number"
                        id="add-savings-input"
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const input =
                            document.getElementById("add-savings-input");
                          const amount = parseFloat(input.value);
                          if (amount > 0) {
                            addToGoal(amount);
                            input.value = "";
                          }
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Add to Goal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Progress</h3>
                <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg
                      className="w-48 h-48 transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          251.2 - (goalPercentage / 100) * 251.2
                        }
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" style={{ stopColor: "#667eea" }} />
                          <stop
                            offset="100%"
                            style={{ stopColor: "#764ba2" }}
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">
                          {Math.round(goalPercentage)}%
                        </div>
                        <div className="text-white/70 text-sm">Complete</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-white/70 text-sm">
                      Savings Progress
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(savingsGoal.saved)}
                    </div>
                    <div className="text-white/70">
                      {formatCurrency(goalRemaining)} to go
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 mb-2">
              💡 <strong>Pro Tips:</strong> Track expenses daily • Set realistic
              budgets • Save a little each week • Use calculation feature for
              split bills
            </p>
            <p className="text-white/70">Built with ❤️ for smart spenders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingTracker;
