# Digital Spending Tracker

A modern, cloud-based personal finance management application that helps you track income and expenses with intelligent anomaly detection.

## Features

### 📊 **Financial Management**

- Track income and expenses with detailed categorization
- Real-time balance calculations
- Custom category creation for personalized organization
- Transaction history with search and filter capabilities

### ☁️ **Cloud Storage**

- Secure Firebase authentication (Email/Password)
- Real-time data synchronization across devices
- Access your financial data from anywhere
- Automatic cloud backup

### 🔍 **Anomaly Detection**

- Statistical analysis using Z-score methodology
- Automatically identifies unusual spending patterns
- Category-based detection for accurate insights
- Approve legitimate large transactions to reduce false alerts

### 📈 **Analytics & Visualization**

- Interactive charts powered by Chart.js
- Expense breakdown by category (pie charts)
- Time series analysis of spending trends
- Day-of-week spending heatmap
- **Money Runway Prediction** - Estimates when your balance will reach zero based on spending patterns
- Comprehensive financial statistics

### 🔄 **Autopay Management**

- Set up recurring monthly payments
- Track subscription and bill due dates
- Automatic expense logging on scheduled days
- Visual calendar-style date picker for selecting deduction day
- Support for "Last day of month" scheduling

### 💾 **Data Export**

- Export transactions to Excel format
- Complete transaction history backup
- Easy data portability

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Hosting**: Static web hosting (any platform)

## Anomaly Detection Algorithm

The system uses statistical Z-score analysis to detect unusual spending:

```
Z-Score = (Transaction Amount - Category Mean) / Standard Deviation

If Z-Score > 2: Transaction flagged as anomaly
```

### Detection Criteria

- **Threshold**: Z-score > 2 (statistically significant)
- **Minimum Data**: Requires at least 3 transactions per category
- **Scope**: Analyzes expenses by category for accurate detection

### How It Works

1. Groups transactions by category
2. Calculates mean and standard deviation for each category
3. Compares each transaction to category statistics
4. Flags transactions exceeding 2 standard deviations

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (free tier available)
- Basic understanding of Firebase setup

### Installation

1. **Clone or Download** the repository

2. **Set up Firebase**:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Email/Password Authentication
   - Create a Firestore Database
   - Get your Firebase configuration

3. **Configure the App**:

   - Open `index.html`
   - Replace the Firebase configuration (around line 2345) with your credentials:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```

4. **Deploy**:
   - Host on any static web server (Firebase Hosting, Netlify, Vercel, GitHub Pages, etc.)
   - Or open `index.html` directly in your browser for local use

### First Use

1. Open the application in your browser
2. Click "Create New Account"
3. Enter your email and password (minimum 6 characters)
4. Start tracking your finances!

## Usage

### Adding Transactions

1. Navigate to "Add Transaction" tab
2. Select type (Income/Expense)
3. Choose or create a category
4. Enter amount, description, and date
5. Click "Add Transaction"

### Viewing Analytics

- **Dashboard**: Overview of total income, expenses, and balance
- **Transactions**: Complete list with edit/delete options
- **Analytics**: Visual charts and spending patterns

### Managing Anomalies

- Check the Dashboard for anomaly alerts
- Review flagged transactions
- Approve legitimate large purchases to prevent future alerts
- System learns from your approval patterns

## Security

- All data is encrypted in transit (HTTPS)
- Firebase Authentication ensures secure access
- User data is isolated (each user can only access their own data)
- Firestore security rules prevent unauthorized access

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Project Structure

```
├── index.html              # Main application file
├── FIREBASE_SETUP.md      # Detailed Firebase setup guide
└── README.md              # This file
```

## Future Enhancements

- [ ] Budget setting and tracking
- [x] Recurring transaction automation (Autopay)
- [ ] Multi-currency support
- [ ] Mobile app version
- [ ] Advanced reporting features
- [ ] Category-specific spending limits
- [x] Money runway prediction (Balance depletion forecast)
- [ ] Export to PDF reports

## License

This project is available for personal and educational use.

## Support

For setup help, refer to `FIREBASE_SETUP.md` for detailed Firebase configuration instructions.

---

**Version**: 2.1  
**Last Updated**: January 2026  
**Architecture**: Single Page Application (SPA)  
**Status**: Production Ready
