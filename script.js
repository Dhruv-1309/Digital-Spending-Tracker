// Configuration for Tailwind
tailwind.config = {
  theme: {
    extend: {
      animation: {
        "slide-in": "slideIn 0.5s ease-out",
        "fade-in": "fadeIn 0.6s ease-out",
        "bounce-in": "bounceIn 0.7s ease-out",
        "pulse-slow": "pulse 3s infinite",
        float: "float 6s ease-in-out infinite",
        gradient: "gradient 8s ease infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
};

// Data Storage - Using localStorage for persistence
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [
  { name: "🍕 Food", budget: 10000 },
  { name: "🎮 Entertainment", budget: 5000 },
  { name: "👕 Shopping", budget: 8000 },
  { name: "🚌 Transport", budget: 3000 },
  { name: "📚 School", budget: 4000 },
  { name: "💄 Other", budget: 2500 },
  { name: "🍰 Birthday", budget: 3000 },
];
let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
let accountBalance = JSON.parse(localStorage.getItem("accountBalance")) || 0;

// Initialize budgets from categories if empty
if (Object.keys(budgets).length === 0) {
  categories.forEach((cat) => {
    budgets[cat.name] = cat.budget;
  });
}

let savingsGoal = JSON.parse(localStorage.getItem("savingsGoal")) || {
  name: "New Phone",
  target: 50000,
  saved: 0,
};

// Chart instances
let categoryChart = null;
let trendChart = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Set default date to today
  document.getElementById("expense-date").value = new Date()
    .toISOString()
    .split("T")[0];

  // Populate categories dropdown
  populateCategoriesDropdown();

  // Update all displays
  updateStats();
  updateAccountBalance();
  updateDashboard();
  updateBudgetControls();
  updateBudgetProgress();
  updateGoalProgress();
  updateCategoriesList();
  updateCategoryUsage();

  // Add event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Expense form submission
  document
    .getElementById("expense-form")
    .addEventListener("submit", handleExpenseSubmission);

  // Goal inputs
  document
    .getElementById("goal-name")
    .addEventListener("change", updateGoalSettings);
  document
    .getElementById("goal-target")
    .addEventListener("change", updateGoalSettings);

  // Category form submission
  document
    .getElementById("category-form")
    .addEventListener("submit", handleCategorySubmission);

  // Modal close on backdrop click
  document
    .getElementById("category-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeCategoryModal();
      }
    });
}

// Amount Calculation Feature
function calculateAmount(input) {
  const value = input.value.trim();
  const resultDiv = document.getElementById("calculation-result");
  const previewDiv = document.getElementById("calculation-preview");

  // Clear previous results
  resultDiv.classList.add("hidden");
  previewDiv.classList.add("hidden");

  if (!value) return;

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
        // Invalid characters found
        previewDiv.textContent = "Only numbers and +, -, *, / are allowed";
        previewDiv.className = "text-red-400 text-sm";
        previewDiv.classList.remove("hidden");
        return;
      }

      // Evaluate the expression safely
      const result = Function('"use strict"; return (' + sanitized + ")")();

      if (isNaN(result) || !isFinite(result) || result < 0) {
        previewDiv.textContent = "Invalid calculation";
        previewDiv.className = "text-red-400 text-sm";
        previewDiv.classList.remove("hidden");
        return;
      }

      // Show calculation preview
      previewDiv.textContent = `${sanitized} = ₹${result.toFixed(2)}`;
      previewDiv.className = "text-green-400 text-sm";
      previewDiv.classList.remove("hidden");

      // Show result in the field
      resultDiv.textContent = `= ₹${result.toFixed(2)}`;
      resultDiv.classList.remove("hidden");

      // Store the calculated value for form submission
      input.dataset.calculatedValue = result.toFixed(2);
    } catch (error) {
      previewDiv.textContent = "Invalid calculation";
      previewDiv.className = "text-red-400 text-sm";
      previewDiv.classList.remove("hidden");
      delete input.dataset.calculatedValue;
    }
  } else {
    // Simple number input
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      input.dataset.calculatedValue = numValue.toFixed(2);
    } else {
      delete input.dataset.calculatedValue;
    }
  }
}

// Account Balance Management
function updateAccountBalance() {
  const balanceElements = [
    document.getElementById("account-balance"),
    document.getElementById("balance-display"),
  ];

  balanceElements.forEach((element) => {
    if (element) {
      element.textContent = `₹${accountBalance.toFixed(2)}`;

      // Add visual feedback based on balance
      if (accountBalance < 1000) {
        element.className = element.className.replace(
          /text-white|text-yellow-400|text-red-400/,
          "text-red-400"
        );
      } else if (accountBalance < 5000) {
        element.className = element.className.replace(
          /text-white|text-yellow-400|text-red-400/,
          "text-yellow-400"
        );
      } else {
        element.className = element.className.replace(
          /text-yellow-400|text-red-400/,
          "text-white"
        );
      }
    }
  });
}

function addToBalance() {
  const balanceInput = document.getElementById("balance-input");
  const quickBalanceInput = document.getElementById("quick-balance-input");

  // Get amount from either input
  let amount = 0;
  if (balanceInput && balanceInput.value) {
    amount = parseFloat(balanceInput.value);
    balanceInput.value = "";
  } else if (quickBalanceInput && quickBalanceInput.value) {
    amount = parseFloat(quickBalanceInput.value);
    quickBalanceInput.value = "";
  }

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount to add!", "error");
    return;
  }

  accountBalance += amount;
  saveToLocalStorage("accountBalance", accountBalance);
  updateAccountBalance();
  showToast(`Added ₹${amount.toFixed(2)} to your account!`);
}

function deductFromBalance(amount) {
  if (accountBalance < amount) {
    showToast(
      "Insufficient balance! Please add money to your account.",
      "error"
    );
    return false;
  }

  accountBalance -= amount;
  saveToLocalStorage("accountBalance", accountBalance);
  updateAccountBalance();
  return true;
}

// Tab Management
function showTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.add("hidden"));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active", "bg-white/20");
    btn.classList.add("text-white/70");
  });

  // Show selected tab
  document.getElementById(tabName).classList.remove("hidden");

  // Add active class to selected button
  const activeBtn = document.getElementById(`tab-${tabName}`);
  activeBtn.classList.add("active", "bg-white/20", "text-white");
  activeBtn.classList.remove("text-white/70");

  // Trigger animations
  const content = document.getElementById(tabName);
  content.style.animation = "none";
  content.offsetHeight; // Trigger reflow
  content.style.animation = "slideIn 0.5s ease-out";

  // Update dashboard when switching to it
  if (tabName === "dashboard") {
    setTimeout(updateDashboard, 100);
  }
}

// Expense Management
function handleExpenseSubmission(e) {
  e.preventDefault();

  const amountInput = document.getElementById("amount");
  const category = document.getElementById("category").value;
  const description =
    document.getElementById("description").value.trim() || "No description";
  const date = document.getElementById("expense-date").value;

  // Get amount from calculated value or direct input
  let amount;
  if (amountInput.dataset.calculatedValue) {
    amount = parseFloat(amountInput.dataset.calculatedValue);
  } else {
    amount = parseFloat(amountInput.value);
  }

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount!", "error");
    return;
  }

  // Check if sufficient balance is available
  if (!deductFromBalance(amount)) {
    return; // Insufficient balance, don't proceed
  }

  const expense = {
    id: Date.now(),
    amount: amount,
    category: category,
    description: description,
    date: date,
    timestamp: new Date().toISOString(),
  };

  expenses.push(expense);
  saveToLocalStorage("expenses", expenses);

  // Reset form
  document.getElementById("expense-form").reset();
  document.getElementById("expense-date").value = new Date()
    .toISOString()
    .split("T")[0];

  // Clear calculation results
  document.getElementById("calculation-result").classList.add("hidden");
  document.getElementById("calculation-preview").classList.add("hidden");
  delete amountInput.dataset.calculatedValue;

  // Show success message
  showToast(`Added ₹${amount.toFixed(2)} for ${description}!`);

  // Update all displays
  updateStats();
  updateDashboard();
  updateBudgetProgress();
  updateCategoryUsage();
}

function deleteExpense(expenseId) {
  if (confirm("Are you sure you want to delete this expense?")) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense) {
      // Add the amount back to account balance
      accountBalance += expense.amount;
      saveToLocalStorage("accountBalance", accountBalance);
      updateAccountBalance();
    }

    expenses = expenses.filter((expense) => expense.id !== expenseId);
    saveToLocalStorage("expenses", expenses);

    updateStats();
    updateDashboard();
    updateBudgetProgress();
    updateCategoryUsage();

    showToast("Expense deleted and amount refunded to balance!");
  }
}

// Statistics Updates
function updateStats() {
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

  const todayExpenses = expenses.filter((e) => e.date === today);
  const weekExpenses = expenses.filter((e) => e.date >= weekAgo);
  const monthExpenses = expenses.filter((e) => e.date >= monthStart);

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  document.getElementById("today-total").textContent = `₹${todayTotal.toFixed(
    2
  )}`;
  document.getElementById("week-total").textContent = `₹${weekTotal.toFixed(
    2
  )}`;
  document.getElementById("month-total").textContent = `₹${monthTotal.toFixed(
    2
  )}`;
}

// Dashboard Updates
function updateDashboard() {
  updateRecentExpenses();
  updateCharts();
}

function updateRecentExpenses() {
  const container = document.getElementById("recent-expenses");

  if (expenses.length === 0) {
    container.innerHTML = `
            <div class="text-center text-white/70 py-8">
                <div class="text-4xl mb-4 animate-bounce">📱</div>
                <p>Add some expenses to see your dashboard come to life!</p>
            </div>
        `;
    return;
  }

  const recent = expenses.slice(-5).reverse();
  container.innerHTML = recent
    .map(
      (expense) => `
        <div class="bg-white/10 rounded-xl p-4 card-hover animate-slide-in">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-white font-semibold">${
                      expense.category
                    } - ₹${expense.amount.toFixed(2)}</div>
                    <div class="text-white/70">${expense.description}</div>
                    <div class="text-white/50 text-sm">${formatDate(
                      expense.date
                    )}</div>
                </div>
                <button onclick="deleteExpense(${
                  expense.id
                })" class="text-red-400 hover:text-red-300 transition-colors">
                    🗑️
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// Chart Management
function updateCharts() {
  updateCategoryChart();
  updateTrendChart();
}

function updateCategoryChart() {
  const categoryData = {};
  expenses.forEach((expense) => {
    const category = expense.category.split(" ")[1] || expense.category; // Remove emoji for cleaner display
    categoryData[category] = (categoryData[category] || 0) + expense.amount;
  });

  const ctx = document.getElementById("categoryChart").getContext("2d");
  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryData),
      datasets: [
        {
          data: Object.values(categoryData),
          backgroundColor: [
            "#667eea",
            "#764ba2",
            "#f093fb",
            "#f5576c",
            "#4facfe",
            "#00f2fe",
            "#43e97b",
            "#38f9d7",
          ],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "white",
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ": ₹" + context.parsed.toFixed(2);
            },
          },
        },
      },
    },
  });
}

function updateTrendChart() {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dayExpenses = expenses.filter((e) => e.date === date);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    last7Days.push({ date, total });
  }

  const ctx = document.getElementById("trendChart").getContext("2d");
  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: last7Days.map((d) => formatDateShort(d.date)),
      datasets: [
        {
          label: "Daily Spending",
          data: last7Days.map((d) => d.total),
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "white",
            callback: function (value) {
              return "₹" + value;
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          ticks: { color: "white" },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: { color: "white" },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return "Spending: ₹" + context.parsed.y.toFixed(2);
            },
          },
        },
      },
    },
  });
}

// Budget Management
function updateBudgetControls() {
  const container = document.getElementById("budget-controls");
  container.innerHTML = categories
    .map(
      (category) => `
    <div class="space-y-2">
        <label class="text-white font-semibold">${category.name}</label>
        <input type="number" value="${
          budgets[category.name] || category.budget
        }" min="0" step="100" 
            onchange="updateBudget('${category.name}', this.value)"
            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300">
    </div>
  `
    )
    .join("");
}

function updateBudget(category, value) {
  budgets[category] = parseFloat(value) || 0;
  saveToLocalStorage("budgets", budgets);
  updateBudgetProgress();
  showToast(`Budget updated for ${category}!`);
}

function updateBudgetProgress() {
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

  const container = document.getElementById("budget-progress");
  container.innerHTML = categories
    .map((category) => {
      const budget = budgets[category.name] || category.budget;
      const spent = spending[category.name] || 0;
      const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const remaining = Math.max(budget - spent, 0);

      let color = "#28a745";
      let status = "On track";
      if (percentage >= 100) {
        color = "#dc3545";
        status = "Over budget!";
      } else if (percentage >= 90) {
        color = "#dc3545";
        status = "Almost over!";
      } else if (percentage >= 70) {
        color = "#ffc107";
        status = "Watch out";
      }

      return `
        <div class="space-y-2 animate-slide-in">
            <div class="flex justify-between text-white">
                <span class="font-semibold">${category.name}</span>
                <span class="text-sm">${status}</span>
            </div>
            <div class="flex justify-between text-white/90 text-sm">
                <span>₹${spent.toFixed(2)} / ₹${budget.toFixed(2)}</span>
                <span>${percentage.toFixed(1)}%</span>
            </div>
            <div class="bg-white/20 rounded-full h-3 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-out"
                    style="width: ${percentage}%; background-color: ${color}"></div>
            </div>
            <div class="text-white/70 text-sm">Remaining: ₹${remaining.toFixed(
              2
            )}</div>
        </div>
    `;
    })
    .join("");
}

// Goals Management
function updateGoalSettings() {
  savingsGoal.name = document.getElementById("goal-name").value || "My Goal";
  savingsGoal.target =
    parseFloat(document.getElementById("goal-target").value) || 1000;
  saveToLocalStorage("savingsGoal", savingsGoal);
  updateGoalProgress();
}

function addToGoal() {
  const addAmount = parseFloat(document.getElementById("add-savings").value);

  if (!addAmount || addAmount <= 0) {
    showToast("Please enter a valid amount to add!", "error");
    return;
  }

  savingsGoal.saved += addAmount;
  saveToLocalStorage("savingsGoal", savingsGoal);

  document.getElementById("add-savings").value = "";
  updateGoalProgress();
  showToast(`Added ₹${addAmount.toFixed(2)} to your goal!`);
}

function updateGoalProgress() {
  const percentage =
    savingsGoal.target > 0
      ? Math.min((savingsGoal.saved / savingsGoal.target) * 100, 100)
      : 0;
  const remaining = Math.max(savingsGoal.target - savingsGoal.saved, 0);

  // Update progress circle
  const circumference = 2 * Math.PI * 40; // radius = 40
  const offset = circumference - (percentage / 100) * circumference;

  const progressCircle = document.getElementById("progress-circle");
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = offset;
  }

  // Update text displays
  document.getElementById("progress-percentage").textContent = `${Math.round(
    percentage
  )}%`;
  document.getElementById(
    "savings-amount"
  ).textContent = `₹${savingsGoal.saved.toFixed(2)}`;
  document.getElementById(
    "remaining-amount"
  ).textContent = `₹${remaining.toFixed(2)} to go`;

  // Update input values
  document.getElementById("goal-name").value = savingsGoal.name;
  document.getElementById("goal-target").value = savingsGoal.target;
}

// Category Management
function populateCategoriesDropdown() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function openCategoryModal() {
  const modal = document.getElementById("category-modal");
  modal.classList.remove("hidden");
  modal.classList.add("modal-show");

  // Clear form
  document.getElementById("category-form").reset();
  document.getElementById("new-category-budget").value = "2000";

  // Focus on name input
  setTimeout(() => {
    document.getElementById("new-category-name").focus();
  }, 100);
}

function closeCategoryModal() {
  const modal = document.getElementById("category-modal");
  modal.classList.add("modal-hide");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-show", "modal-hide");
  }, 300);
}

function handleCategorySubmission(e) {
  e.preventDefault();

  const name = document.getElementById("new-category-name").value.trim();
  const emoji =
    document.getElementById("new-category-emoji").value.trim() || "📦";
  const budget =
    parseFloat(document.getElementById("new-category-budget").value) || 2000;

  if (!name) {
    showToast("Please enter a category name!", "error");
    return;
  }

  const fullName = `${emoji} ${name}`;

  // Check if category already exists
  if (
    categories.some((cat) => cat.name.toLowerCase() === fullName.toLowerCase())
  ) {
    showToast("Category already exists!", "error");
    return;
  }

  // Add new category
  const newCategory = { name: fullName, budget: budget };
  categories.push(newCategory);
  budgets[fullName] = budget;

  // Save to localStorage
  saveToLocalStorage("categories", categories);
  saveToLocalStorage("budgets", budgets);

  // Update UI
  populateCategoriesDropdown();
  updateBudgetControls();
  updateBudgetProgress();
  updateCategoriesList();
  updateCategoryUsage();

  // Close modal and show success
  closeCategoryModal();
  showToast(`Category "${fullName}" created successfully!`);
}

function deleteCategory(categoryName) {
  // Check if category is being used in expenses
  const isUsed = expenses.some((expense) => expense.category === categoryName);

  if (isUsed) {
    if (
      !confirm(
        `Category "${categoryName}" is being used in your expenses. Deleting it will not affect existing expenses, but you won't be able to add new expenses in this category. Are you sure you want to delete it?`
      )
    ) {
      return;
    }
  } else {
    if (
      !confirm(
        `Are you sure you want to delete the category "${categoryName}"?`
      )
    ) {
      return;
    }
  }

  // Remove from categories and budgets
  categories = categories.filter((cat) => cat.name !== categoryName);
  delete budgets[categoryName];

  // Save to localStorage
  saveToLocalStorage("categories", categories);
  saveToLocalStorage("budgets", budgets);

  // Update UI
  populateCategoriesDropdown();
  updateBudgetControls();
  updateBudgetProgress();
  updateCategoriesList();
  updateCategoryUsage();

  showToast(`Category "${categoryName}" deleted successfully!`);
}

function updateCategoriesList() {
  const container = document.getElementById("categories-list");

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="text-center text-white/70 py-8">
        <div class="text-4xl mb-4">🏷️</div>
        <p>No categories yet. Create your first category!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => `
    <div class="category-item bg-white/10 rounded-xl p-4 flex justify-between items-center">
      <div>
        <div class="text-white font-semibold">${category.name}</div>
        <div class="text-white/70 text-sm">Budget: ₹${category.budget.toFixed(
          2
        )}</div>
      </div>
      <button onclick="deleteCategory('${category.name}')" 
        class="category-delete-btn text-red-400 hover:text-red-300 transition-all duration-300 p-2 rounded-lg hover:bg-red-500/20"
        title="Delete category">
        🗑️
      </button>
    </div>
  `
    )
    .join("");
}

function updateCategoryUsage() {
  const container = document.getElementById("category-usage");

  // Calculate usage stats
  const categoryStats = {};
  categories.forEach((cat) => {
    categoryStats[cat.name] = {
      count: 0,
      total: 0,
      name: cat.name,
    };
  });

  expenses.forEach((expense) => {
    if (categoryStats[expense.category]) {
      categoryStats[expense.category].count++;
      categoryStats[expense.category].total += expense.amount;
    }
  });

  // Sort by usage (total amount)
  const sortedStats = Object.values(categoryStats).sort(
    (a, b) => b.total - a.total
  );

  if (
    sortedStats.length === 0 ||
    sortedStats.every((stat) => stat.count === 0)
  ) {
    container.innerHTML = `
      <div class="text-center text-white/70 py-8">
        <div class="text-4xl mb-4">📊</div>
        <p>Add some expenses to see category usage stats!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sortedStats
    .map(
      (stat) => `
    <div class="bg-white/10 rounded-xl p-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-white font-semibold">${stat.name}</span>
        <span class="text-white/70 text-sm">${stat.count} expenses</span>
      </div>
      <div class="text-white text-lg font-bold">₹${stat.total.toFixed(2)}</div>
      <div class="text-white/70 text-sm">
        ${
          stat.count > 0
            ? `Avg: ₹${(stat.total / stat.count).toFixed(2)}`
            : "No expenses yet"
        }
      </div>
    </div>
  `
    )
    .join("");
}

// Utility Functions
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    showToast("Error saving data!", "error");
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const messageElement = document.getElementById("toast-message");

  messageElement.textContent = message;

  // Update toast styling based on type
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg transform transition-transform duration-300 ${
    type === "error" ? "bg-red-500" : "bg-green-500"
  } text-white`;

  // Show toast
  toast.classList.add("toast-show");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("toast-show");
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

// Export/Import Functions (for future use)
function exportData() {
  const data = {
    expenses,
    budgets,
    categories,
    savingsGoal,
    accountBalance,
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `spending-tracker-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Data exported successfully!");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.expenses) expenses = data.expenses;
      if (data.budgets) budgets = data.budgets;
      if (data.categories) categories = data.categories;
      if (data.savingsGoal) savingsGoal = data.savingsGoal;
      if (data.accountBalance !== undefined)
        accountBalance = data.accountBalance;

      // Save to localStorage
      saveToLocalStorage("expenses", expenses);
      saveToLocalStorage("budgets", budgets);
      saveToLocalStorage("categories", categories);
      saveToLocalStorage("savingsGoal", savingsGoal);
      saveToLocalStorage("accountBalance", accountBalance);

      // Update all displays
      populateCategoriesDropdown();
      updateStats();
      updateAccountBalance();
      updateDashboard();
      updateBudgetControls();
      updateBudgetProgress();
      updateGoalProgress();
      updateCategoriesList();
      updateCategoryUsage();

      showToast("Data imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      showToast("Error importing data!", "error");
    }
  };
  reader.readAsText(file);
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + 1-5 for tab switching
  if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "5") {
    e.preventDefault();
    const tabs = ["quick-add", "dashboard", "budget", "goals", "categories"];
    showTab(tabs[parseInt(e.key) - 1]);
  }

  // Escape to clear form or close modal
  if (e.key === "Escape") {
    const modal = document.getElementById("category-modal");
    if (!modal.classList.contains("hidden")) {
      closeCategoryModal();
    } else {
      document.getElementById("expense-form").reset();
      document.getElementById("expense-date").value = new Date()
        .toISOString()
        .split("T")[0];

      // Clear calculation results
      document.getElementById("calculation-result").classList.add("hidden");
      document.getElementById("calculation-preview").classList.add("hidden");
      delete document.getElementById("amount").dataset.calculatedValue;
    }
  }

  // Ctrl/Cmd + N to open category modal
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    openCategoryModal();
  }
});

// Service Worker Registration (for future PWA support)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").then(function (registration) {
      console.log("SW registered: ", registration);
    });
  });
}
