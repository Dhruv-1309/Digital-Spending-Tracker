// Global app state
const MoneyTracker = {
  transactions: [],
  currentTab: "dashboard",
  approvedAnomalies: [], // Track IDs of approved anomalies

  // Default categories
  defaultCategories: {
    income: [
      "Salary",
      "Freelance Work",
      "Business Income",
      "Investment Returns",
      "Rental Income",
      "Side Hustle",
      "Bonus",
      "Gift/Cash Received",
      "Refund",
      "Other Income",
    ],
    expense: [
      "Food & Dining",
      "Groceries",
      "Transportation",
      "Fuel/Gas",
      "Entertainment",
      "Shopping",
      "Clothing",
      "Utilities",
      "Rent/Mortgage",
      "Healthcare",
      "Insurance",
      "Education",
      "Travel",
      "Subscriptions",
      "Personal Care",
      "Home & Garden",
      "Electronics",
      "Gifts & Donations",
      "Bank Fees",
      "Other Expenses",
    ],
  },

  customCategories: { income: [], expense: [] },

  // Initialize the app
  async init() {
    await this.loadTransactions();
    await this.loadCustomCategories();
    await this.loadApprovedAnomalies();
    this.setupEventListeners();
    this.loadCategories();
    this.setDefaultDate();
    this.refreshAll();
    // Initialize custom dropdowns
    initCustomSelects();
    // Initialize custom date picker
    initCustomDatePicker();
  },

  // Load transactions from cloud storage
  async loadTransactions() {
    try {
      if (!window.db || !window.currentUser) {
        this.transactions = [];
        return;
      }
      const doc = await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("transactions")
        .get();
      if (doc.exists) {
        this.transactions = doc.data().items || [];
      } else {
        this.transactions = [];
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      this.transactions = [];
    }
  },

  // Save transactions to cloud storage
  async saveTransactions() {
    try {
      if (!window.db || !window.currentUser) return;
      await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("transactions")
        .set({
          items: this.transactions,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error("Error saving transactions:", error);
    }
  },

  // Load custom categories from cloud storage
  async loadCustomCategories() {
    try {
      if (!window.db || !window.currentUser) {
        this.customCategories = { income: [], expense: [] };
        return;
      }
      const doc = await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("categories")
        .get();
      if (doc.exists) {
        this.customCategories = doc.data().items || { income: [], expense: [] };
      } else {
        this.customCategories = { income: [], expense: [] };
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      this.customCategories = { income: [], expense: [] };
    }
  },

  // Save custom categories to cloud storage
  async saveCustomCategories() {
    try {
      if (!window.db || !window.currentUser) return;
      await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("categories")
        .set({
          items: this.customCategories,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  },

  // Load approved anomalies from cloud storage
  async loadApprovedAnomalies() {
    try {
      if (!window.db || !window.currentUser) {
        this.approvedAnomalies = [];
        return;
      }
      const doc = await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("anomalies")
        .get();
      if (doc.exists) {
        this.approvedAnomalies = doc.data().items || [];
      } else {
        this.approvedAnomalies = [];
      }
    } catch (error) {
      console.error("Error loading anomalies:", error);
      this.approvedAnomalies = [];
    }
  },

  // Save approved anomalies to cloud storage
  async saveApprovedAnomalies() {
    try {
      if (!window.db || !window.currentUser) return;
      await window.db
        .collection("users")
        .doc(window.currentUser.uid)
        .collection("data")
        .doc("anomalies")
        .set({
          items: this.approvedAnomalies,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error("Error saving anomalies:", error);
    }
  },

  // Mark anomaly as approved
  approveAnomaly(transactionId) {
    console.log("Approving anomaly:", transactionId);
    console.log("Current approved list:", this.approvedAnomalies);

    // Convert to string for consistent comparison
    const idStr = String(transactionId);

    if (!this.approvedAnomalies.includes(idStr)) {
      this.approvedAnomalies.push(idStr);
      this.saveApprovedAnomalies();
      console.log("Updated approved list:", this.approvedAnomalies);
      this.displayAnomalyAlerts(); // Refresh the alerts immediately
      alert("✅ Anomaly marked as legitimate and approved!");
    } else {
      console.log("Already approved");
      alert("This anomaly is already approved!");
    }
  },

  // Dismiss/remove anomaly approval
  dismissAnomaly(transactionId) {
    console.log("Dismissing anomaly:", transactionId);
    console.log("Current approved list:", this.approvedAnomalies);

    // Convert to string for consistent comparison
    const idStr = String(transactionId);

    // Find and DELETE the transaction
    const originalLength = this.transactions.length;
    this.transactions = this.transactions.filter((t) => String(t.id) !== idStr);

    if (this.transactions.length < originalLength) {
      // Transaction was found and deleted
      this.saveTransactions();
      console.log("Transaction deleted");

      // Also remove from approved list if it was there
      const index = this.approvedAnomalies.indexOf(idStr);
      if (index > -1) {
        this.approvedAnomalies.splice(index, 1);
        this.saveApprovedAnomalies();
      }

      // Refresh all displays
      this.refreshAll();

      alert("🗑️ Transaction dismissed and removed from your records!");
    } else {
      console.log("Transaction not found");
      alert("❌ Error: Transaction not found");
    }
  },

  // Get all categories for a type
  getAllCategories(type) {
    return [...this.defaultCategories[type], ...this.customCategories[type]];
  },

  // Setup event listeners
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const tabName = e.target.closest(".nav-tab").dataset.tab;
        this.showTab(tabName);
      });
    });

    // Form submission
    document
      .getElementById("transactionForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.addTransaction();
      });

    // Type change for category loading
    document.getElementById("type").addEventListener("change", (e) => {
      this.loadCategoriesForType(e.target.value);
    });
  },

  // Show specific tab
  showTab(tabName) {
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
      if (tab.dataset.tab === tabName) {
        tab.classList.add("active");
      }
    });

    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(tabName).classList.add("active");

    this.currentTab = tabName;

    if (tabName === "transactions") {
      this.displayTransactions();
    } else if (tabName === "analytics") {
      setTimeout(() => this.createCharts(), 100);
    } else if (tabName === "dashboard") {
      this.updateDashboard();
    }
  },

  // Load categories into form
  loadCategories() {
    this.loadCategoriesForType("");
  },

  // Load categories for specific type
  loadCategoriesForType(type) {
    const categorySelect = document.getElementById("category");
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    if (type) {
      const categories = this.getAllCategories(type);
      categories.forEach((cat) => {
        const isCustom = this.customCategories[type].includes(cat);
        categorySelect.innerHTML += `<option value="${cat}">${cat}${
          isCustom ? " (Custom)" : ""
        }</option>`;
      });
    }

    // Refresh custom dropdown UI
    if (typeof refreshCustomSelect === "function") {
      refreshCustomSelect("category");
    }
  },

  // Set default date
  setDefaultDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = today;
    // Update custom date picker if it exists
    if (typeof CustomDatePicker !== "undefined" && CustomDatePicker.setDate) {
      CustomDatePicker.setDate(today);
    }
  },

  // Add new transaction
  addTransaction() {
    const transaction = {
      id: Date.now() + Math.random(),
      type: document.getElementById("type").value,
      amount: parseFloat(document.getElementById("amount").value),
      category: document.getElementById("category").value,
      paymentMethod: document.getElementById("paymentMethod").value,
      description: document.getElementById("description").value || "",
      date: document.getElementById("date").value,
    };

    this.transactions.unshift(transaction);
    this.saveTransactions();

    document.getElementById("transactionForm").reset();
    this.setDefaultDate();

    // Refresh all custom dropdowns after form reset
    if (typeof refreshCustomSelect === "function") {
      refreshCustomSelect("type");
      refreshCustomSelect("category");
      refreshCustomSelect("paymentMethod");
    }

    this.refreshAll();

    alert("Transaction added successfully!");
  },

  // Delete transaction
  deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      const originalLength = this.transactions.length;
      this.transactions = this.transactions.filter((t) => t.id != id);

      if (this.transactions.length < originalLength) {
        this.saveTransactions();
        this.refreshAll();
        alert("Transaction deleted successfully!");
      } else {
        alert("Error: Transaction not found");
      }
    }
  },

  // Display transactions in table
  displayTransactions() {
    const tbody = document.getElementById("transactionsBody");

    if (this.transactions.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">No transactions found. Add your first transaction to get started!</td></tr>';
      return;
    }

    let html = "";
    this.transactions.forEach((transaction) => {
      const amountClass =
        transaction.type === "income" ? "amount-positive" : "amount-negative";
      const amountPrefix = transaction.type === "income" ? "+" : "-";
      const typeIcon = transaction.type === "income" ? "↑" : "↓";
      const typeColor = transaction.type === "income" ? "#10b981" : "#ef4444";

      html += `
                        <tr>
                            <td>${new Date(transaction.date).toLocaleDateString(
                              "en-IN"
                            )}</td>
                            <td>
                                <span style="display: inline-flex; align-items: center; gap: 6px; color: ${typeColor};">
                                    <span style="font-weight: bold;">${typeIcon}</span>
                                    ${
                                      transaction.type.charAt(0).toUpperCase() +
                                      transaction.type.slice(1)
                                    }
                                </span>
                            </td>
                            <td><strong>${transaction.category}</strong></td>
                            <td>${transaction.description || "-"}</td>
                            <td style="text-transform: capitalize;">${transaction.paymentMethod.replace(
                              "_",
                              " "
                            )}</td>
                            <td class="${amountClass}"><strong>${amountPrefix}₹${transaction.amount.toLocaleString(
        "en-IN"
      )}</strong></td>
                            <td>
                                <button class="delete-btn" onclick="MoneyTracker.deleteTransaction('${
                                  transaction.id
                                }')" title="Delete transaction">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
    });

    tbody.innerHTML = html;
  },

  // Update dashboard statistics
  updateDashboard() {
    const totalIncome = this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    document.getElementById(
      "totalIncome"
    ).textContent = `₹${totalIncome.toLocaleString()}`;
    document.getElementById(
      "totalExpenses"
    ).textContent = `₹${totalExpenses.toLocaleString()}`;
    document.getElementById(
      "balance"
    ).textContent = `₹${balance.toLocaleString()}`;

    const incomeHero = document.getElementById("incomeHero");
    const expenseHero = document.getElementById("expenseHero");
    const balanceHero = document.getElementById("balanceHero");
    if (incomeHero) incomeHero.textContent = `₹${totalIncome.toLocaleString()}`;
    if (expenseHero)
      expenseHero.textContent = `₹${totalExpenses.toLocaleString()}`;
    if (balanceHero) balanceHero.textContent = `₹${balance.toLocaleString()}`;

    const balanceElement = document.getElementById("balance");
    balanceElement.style.color = balance >= 0 ? "#10b981" : "#ef4444";

    if (balanceHero) {
      balanceHero.style.color = balance >= 0 ? "#22c55e" : "#ef4444";
    }

    this.displayAnomalyAlerts();
    this.displayRecentTransactions();
  },

  // Display recent transactions on dashboard
  displayRecentTransactions() {
    const recentContainer = document.getElementById("recentTransactions");
    const recent = this.transactions.slice(0, 5);

    if (recent.length === 0) {
      recentContainer.innerHTML =
        '<p style="text-align: center; padding: 20px; color: #64748b;">No transactions yet. Add your first transaction to get started!</p>';
      return;
    }

    let html =
      '<table class="transactions-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>';

    recent.forEach((transaction) => {
      const amountClass =
        transaction.type === "income" ? "amount-positive" : "amount-negative";
      const amountPrefix = transaction.type === "income" ? "+" : "-";
      const typeIcon = transaction.type === "income" ? "↑" : "↓";
      const typeColor = transaction.type === "income" ? "#10b981" : "#ef4444";

      html += `
                        <tr>
                            <td>${new Date(transaction.date).toLocaleDateString(
                              "en-IN"
                            )}</td>
                            <td>
                                <span style="display: inline-flex; align-items: center; gap: 6px; color: ${typeColor};">
                                    <span style="font-weight: bold;">${typeIcon}</span>
                                    ${
                                      transaction.type.charAt(0).toUpperCase() +
                                      transaction.type.slice(1)
                                    }
                                </span>
                            </td>
                            <td><strong>${transaction.category}</strong></td>
                            <td>${transaction.description || "-"}</td>
                            <td class="${amountClass}"><strong>${amountPrefix}₹${transaction.amount.toLocaleString(
        "en-IN"
      )}</strong></td>
                        </tr>
                    `;
    });

    html += "</tbody></table>";
    recentContainer.innerHTML = html;
  },

  // Create charts
  createCharts() {
    this.createDailyExpenseChart();
    this.createExpensePieChart();
    this.createTimeSeriesChart();
    this.createDayOfWeekHeatmap();
  },

  // Create daily expense bar chart
  createDailyExpenseChart() {
    const ctx = document.getElementById("dailyExpenseChart").getContext("2d");

    if (window.dailyExpenseChart instanceof Chart) {
      window.dailyExpenseChart.destroy();
    }

    const dailyExpenses = {};
    this.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const date = t.date;
        dailyExpenses[date] = (dailyExpenses[date] || 0) + t.amount;
      });

    const sortedDates = Object.keys(dailyExpenses).sort();
    const labels = sortedDates.slice(-30);
    const data = labels.map((date) => dailyExpenses[date]);

    const formattedLabels = labels.map((date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    });

    if (labels.length === 0) {
      ctx.font = "16px Inter";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText(
        "No expense data available",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return;
    }

    window.dailyExpenseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: "Daily Expenses (₹)",
            data: data,
            backgroundColor: "#ef4444",
            borderColor: "#dc2626",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `₹${context.parsed.y.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₹" + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  },

  // Create expense category pie chart
  createExpensePieChart() {
    const ctx = document.getElementById("expensePieChart").getContext("2d");

    if (window.expensePieChart instanceof Chart) {
      window.expensePieChart.destroy();
    }

    const expenseByCategory = {};
    this.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        expenseByCategory[t.category] =
          (expenseByCategory[t.category] || 0) + t.amount;
      });

    const labels = Object.keys(expenseByCategory);
    const data = Object.values(expenseByCategory);

    if (labels.length === 0) {
      ctx.font = "16px Inter";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText(
        "No expense data available",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return;
    }

    const colors = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#6366f1",
    ];

    window.expensePieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${
                  context.label
                }: ₹${value.toLocaleString()} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  },

  // Create Time Series Analysis Chart
  createTimeSeriesChart() {
    const ctx = document.getElementById("timeSeriesChart").getContext("2d");

    if (window.timeSeriesChart instanceof Chart) {
      window.timeSeriesChart.destroy();
    }

    // Perform time series analysis
    const analysis = this.performTimeSeriesAnalysis();

    if (analysis.dates.length === 0) {
      ctx.font = "16px Inter";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText(
        "No expense data available for time series analysis",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );

      document.getElementById("timeSeriesStats").innerHTML =
        '<p style="text-align: center; color: #64748b;">Add some expense transactions to see time series analysis</p>';
      return;
    }

    // Calculate SMA forecast
    const forecast = this.calculateSMAForecast(
      analysis.rawDates,
      analysis.amounts,
      7,
      7
    );

    // Prepare datasets
    const datasets = [
      {
        label: "Actual Daily Spending (₹)",
        data: analysis.amounts,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ];

    // Combine dates for x-axis (actual + forecast)
    let allLabels = [...analysis.dates];

    // Add forecast dataset if available
    if (forecast.forecastDates.length > 0) {
      allLabels = [...analysis.dates, ...forecast.forecastDates];

      // Create forecast data array with nulls for actual data points
      const forecastData = new Array(analysis.amounts.length)
        .fill(null)
        .concat(forecast.forecastAmounts);

      datasets.push({
        label: "Predicted Spending (7-day SMA)",
        data: forecastData,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.05)",
        borderWidth: 2,
        borderDash: [8, 4],
        fill: false,
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointStyle: "rectRot",
      });
    }

    // Create the line chart
    window.timeSeriesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: allLabels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { weight: "bold" },
              usePointStyle: true,
              padding: 15,
            },
          },
          tooltip: {
            callbacks: {
              title: function (context) {
                const index = context[0].dataIndex;
                if (index < analysis.rawDates.length) {
                  return analysis.rawDates[index];
                } else {
                  // For forecast dates, calculate the actual date
                  const lastDate = new Date(
                    analysis.rawDates[analysis.rawDates.length - 1]
                  );
                  const daysAhead = index - analysis.rawDates.length + 1;
                  lastDate.setDate(lastDate.getDate() + daysAhead);
                  return lastDate.toISOString().split("T")[0] + " (Predicted)";
                }
              },
              label: function (context) {
                const value = context.parsed.y;
                if (value === null) return null;
                if (value === 0) {
                  return "No spending";
                }
                const prefix =
                  context.datasetIndex === 0 ? "Spent: " : "Predicted: ";
                return `${prefix}₹${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
              font: { weight: "bold" },
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Amount (₹)",
              font: { weight: "bold" },
            },
            ticks: {
              callback: function (value) {
                return "₹" + value.toLocaleString();
              },
            },
          },
        },
      },
    });

    // Display statistics with forecast information
    const stats = analysis.stats;
    let statsHtml = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <strong style="color: #0f172a;">Total Period:</strong><br>
                            <span style="color: #64748b;">${
                              stats.totalDays
                            } days</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Days with Spending:</strong><br>
                            <span style="color: #ef4444; font-weight: 600;">${
                              stats.daysWithSpending
                            } days</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Days without Spending:</strong><br>
                            <span style="color: #10b981; font-weight: 600;">${
                              stats.daysWithoutSpending
                            } days</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Average Daily Spending:</strong><br>
                            <span style="color: #3b82f6; font-weight: 600;">₹${stats.averageDailySpending.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Maximum Daily Spending:</strong><br>
                            <span style="color: #ef4444; font-weight: 600;">₹${stats.maxSpending.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Minimum Daily Spending:</strong><br>
                            <span style="color: #10b981; font-weight: 600;">₹${stats.minSpending.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Total Spending:</strong><br>
                            <span style="color: #0f172a; font-weight: 700; font-size: 1.1rem;">₹${stats.totalSpending.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Spending Frequency:</strong><br>
                            <span style="color: #64748b;">${(
                              (stats.daysWithSpending / stats.totalDays) *
                              100
                            ).toFixed(1)}%</span>
                        </div>`;

    // Add forecast statistics if available
    if (forecast.forecastDates.length > 0) {
      const confidenceColor =
        forecast.confidence === "high"
          ? "#10b981"
          : forecast.confidence === "medium"
          ? "#f59e0b"
          : "#ef4444";
      const confidenceIcon =
        forecast.confidence === "high"
          ? "✓"
          : forecast.confidence === "medium"
          ? "⚠"
          : "!";

      statsHtml += `
                        <div style="grid-column: 1 / -1; margin-top: 12px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
                            <strong style="color: #8b5cf6; font-size: 1.05rem;">
                                <i class="fas fa-crystal-ball"></i> 7-Day Forecast (SMA Prediction)
                            </strong>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Predicted Daily Average:</strong><br>
                            <span style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">₹${forecast.smaValue.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Total Forecast (7 days):</strong><br>
                            <span style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">₹${forecast.totalForecast.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Forecast Confidence:</strong><br>
                            <span style="color: ${confidenceColor}; font-weight: 600; text-transform: capitalize;">
                                ${confidenceIcon} ${forecast.confidence}
                            </span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Data Variance:</strong><br>
                            <span style="color: #64748b;">${forecast.coefficientOfVariation.toFixed(
                              1
                            )}% CV</span>
                        </div>`;
    }

    statsHtml += `</div>`;
    document.getElementById("timeSeriesStats").innerHTML = statsHtml;
  }, // Refresh all displays
  refreshAll() {
    this.updateDashboard();
    if (this.currentTab === "transactions") {
      this.displayTransactions();
    }
  },

  // Simple Moving Average (SMA) Prediction Function
  calculateSMAForecast(dates, amounts, window = 7, forecastDays = 7) {
    /**
     * Calculates Simple Moving Average and forecasts future spending
     * @param {Array} dates - Array of date strings
     * @param {Array} amounts - Array of spending amounts
     * @param {Number} window - Number of days to use for moving average (default: 7)
     * @param {Number} forecastDays - Number of days to forecast (default: 7)
     * @returns {Object} Object containing forecast dates, amounts, and SMA value
     */

    if (amounts.length < window) {
      return {
        forecastDates: [],
        forecastAmounts: [],
        smaValue: 0,
        confidence: "low",
      };
    }

    // Calculate SMA using the last 'window' days of actual data
    const lastWindowAmounts = amounts.slice(-window);
    const smaValue =
      lastWindowAmounts.reduce((sum, val) => sum + val, 0) / window;

    // Generate forecast dates (next 7 days from the last date)
    const lastDate = new Date(dates[dates.length - 1]);
    const forecastDates = [];
    const forecastAmounts = [];

    for (let i = 1; i <= forecastDays; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);

      const dateStr = nextDate.toISOString().split("T")[0];
      const formattedDate = nextDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      forecastDates.push(formattedDate);
      forecastAmounts.push(smaValue); // Each forecasted day uses the SMA value
    }

    // Calculate total forecasted spending
    const totalForecast = smaValue * forecastDays;

    // Determine confidence level based on data variance
    const variance =
      lastWindowAmounts.reduce((sum, val) => {
        return sum + Math.pow(val - smaValue, 2);
      }, 0) / window;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / smaValue) * 100;

    let confidence = "high";
    if (coefficientOfVariation > 50) confidence = "low";
    else if (coefficientOfVariation > 30) confidence = "medium";

    return {
      forecastDates,
      forecastAmounts,
      smaValue: parseFloat(smaValue.toFixed(2)),
      totalForecast: parseFloat(totalForecast.toFixed(2)),
      confidence,
      window,
      forecastDays,
      coefficientOfVariation: parseFloat(coefficientOfVariation.toFixed(2)),
    };
  },

  // Anomaly Detection Function
  detectSpendingAnomalies(threshold = 2) {
    /**
     * Detects statistical outliers in expense transactions using Z-score analysis
     * @param {Number} threshold - Z-score threshold for anomaly detection (default: 2)
     * @returns {Object} Object containing anomalies and category statistics
     */

    // Filter only expense transactions
    const expenseTransactions = this.transactions.filter(
      (t) => t.type === "expense"
    );

    if (expenseTransactions.length === 0) {
      return {
        anomalies: [],
        categoryStats: {},
        totalAnomalies: 0,
      };
    }

    // Group transactions by category
    const categoryGroups = {};
    expenseTransactions.forEach((transaction) => {
      const category = transaction.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(transaction);
    });

    // Calculate statistics for each category
    const categoryStats = {};
    const anomalies = [];

    Object.keys(categoryGroups).forEach((category) => {
      const transactions = categoryGroups[category];
      const amounts = transactions.map((t) => t.amount);

      // Skip categories with less than 3 transactions (not enough data for meaningful statistics)
      if (amounts.length < 3) {
        categoryStats[category] = {
          count: amounts.length,
          mean: 0,
          stdDev: 0,
          insufficient: true,
        };
        return;
      }

      // Calculate Mean (average)
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

      // Calculate Standard Deviation
      const variance =
        amounts.reduce((sum, val) => {
          return sum + Math.pow(val - mean, 2);
        }, 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Store category statistics
      categoryStats[category] = {
        count: amounts.length,
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        insufficient: false,
      };

      // Detect anomalies (Z-score > threshold)
      transactions.forEach((transaction) => {
        if (stdDev === 0) {
          // If stdDev is 0, all values are the same, no anomalies
          return;
        }

        // Calculate Z-score
        const zScore = (transaction.amount - mean) / stdDev;

        // Check if transaction is an anomaly (more than threshold standard deviations above mean)
        if (zScore > threshold) {
          anomalies.push({
            id: transaction.id,
            date: transaction.date,
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description || "No description",
            paymentMethod: transaction.paymentMethod,
            zScore: parseFloat(zScore.toFixed(2)),
            mean: mean,
            stdDev: stdDev,
            deviationAmount: parseFloat((transaction.amount - mean).toFixed(2)),
          });
        }
      });
    });

    // Sort anomalies by Z-score (highest first)
    anomalies.sort((a, b) => b.zScore - a.zScore);

    return {
      anomalies,
      categoryStats,
      totalAnomalies: anomalies.length,
      threshold,
    };
  },

  // Display Anomaly Alerts on Dashboard
  displayAnomalyAlerts() {
    const anomalySection = document.getElementById("anomalyAlertSection");
    const detection = this.detectSpendingAnomalies(2);

    console.log("Total anomalies detected:", detection.anomalies.length);
    console.log("Approved anomalies:", this.approvedAnomalies);

    // Filter out approved anomalies (convert IDs to strings for comparison)
    const unapprovedAnomalies = detection.anomalies.filter(
      (anomaly) => !this.approvedAnomalies.includes(String(anomaly.id))
    );

    console.log("Unapproved anomalies:", unapprovedAnomalies.length);

    if (unapprovedAnomalies.length === 0) {
      anomalySection.innerHTML = "";
      return;
    }

    let html = `
                    <div class="anomaly-alert-container">
                        <h3>
                            <i class="fas fa-exclamation-triangle"></i>
                            Unusual Spending Detected (${
                              unapprovedAnomalies.length
                            } Alert${unapprovedAnomalies.length > 1 ? "s" : ""})
                        </h3>
                        <p style="margin-bottom: 16px; color: #92400e; font-size: 0.9rem;">
                            The following transactions are statistically unusual compared to your typical spending in each category:
                        </p>
                        <div class="anomaly-list">
                `;

    unapprovedAnomalies.forEach((anomaly) => {
      const date = new Date(anomaly.date).toLocaleDateString("en-IN");
      const percentAboveMean = (
        ((anomaly.amount - anomaly.mean) / anomaly.mean) *
        100
      ).toFixed(0);

      html += `
                        <div class="anomaly-item">
                            <div class="anomaly-item-header">
                                <span class="anomaly-category">
                                    ${anomaly.category}
                                    <span class="anomaly-z-score">Z-score: ${
                                      anomaly.zScore
                                    }</span>
                                </span>
                                <span class="anomaly-amount">₹${anomaly.amount.toLocaleString()}</span>
                            </div>
                            <div class="anomaly-details">
                                <span><i class="fas fa-calendar"></i> ${date}</span>
                                <span><i class="fas fa-credit-card"></i> ${anomaly.paymentMethod.replace(
                                  "_",
                                  " "
                                )}</span>
                                <span><i class="fas fa-chart-line"></i> ${percentAboveMean}% above average</span>
                            </div>
                            <div style="margin-top: 8px; font-size: 0.875rem; color: #64748b;">
                                <strong>Description:</strong> ${
                                  anomaly.description
                                }
                            </div>
                            <div style="margin-top: 6px; font-size: 0.8rem; color: #92400e; background: #fef3c7; padding: 6px 10px; border-radius: 6px; display: inline-block;">
                                💡 Typical ${
                                  anomaly.category
                                } spending: ₹${anomaly.mean.toLocaleString()} (±₹${anomaly.stdDev.toLocaleString()})
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px;">
                                <button onclick="MoneyTracker.approveAnomaly('${
                                  anomaly.id
                                }')" 
                                    class="btn btn-success" 
                                    style="padding: 8px 16px; font-size: 0.875rem;">
                                    <i class="fas fa-check"></i> Approve (Legitimate)
                                </button>
                                <button onclick="MoneyTracker.dismissAnomaly('${
                                  anomaly.id
                                }')" 
                                    class="btn" 
                                    style="padding: 8px 16px; font-size: 0.875rem; background: #94a3b8; color: white;">
                                    <i class="fas fa-times"></i> Dismiss
                                </button>
                            </div>
                        </div>
                    `;
    });

    html += `
                        </div>
                    </div>
                `;

    anomalySection.innerHTML = html;
  },

  // Heatmap Data Preparation - Aggregate Expenses by Day of Week
  getExpensesByDayOfWeek() {
    /**
     * Aggregates expenses by day of the week for heatmap visualization
     * @returns {Object} Object containing day-wise spending data and statistics
     */

    // Filter only expense transactions
    const expenseTransactions = this.transactions.filter(
      (t) => t.type === "expense"
    );

    if (expenseTransactions.length === 0) {
      return {
        dayTotals: {
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
          Sunday: 0,
        },
        dayAverages: {},
        dayCounts: {},
        totalExpenses: 0,
        isEmpty: true,
      };
    }

    // Initialize day totals and counts
    const dayTotals = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    const dayCounts = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    // Days of week array for mapping
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Aggregate expenses by day of week
    expenseTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = daysOfWeek[dayIndex];

      dayTotals[dayName] += transaction.amount;
      dayCounts[dayName] += 1;
    });

    // Calculate averages per day
    const dayAverages = {};
    Object.keys(dayTotals).forEach((day) => {
      dayAverages[day] =
        dayCounts[day] > 0
          ? parseFloat((dayTotals[day] / dayCounts[day]).toFixed(2))
          : 0;
    });

    // Calculate total expenses
    const totalExpenses = Object.values(dayTotals).reduce(
      (sum, val) => sum + val,
      0
    );

    // Sort the results from Monday to Sunday
    const sortedDayTotals = {
      Monday: dayTotals["Monday"],
      Tuesday: dayTotals["Tuesday"],
      Wednesday: dayTotals["Wednesday"],
      Thursday: dayTotals["Thursday"],
      Friday: dayTotals["Friday"],
      Saturday: dayTotals["Saturday"],
      Sunday: dayTotals["Sunday"],
    };

    const sortedDayAverages = {
      Monday: dayAverages["Monday"],
      Tuesday: dayAverages["Tuesday"],
      Wednesday: dayAverages["Wednesday"],
      Thursday: dayAverages["Thursday"],
      Friday: dayAverages["Friday"],
      Saturday: dayAverages["Saturday"],
      Sunday: dayAverages["Sunday"],
    };

    const sortedDayCounts = {
      Monday: dayCounts["Monday"],
      Tuesday: dayCounts["Tuesday"],
      Wednesday: dayCounts["Wednesday"],
      Thursday: dayCounts["Thursday"],
      Friday: dayCounts["Friday"],
      Saturday: dayCounts["Saturday"],
      Sunday: dayCounts["Sunday"],
    };

    // Find the day with highest and lowest spending
    let maxDay = "Monday";
    let minDay = "Monday";
    let maxAmount = sortedDayTotals["Monday"];
    let minAmount = sortedDayTotals["Monday"];

    Object.keys(sortedDayTotals).forEach((day) => {
      if (sortedDayTotals[day] > maxAmount) {
        maxAmount = sortedDayTotals[day];
        maxDay = day;
      }
      if (dayCounts[day] > 0 && sortedDayTotals[day] < minAmount) {
        minAmount = sortedDayTotals[day];
        minDay = day;
      }
    });

    return {
      dayTotals: sortedDayTotals,
      dayAverages: sortedDayAverages,
      dayCounts: sortedDayCounts,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      maxDay,
      maxAmount,
      minDay,
      minAmount,
      isEmpty: false,
    };
  },

  // Create Day of Week Heatmap Chart
  createDayOfWeekHeatmap() {
    const ctx = document.getElementById("dayOfWeekChart").getContext("2d");

    if (window.dayOfWeekChart instanceof Chart) {
      window.dayOfWeekChart.destroy();
    }

    // Get day of week data
    const data = this.getExpensesByDayOfWeek();

    if (data.isEmpty) {
      ctx.font = "16px Inter";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText(
        "No expense data available for day of week analysis",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );

      document.getElementById("dayOfWeekStats").innerHTML =
        '<p style="text-align: center; color: #64748b;">Add some expense transactions to see day of week analysis</p>';
      return;
    }

    const days = Object.keys(data.dayTotals);
    const totals = Object.values(data.dayTotals);
    const averages = Object.values(data.dayAverages);

    // Create gradient colors based on spending intensity
    const maxTotal = Math.max(...totals);
    const colors = totals.map((total) => {
      const intensity = total / maxTotal;
      // Red gradient: lighter for less spending, darker for more
      const red = 239;
      const green = Math.floor(68 + 180 * (1 - intensity));
      const blue = Math.floor(68 + 180 * (1 - intensity));
      return `rgb(${red}, ${green}, ${blue})`;
    });

    // Create the bar chart
    window.dayOfWeekChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days,
        datasets: [
          {
            label: "Total Spending (₹)",
            data: totals,
            backgroundColor: colors,
            borderColor: colors.map((color) =>
              color.replace("rgb", "rgba").replace(")", ", 0.8)")
            ),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { weight: "bold" },
            },
          },
          tooltip: {
            callbacks: {
              title: function (context) {
                const day = context[0].label;
                const count = data.dayCounts[day];
                return `${day} (${count} transaction${count !== 1 ? "s" : ""})`;
              },
              label: function (context) {
                const day = context.label;
                const total = context.parsed.y;
                const avg = data.dayAverages[day];
                return [
                  `Total: ₹${total.toLocaleString()}`,
                  `Average: ₹${avg.toLocaleString()} per transaction`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Day of Week",
              font: { weight: "bold" },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Total Spending (₹)",
              font: { weight: "bold" },
            },
            ticks: {
              callback: function (value) {
                return "₹" + value.toLocaleString();
              },
            },
          },
        },
      },
    });

    // Display statistics
    const statsHtml = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <strong style="color: #0f172a;">Highest Spending Day:</strong><br>
                            <span style="color: #ef4444; font-weight: 700; font-size: 1.1rem;">${
                              data.maxDay
                            }</span><br>
                            <span style="color: #64748b; font-size: 0.9rem;">₹${data.maxAmount.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Lowest Spending Day:</strong><br>
                            <span style="color: #10b981; font-weight: 700; font-size: 1.1rem;">${
                              data.minDay
                            }</span><br>
                            <span style="color: #64748b; font-size: 0.9rem;">₹${data.minAmount.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Total Weekly Spending:</strong><br>
                            <span style="color: #0f172a; font-weight: 700; font-size: 1.1rem;">₹${data.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div>
                            <strong style="color: #0f172a;">Average per Day:</strong><br>
                            <span style="color: #3b82f6; font-weight: 600;">₹${(
                              data.totalExpenses / 7
                            )
                              .toFixed(0)
                              .toLocaleString()}</span>
                        </div>
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <strong style="color: #0f172a;">💡 Spending Pattern Insight:</strong><br>
                        <span style="color: #64748b; font-size: 0.9rem;">
                            You tend to spend most on <strong style="color: #ef4444;">${
                              data.maxDay
                            }s</strong> 
                            (₹${data.maxAmount.toLocaleString()}) and least on <strong style="color: #10b981;">${
      data.minDay
    }s</strong> 
                            (₹${data.minAmount.toLocaleString()}). 
                            ${
                              data.maxAmount > (data.totalExpenses / 7) * 1.5
                                ? "Consider budgeting more carefully on " +
                                  data.maxDay +
                                  "s."
                                : "Your spending is relatively balanced across the week."
                            }
                        </span>
                    </div>
                `;
    document.getElementById("dayOfWeekStats").innerHTML = statsHtml;
  },

  // Time Series Analysis for Expenses
  performTimeSeriesAnalysis() {
    // Filter only expense transactions
    const expenseTransactions = this.transactions.filter(
      (t) => t.type === "expense"
    );

    if (expenseTransactions.length === 0) {
      return {
        dates: [],
        amounts: [],
        stats: {
          totalDays: 0,
          daysWithSpending: 0,
          daysWithoutSpending: 0,
          averageDailySpending: 0,
          maxSpending: 0,
          minSpending: 0,
        },
      };
    }

    // Group expenses by date
    const dailyExpenses = {};
    expenseTransactions.forEach((t) => {
      const date = t.date;
      dailyExpenses[date] = (dailyExpenses[date] || 0) + t.amount;
    });

    // Find date range (earliest to latest transaction)
    const allDates = Object.keys(dailyExpenses).sort();
    const startDate = new Date(allDates[0]);
    const endDate = new Date(allDates[allDates.length - 1]);

    // Fill in missing dates with zero spending
    const completeTimeSeries = [];
    const completeDates = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      completeDates.push(dateStr);
      completeTimeSeries.push(dailyExpenses[dateStr] || 0);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate statistics
    const nonZeroAmounts = completeTimeSeries.filter((amount) => amount > 0);
    const totalDays = completeTimeSeries.length;
    const daysWithSpending = nonZeroAmounts.length;
    const daysWithoutSpending = totalDays - daysWithSpending;
    const totalSpending = completeTimeSeries.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const averageDailySpending = totalSpending / totalDays;
    const maxSpending =
      nonZeroAmounts.length > 0 ? Math.max(...nonZeroAmounts) : 0;
    const minSpending =
      nonZeroAmounts.length > 0 ? Math.min(...nonZeroAmounts) : 0;

    // Format dates for display (convert to readable format)
    const formattedDates = completeDates.map((dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    });

    return {
      dates: formattedDates,
      rawDates: completeDates,
      amounts: completeTimeSeries,
      stats: {
        totalDays,
        daysWithSpending,
        daysWithoutSpending,
        averageDailySpending: parseFloat(averageDailySpending.toFixed(2)),
        maxSpending,
        minSpending,
        totalSpending,
      },
    };
  },

  // Export to Excel
  exportToExcel() {
    if (this.transactions.length === 0) {
      alert("No transactions to export");
      return;
    }

    let csv = "Date,Type,Category,Description,Payment Method,Amount\n";
    this.transactions.forEach((t) => {
      csv += `${t.date},${t.type},${t.category},"${t.description}",${t.paymentMethod},${t.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// Global functions for HTML onclick handlers
function addCustomCategory() {
  const customInput = document.getElementById("customCategory");
  const typeSelect = document.getElementById("type");

  if (!customInput.value.trim() || !typeSelect.value) {
    alert("Please enter a category name and select a type first");
    return;
  }

  const newCategory = customInput.value.trim();
  const type = typeSelect.value;

  if (MoneyTracker.getAllCategories(type).includes(newCategory)) {
    alert("Category already exists");
    return;
  }

  MoneyTracker.customCategories[type].push(newCategory);
  MoneyTracker.saveCustomCategories();
  MoneyTracker.loadCategoriesForType(type);

  document.getElementById("category").value = newCategory;
  customInput.value = "";

  // Refresh custom dropdown to show newly selected category
  if (typeof refreshCustomSelect === "function") {
    refreshCustomSelect("category");
  }

  alert("Custom category added successfully!");
}

function exportToExcel() {
  MoneyTracker.exportToExcel();
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqRDG0wdaBrmIHZwIg8Y7Pgd4BIp2wj8U",
  authDomain: "money-spending-tracker.firebaseapp.com",
  projectId: "money-spending-tracker",
  storageBucket: "money-spending-tracker.firebasestorage.app",
  messagingSenderId: "259178922510",
  appId: "1:259178922510:web:8c03f50cc2a8c40abc325f",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.auth = firebase.auth();
window.currentUser = null;

// Password visibility toggle
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const passwordInput = document.getElementById("authPassword");
    const eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.classList.remove("fa-eye");
      eyeIcon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      eyeIcon.classList.remove("fa-eye-slash");
      eyeIcon.classList.add("fa-eye");
    }
  });

// Helper functions for loading states
function setSignInLoading(isLoading) {
  const btn = document.getElementById("signInBtn");
  const text = document.getElementById("signInText");
  const icon = document.getElementById("signInIcon");
  const spinner = document.getElementById("signInSpinner");

  btn.disabled = isLoading;
  text.textContent = isLoading ? "Signing in..." : "Sign In";
  icon.classList.toggle("hidden", isLoading);
  spinner.classList.toggle("hidden", !isLoading);
}

function setSignUpLoading(isLoading) {
  const btn = document.getElementById("signUpBtn");
  const text = document.getElementById("signUpText");
  const spinner = document.getElementById("signUpSpinner");

  if (!btn) return; // Button doesn't exist
  btn.disabled = isLoading;
  if (text)
    text.textContent = isLoading ? "Creating account..." : "Create New Account";
  if (spinner) spinner.classList.toggle("hidden", !isLoading);
}

function showAuthError(message) {
  const errorDiv = document.getElementById("authError");
  const errorMessage = document.getElementById("authErrorMessage");
  errorMessage.textContent = message;
  errorDiv.classList.remove("hidden");
  errorDiv.classList.add("flex");
  // Shake animation
  errorDiv.style.animation = "none";
  errorDiv.offsetHeight; // Trigger reflow
  errorDiv.style.animation = "shake 0.5s ease-in-out";
}

function hideAuthError() {
  const errorDiv = document.getElementById("authError");
  errorDiv.classList.add("hidden");
  errorDiv.classList.remove("flex");
}

function showAuthSuccess(message) {
  const errorDiv = document.getElementById("authError");
  const errorMessage = document.getElementById("authErrorMessage");
  errorMessage.textContent = message;
  errorDiv.classList.remove(
    "hidden",
    "bg-red-50",
    "text-red-600",
    "border-red-100"
  );
  errorDiv.classList.add(
    "flex",
    "bg-green-50",
    "text-green-600",
    "border-green-100"
  );
  errorDiv.querySelector(".w-8").classList.remove("bg-red-100");
  errorDiv.querySelector(".w-8").classList.add("bg-green-100");
  errorDiv.querySelector("i").classList.remove("fa-exclamation-circle");
  errorDiv.querySelector("i").classList.add("fa-check-circle");
}

// Forgot Password handler
document
  .getElementById("forgotPasswordBtn")
  .addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();

    if (!email) {
      showAuthError("Please enter your email address first");
      return;
    }

    try {
      hideAuthError();
      await firebase.auth().sendPasswordResetEmail(email);
      showAuthSuccess("Password reset email sent! Check your inbox.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        showAuthError("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        showAuthError("Invalid email format.");
      } else {
        showAuthError(error.message);
      }
    }
  });

// Form submission handler (Enter key support)
document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("signInBtn").click();
});

// Authentication handlers
document.getElementById("signInBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  // Validate inputs
  if (!email || !password) {
    showAuthError("Please enter both email and password");
    return;
  }

  try {
    hideAuthError();
    setSignInLoading(true);
    await firebase.auth().signInWithEmailAndPassword(email, password);
  } catch (error) {
    // Friendly error messages
    if (error.code === "auth/invalid-credential") {
      // Try to create account if user doesn't exist
      try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        // Account created successfully, user is now signed in
        return;
      } catch (createError) {
        if (createError.code === "auth/email-already-in-use") {
          showAuthError("Incorrect password. Please try again.");
        } else if (createError.code === "auth/weak-password") {
          showAuthError(
            "Password is too weak. Please use at least 6 characters."
          );
        } else {
          showAuthError(
            "Invalid email or password. Please check your credentials."
          );
        }
      }
    } else if (error.code === "auth/user-not-found") {
      // Auto-create account for new users
      try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        return;
      } catch (createError) {
        showAuthError(createError.message);
      }
    } else if (error.code === "auth/wrong-password") {
      showAuthError("Incorrect password. Please try again.");
    } else if (error.code === "auth/invalid-email") {
      showAuthError(
        "Invalid email format. Please enter a valid email address."
      );
    } else if (error.code === "auth/too-many-requests") {
      showAuthError("Too many failed attempts. Please try again later.");
    } else {
      showAuthError(error.message);
    }
  } finally {
    setSignInLoading(false);
  }
});

// Sign Up button handler (only if button exists)
const signUpBtnElement = document.getElementById("signUpBtn");
if (signUpBtnElement) {
  signUpBtnElement.addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    // Validate inputs
    if (!email || !password) {
      showAuthError("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      showAuthError("Password must be at least 6 characters");
      return;
    }

    try {
      hideAuthError();
      setSignUpLoading(true);
      await firebase.auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
      // Friendly error messages
      if (error.code === "auth/email-already-in-use") {
        showAuthError(
          "This email is already registered. Please sign in instead."
        );
      } else if (error.code === "auth/invalid-email") {
        showAuthError(
          "Invalid email format. Please enter a valid email address."
        );
      } else if (error.code === "auth/weak-password") {
        showAuthError(
          "Password is too weak. Please use at least 6 characters."
        );
      } else {
        showAuthError(error.message);
      }
    } finally {
      setSignUpLoading(false);
    }
  });
}

// Google Sign In
function setGoogleLoading(isLoading) {
  const btn = document.getElementById("googleSignInBtn");
  const text = document.getElementById("googleSignInText");
  const icon = document.getElementById("googleIcon");
  const spinner = document.getElementById("googleSpinner");

  btn.disabled = isLoading;
  text.textContent = isLoading ? "Signing in..." : "Continue with Google";
  icon.classList.toggle("hidden", isLoading);
  spinner.classList.toggle("hidden", !isLoading);
}

document
  .getElementById("googleSignInBtn")
  .addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      hideAuthError();
      setGoogleLoading(true);
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup, no need to show error
      } else if (error.code === "auth/cancelled-popup-request") {
        // Multiple popups, ignore
      } else if (error.code === "auth/popup-blocked") {
        showAuthError("Popup was blocked. Please allow popups for this site.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        showAuthError(
          "An account already exists with this email using a different sign-in method."
        );
      } else {
        showAuthError(error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  });

document.getElementById("signOutBtn").addEventListener("click", async () => {
  await firebase.auth().signOut();
});

// ========== Profile Modal Logic ==========

// Open profile modal
document.getElementById("profileBtn").addEventListener("click", () => {
  openProfileModal();
});

// Close profile modal
document.getElementById("closeProfileModal").addEventListener("click", () => {
  closeProfileModal();
});

// Close on overlay click
document.getElementById("profileModal").addEventListener("click", (e) => {
  if (e.target.id === "profileModal") {
    closeProfileModal();
  }
});

function openProfileModal() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // Populate profile info
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("profileEmailDisplay").textContent = user.email;
  document.getElementById("displayNameInput").value = user.displayName || "";

  // Determine auth method
  const providers = user.providerData.map((p) => p.providerId);
  let authMethod = "Email/Password";
  if (providers.includes("google.com")) {
    authMethod = "Google";
    if (providers.includes("password")) {
      authMethod = "Google + Email/Password";
    }
  }
  document.getElementById("profileAuthMethod").textContent = authMethod;

  // Format dates
  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";
  const lastSignIn = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
  document.getElementById("profileCreatedAt").textContent = createdAt;
  document.getElementById("profileLastSignIn").textContent = lastSignIn;

  // Show/hide password notice based on auth method
  const hasPassword = providers.includes("password");
  const passwordNotice = document.getElementById("passwordNotSet");
  if (!hasPassword) {
    passwordNotice.style.display = "flex";
    document.getElementById("updatePasswordText").textContent = "Set Password";
  } else {
    passwordNotice.style.display = "none";
    document.getElementById("updatePasswordText").textContent =
      "Update Password";
  }

  // Clear form fields
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordError").style.display = "none";
  document.getElementById("passwordSuccess").style.display = "none";

  // Show modal
  document.getElementById("profileModal").style.display = "flex";
}

function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
}

// Toggle password visibility in profile modal
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    const icon = btn.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

// Display Name Form
document
  .getElementById("displayNameForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document
      .getElementById("displayNameInput")
      .value.trim();
    const user = firebase.auth().currentUser;

    if (!user) return;

    try {
      await user.updateProfile({ displayName });
      showProfileSuccess("Display name updated successfully!");
    } catch (error) {
      showProfileError(error.message);
    }
  });

// Password Form
document
  .getElementById("passwordForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const user = firebase.auth().currentUser;

    // Validation
    if (!newPassword || !confirmPassword) {
      showProfileError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      showProfileError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showProfileError("Passwords do not match.");
      return;
    }

    if (!user) {
      showProfileError("No user signed in.");
      return;
    }

    setPasswordLoading(true);
    hideProfileMessages();

    try {
      // Check if user has password provider
      const providers = user.providerData.map((p) => p.providerId);
      const hasPassword = providers.includes("password");

      if (!hasPassword) {
        // Link email/password credential to account
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          newPassword
        );
        await user.linkWithCredential(credential);
        showProfileSuccess(
          "Password has been set successfully! You can now sign in with email and password."
        );
        document.getElementById("passwordNotSet").style.display = "none";
        document.getElementById("updatePasswordText").textContent =
          "Update Password";
        document.getElementById("profileAuthMethod").textContent =
          "Google + Email/Password";
      } else {
        // Update existing password
        await user.updatePassword(newPassword);
        showProfileSuccess("Password updated successfully!");
      }

      // Clear fields
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } catch (error) {
      console.error("Password update error:", error);
      if (error.code === "auth/requires-recent-login") {
        showProfileError(
          "For security reasons, please sign out and sign back in before changing your password."
        );
      } else if (error.code === "auth/provider-already-linked") {
        showProfileError(
          "A password is already set for this account. Try updating it instead."
        );
      } else if (error.code === "auth/weak-password") {
        showProfileError(
          "Password is too weak. Please use a stronger password."
        );
      } else {
        showProfileError(error.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  });

// Delete Account
document
  .getElementById("deleteAccountBtn")
  .addEventListener("click", async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account?\n\nThis action is permanent and will delete all your data including transactions, custom categories, and settings.\n\nThis cannot be undone!"
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "Please confirm again that you want to permanently delete your account and all associated data."
    );

    if (!doubleConfirm) return;

    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
      // Delete user data from Firestore
      const userDocRef = window.db.collection("users").doc(user.uid);

      // Delete subcollections
      const dataCollection = await userDocRef.collection("data").get();
      const deletePromises = dataCollection.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);

      // Delete user document
      await userDocRef.delete();

      // Delete auth account
      await user.delete();

      closeProfileModal();
      alert("Your account has been deleted successfully.");
    } catch (error) {
      console.error("Delete account error:", error);
      if (error.code === "auth/requires-recent-login") {
        showProfileError(
          "For security reasons, please sign out and sign back in before deleting your account."
        );
      } else {
        showProfileError(error.message);
      }
    }
  });

function showProfileError(message) {
  const errorEl = document.getElementById("passwordError");
  errorEl.textContent = message;
  errorEl.style.display = "block";
  document.getElementById("passwordSuccess").style.display = "none";
}

function showProfileSuccess(message) {
  const successEl = document.getElementById("passwordSuccess");
  successEl.textContent = message;
  successEl.style.display = "block";
  document.getElementById("passwordError").style.display = "none";
}

function hideProfileMessages() {
  document.getElementById("passwordError").style.display = "none";
  document.getElementById("passwordSuccess").style.display = "none";
}

function setPasswordLoading(loading) {
  const btn = document.getElementById("updatePasswordBtn");
  const text = document.getElementById("updatePasswordText");
  const spinner = document.getElementById("passwordSpinner");

  btn.disabled = loading;
  if (loading) {
    text.textContent = "Updating...";
    spinner.classList.remove("hidden");
  } else {
    // Restore text based on whether user has password
    const user = firebase.auth().currentUser;
    const hasPassword = user?.providerData?.some(
      (p) => p.providerId === "password"
    );
    text.textContent = hasPassword ? "Update Password" : "Set Password";
    spinner.classList.add("hidden");
  }
}

// Listen for authentication state changes
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    window.currentUser = user;
    document.getElementById("authModal").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
    document.getElementById("userEmail").textContent = user.email;

    // Initialize app after authentication
    await MoneyTracker.init();
  } else {
    window.currentUser = null;
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
  }
});

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Authentication will handle initialization
});

// ========== Custom Dropdown Logic ==========

// Icon mapping for dropdown options
const dropdownIcons = {
  // Type dropdown
  income: '<i class="fas fa-arrow-up"></i>',
  expense: '<i class="fas fa-arrow-down"></i>',
  // Payment method dropdown
  cash: '<i class="fas fa-money-bill-wave"></i>',
  card: '<i class="fas fa-credit-card"></i>',
  bank_transfer: '<i class="fas fa-university"></i>',
  upi: '<i class="fas fa-mobile-alt"></i>',
  wallet: '<i class="fas fa-wallet"></i>',
  other: '<i class="fas fa-ellipsis-h"></i>',
  // Default for categories
  default: '<i class="fas fa-tag"></i>',
};

function initCustomSelects() {
  const selects = document.querySelectorAll(".form-group select");

  selects.forEach((select) => {
    // Skip if already initialized
    if (select.parentNode.classList.contains("custom-select-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    trigger.tabIndex = 0;

    // Initial value
    const selectedOption = select.options[select.selectedIndex];
    const initialText = selectedOption ? selectedOption.text : "Select";
    const isPlaceholder = !selectedOption || selectedOption.value === "";

    trigger.innerHTML = `
      <span class="${isPlaceholder ? "placeholder" : ""}">${initialText}</span>
      <div class="custom-select-arrow"></div>
    `;
    wrapper.appendChild(trigger);

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "custom-options";
    wrapper.appendChild(optionsContainer);

    // Populate options
    populateCustomOptions(select, optionsContainer, trigger);

    // Click event for trigger
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = wrapper.classList.contains("open");
      closeAllCustomSelects();
      if (!wasOpen) {
        wrapper.classList.add("open");
        // Focus management for accessibility
        const firstOption = optionsContainer.querySelector(".custom-option");
        if (firstOption) firstOption.focus();
      }
    });

    // Keyboard navigation
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!wrapper.classList.contains("open")) {
          trigger.click();
        }
      } else if (e.key === "Escape") {
        closeAllCustomSelects();
        trigger.focus();
      }
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-select-wrapper")) {
      closeAllCustomSelects();
    }
  });

  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllCustomSelects();
    }
  });
}

function populateCustomOptions(select, optionsContainer, trigger) {
  optionsContainer.innerHTML = "";

  Array.from(select.options).forEach((option, index) => {
    // Skip empty placeholder options
    if (option.value === "" && select.options.length > 1) return;

    const customOption = document.createElement("div");
    customOption.className = "custom-option";
    customOption.tabIndex = 0;
    if (option.selected && option.value !== "") {
      customOption.classList.add("selected");
    }
    customOption.dataset.value = option.value;

    // Get icon for this option
    const icon = dropdownIcons[option.value] || dropdownIcons.default;

    customOption.innerHTML = `
      <span class="option-icon">${icon}</span>
      <span class="option-text">${option.text}</span>
    `;

    // Click handler with ripple effect
    customOption.addEventListener("click", (e) => {
      e.stopPropagation();

      // Create ripple effect
      createRipple(e, customOption);

      // Update select value
      select.value = option.value;

      // Update trigger text
      const triggerSpan = trigger.querySelector("span");
      triggerSpan.textContent = option.text;
      triggerSpan.classList.remove("placeholder");

      // Update selected styling with smooth transition
      optionsContainer.querySelectorAll(".custom-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      customOption.classList.add("selected");

      // Close dropdown with slight delay for visual feedback
      setTimeout(() => {
        trigger.closest(".custom-select-wrapper").classList.remove("open");
      }, 150);

      // Trigger change event on original select
      const event = new Event("change", { bubbles: true });
      select.dispatchEvent(event);
    });

    // Keyboard navigation for options
    customOption.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        customOption.click();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = customOption.nextElementSibling;
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = customOption.previousElementSibling;
        if (prev) prev.focus();
        else trigger.focus();
      } else if (e.key === "Escape") {
        closeAllCustomSelects();
        trigger.focus();
      }
    });

    optionsContainer.appendChild(customOption);
  });
}

function createRipple(event, element) {
  const ripple = document.createElement("span");
  ripple.className = "ripple";

  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);

  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

  element.appendChild(ripple);

  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

function closeAllCustomSelects() {
  document
    .querySelectorAll(".custom-select-wrapper.open")
    .forEach((wrapper) => {
      wrapper.classList.remove("open");
    });
}

// Function to refresh a specific custom select (call when options change dynamically)
function refreshCustomSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const wrapper = select.closest(".custom-select-wrapper");
  if (!wrapper) return;

  const optionsContainer = wrapper.querySelector(".custom-options");
  const trigger = wrapper.querySelector(".custom-select-trigger");

  if (optionsContainer && trigger) {
    populateCustomOptions(select, optionsContainer, trigger);

    // Update trigger text
    const selectedOption = select.options[select.selectedIndex];
    const triggerSpan = trigger.querySelector("span");
    if (selectedOption) {
      triggerSpan.textContent = selectedOption.text;
      triggerSpan.classList.toggle("placeholder", selectedOption.value === "");
    }
  }
}

// ========== Custom Date Picker ==========
const CustomDatePicker = {
  currentDate: new Date(),
  selectedDate: null,
  isOpen: false,

  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],

  init() {
    const trigger = document.getElementById("datePickerTrigger");
    const dropdown = document.getElementById("datePickerDropdown");
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");
    const todayBtn = document.getElementById("todayBtn");
    const clearBtn = document.getElementById("clearDate");

    if (!trigger || !dropdown) return;

    // Set today's date as default
    this.selectedDate = new Date();
    this.currentDate = new Date();
    this.updateDisplay();
    this.renderCalendar();

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Navigation
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.prevMonth();
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.nextMonth();
    });

    // Today button
    todayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectToday();
    });

    // Clear button
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clear();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-datepicker-wrapper")) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    const trigger = document.getElementById("datePickerTrigger");
    const dropdown = document.getElementById("datePickerDropdown");

    trigger.classList.add("active");
    dropdown.classList.add("open");
    this.isOpen = true;

    // If there's a selected date, show that month
    if (this.selectedDate) {
      this.currentDate = new Date(this.selectedDate);
    }
    this.renderCalendar();
  },

  close() {
    const trigger = document.getElementById("datePickerTrigger");
    const dropdown = document.getElementById("datePickerDropdown");

    trigger.classList.remove("active");
    dropdown.classList.remove("open");
    this.isOpen = false;
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  },

  selectDate(year, month, day) {
    this.selectedDate = new Date(year, month, day);
    this.updateDisplay();
    this.updateHiddenInput();
    this.renderCalendar();

    // Close after selection with slight delay for visual feedback
    setTimeout(() => this.close(), 150);
  },

  selectToday() {
    const today = new Date();
    this.selectedDate = today;
    this.currentDate = new Date(today);
    this.updateDisplay();
    this.updateHiddenInput();
    this.renderCalendar();
    setTimeout(() => this.close(), 150);
  },

  clear() {
    this.selectedDate = null;
    this.updateDisplay();
    document.getElementById("date").value = "";
    this.renderCalendar();
  },

  updateDisplay() {
    const display = document.getElementById("dateDisplay");
    if (this.selectedDate) {
      const options = {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      display.textContent = this.selectedDate.toLocaleDateString(
        "en-US",
        options
      );
      display.classList.remove("placeholder");
    } else {
      display.textContent = "Select Date";
      display.classList.add("placeholder");
    }
  },

  updateHiddenInput() {
    const input = document.getElementById("date");
    if (this.selectedDate) {
      const year = this.selectedDate.getFullYear();
      const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(this.selectedDate.getDate()).padStart(2, "0");
      input.value = `${year}-${month}-${day}`;
    } else {
      input.value = "";
    }
  },

  renderCalendar() {
    const monthEl = document.getElementById("currentMonth");
    const yearEl = document.getElementById("currentYear");
    const daysContainer = document.getElementById("datepickerDays");

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    monthEl.textContent = this.months[month];
    yearEl.textContent = year;

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Today's date for comparison
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    // Selected date for comparison
    const selectedStr = this.selectedDate
      ? `${this.selectedDate.getFullYear()}-${this.selectedDate.getMonth()}-${this.selectedDate.getDate()}`
      : null;

    let html = "";

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      html += `<button type="button" class="datepicker-day other-month" 
                data-year="${prevYear}" data-month="${prevMonth}" data-day="${day}">${day}</button>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${day}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedStr;

      let classes = "datepicker-day";
      if (isToday) classes += " today";
      if (isSelected) classes += " selected";

      html += `<button type="button" class="${classes}" 
                data-year="${year}" data-month="${month}" data-day="${day}">${day}</button>`;
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= nextMonthDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      html += `<button type="button" class="datepicker-day other-month" 
                data-year="${nextYear}" data-month="${nextMonth}" data-day="${day}">${day}</button>`;
    }

    daysContainer.innerHTML = html;

    // Add click handlers to all day buttons
    daysContainer.querySelectorAll(".datepicker-day").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const y = parseInt(btn.dataset.year);
        const m = parseInt(btn.dataset.month);
        const d = parseInt(btn.dataset.day);
        this.selectDate(y, m, d);
      });
    });
  },

  // Method to set date programmatically (for form reset)
  setDate(dateString) {
    if (dateString) {
      this.selectedDate = new Date(dateString + "T00:00:00");
      this.currentDate = new Date(this.selectedDate);
    } else {
      this.selectedDate = new Date();
      this.currentDate = new Date();
    }
    this.updateDisplay();
    this.updateHiddenInput();
  },
};

// Initialize date picker when DOM is ready
function initCustomDatePicker() {
  CustomDatePicker.init();
}
