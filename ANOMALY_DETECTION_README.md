# Anomaly Detection Feature Documentation

## Overview

A statistical anomaly detection system that identifies unusual spending patterns in your expense transactions using Z-score analysis.

## How It Works

### 1. **Data Grouping by Category**

The system groups all expense transactions by their category (e.g., "Food & Dining", "Transportation", "Shopping").

### 2. **Statistical Analysis per Category**

For each category with at least 3 transactions:

- **Mean (μ)**: Average spending amount
- **Standard Deviation (σ)**: Measure of spending variability
- **Z-Score**: Number of standard deviations a transaction is from the mean

### 3. **Anomaly Detection Algorithm**

```
Z-Score = (Transaction Amount - Category Mean) / Standard Deviation

If Z-Score > 2:
  → Transaction is flagged as an anomaly (statistically unusual)
```

### 4. **Detection Criteria**

- **Threshold**: Z-score > 2 (configurable)
- **Meaning**: Transaction is more than 2 standard deviations above the category average
- **Minimum Data**: Requires at least 3 transactions per category

## Features

### Visual Alert System

- **Yellow alert box** appears on Dashboard when anomalies are detected
- Shows total number of unusual transactions
- Automatically disappears when no anomalies exist

### Detailed Anomaly Information

Each flagged transaction displays:

1. **Category & Z-Score**: How unusual the transaction is
2. **Amount**: The actual spending amount (in red)
3. **Date**: When the transaction occurred
4. **Payment Method**: How it was paid
5. **Percentage Above Average**: How much higher than typical spending
6. **Description**: Transaction details
7. **Category Statistics**: Normal spending range for context

### Smart Detection

- **Skips categories with < 3 transactions** (insufficient data)
- **Handles zero variance** (all amounts same = no anomalies)
- **Sorts by severity** (highest Z-scores first)
- **No false positives** when spending is consistent

## Examples

### Example 1: Unusual Restaurant Bill

```
Category: Food & Dining
Normal spending: ₹300 (±₹50)
Unusual transaction: ₹800
Z-Score: 10.0
Result: ANOMALY DETECTED ⚠️
Reason: 166% above average
```

### Example 2: Regular Grocery Shopping

```
Category: Groceries
Normal spending: ₹2000 (±₹200)
Transaction: ₹2100
Z-Score: 0.5
Result: Normal (no alert)
Reason: Within expected range
```

### Example 3: High Variance Category

```
Category: Entertainment
Transactions: ₹100, ₹150, ₹200, ₹180, ₹5000
Z-Score for ₹5000: 2.5
Result: ANOMALY DETECTED ⚠️
Reason: Significantly higher than typical spending
```

## Benefits

### For Users

1. **Fraud Detection**: Quickly spot unauthorized transactions
2. **Budget Awareness**: Identify when you overspend in a category
3. **Spending Insights**: Understand your typical spending patterns
4. **Error Detection**: Catch duplicate or incorrect transactions

### For Data Science

1. **Statistical rigor**: Uses proven Z-score methodology
2. **Category-specific**: Compares apples to apples
3. **Adaptive**: Learns from your spending patterns
4. **Configurable**: Threshold can be adjusted (default: 2σ)

## Technical Details

### Function: `detectSpendingAnomalies(threshold = 2)`

**Parameters:**

- `threshold` (Number): Z-score threshold for anomaly detection (default: 2)

**Returns:**

```javascript
{
  anomalies: Array,          // List of flagged transactions
  categoryStats: Object,     // Statistics per category
  totalAnomalies: Number,    // Count of anomalies
  threshold: Number          // Z-score threshold used
}
```

**Anomaly Object Structure:**

```javascript
{
  id: String,                // Transaction ID
  date: String,              // Transaction date
  category: String,          // Expense category
  amount: Number,            // Transaction amount
  description: String,       // Transaction description
  paymentMethod: String,     // Payment method used
  zScore: Number,            // Calculated Z-score
  mean: Number,              // Category mean
  stdDev: Number,            // Category std deviation
  deviationAmount: Number    // Amount above mean
}
```

### Mathematical Formula

```
μ (Mean) = Σ(amounts) / n

σ (Std Dev) = √[Σ(amount - μ)² / n]

Z = (x - μ) / σ

Where:
- x = individual transaction amount
- μ = category mean
- σ = category standard deviation
- n = number of transactions
```

### Z-Score Interpretation

- **|Z| < 1**: Within normal range (68% of data)
- **1 < |Z| < 2**: Somewhat unusual (27% of data)
- **|Z| > 2**: Statistically unusual (5% of data) ⚠️
- **|Z| > 3**: Highly unusual (0.3% of data) 🚨

## Integration

### Dashboard Display

- Appears automatically between stats cards and recent transactions
- Updates in real-time when transactions are added/deleted
- No manual action required

### No Database Changes

- ✅ Uses existing transaction data
- ✅ Non-destructive analysis
- ✅ No modification to stored data
- ✅ Can be toggled on/off without affecting other features

## Testing

### To Test the Feature:

1. Add at least 3 transactions in the same category (e.g., "Food & Dining")
2. Keep amounts similar (e.g., ₹200, ₹250, ₹220)
3. Add one very high transaction (e.g., ₹1000)
4. Go to Dashboard tab
5. Yellow alert box should appear with the anomaly

### Expected Behavior:

- Categories with < 3 transactions: No analysis
- Similar amounts: No anomalies detected
- One significantly higher amount: Anomaly alert shown
- Delete anomalous transaction: Alert disappears

## Configuration

### Adjust Sensitivity:

Change the threshold parameter in the code:

**More Sensitive** (more alerts):

```javascript
this.detectSpendingAnomalies(1.5); // Z > 1.5
```

**Less Sensitive** (fewer alerts):

```javascript
this.detectSpendingAnomalies(3); // Z > 3
```

**Default** (recommended):

```javascript
this.detectSpendingAnomalies(2); // Z > 2
```

## Future Enhancements

- Time-based anomaly detection (unusual spending times)
- Anomaly trends over time
- Machine learning-based prediction
- Custom thresholds per category
- Email/SMS alerts for critical anomalies
- Anomaly patterns visualization

## Support

For questions or issues, check:

1. Browser console for errors
2. Ensure localStorage is enabled
3. Verify at least 3 transactions per category exist
4. Check that transactions are marked as "expense" type

---

**Version**: 1.0  
**Last Updated**: November 23, 2025  
**Algorithm**: Z-Score Statistical Analysis  
**Language**: JavaScript (ES6+)
