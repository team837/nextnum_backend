# NextNum Standalone Backend (MVC)

This is the core API for the NextNum platform, built with **Node.js** and **Express**. It follows the **Model-View-Controller (MVC)** architectural pattern and uses **Mongoose** (MongoDB) for robust data persistence.

## 🚀 Key Features

- **MVC Architecture**: Separated concerns for models, controllers, and routes.
- **NowPayments Integration**: Automated cryptocurrency payment processing (BTC, ETH, USDT, etc.).
- **Internal Wallet System**: Real-time USD balance management and transaction auditing.
- **Referral Rewards**: Automatic tracking and distribution of referral bonuses.
- **JWT Authentication**: Secure, stateless user sessions.
- **SMS Management**: Integration with virtual number providers for real-time SMS delivery.

## 🏗 Architecture Overview

- **`models/`**: Mongoose schemas for Users, Wallets, Payments, Transactions, and Virtual Numbers.
- **`controllers/`**: Business logic, including payment verification and referral calculation.
- **`routes/`**: RESTful API endpoints for all platform services.
- **`middleware/`**: Authentication protection and request logging.
- **`services/`**: External API clients (e.g., NowPayments Client).

## 📡 API Endpoints

### 🏥 Health Check
- `GET /health` - System status and database connectivity.

### 👤 User Management (`/api/users`)
- `POST /` - Register a new user.
- `POST /login` - Authenticate and receive JWT.
- `GET /profile` - Retrieve authenticated user profile (Protected).

### 💳 Payments & Wallet (`/api/payments`, `/api/wallet`)
- `POST /api/payments/nowpayments/invoice` - Generate a crypto deposit invoice.
- `POST /api/payments/nowpayments/webhook` - IPN callback for payment confirmation.
- `GET /api/wallet/balance` - Get current wallet balance.
- `GET /api/wallet/transactions` - List financial history.

### 📱 Virtual Numbers & SMS (`/api/numbers`, `/api/sms`)
- `GET /api/numbers` - Browse available virtual numbers.
- `POST /api/numbers/purchase` - Buy a number using wallet balance.
- `GET /api/sms` - Retrieve incoming messages for active numbers.

### 🤝 Referrals (`/api/referrals`)
- `GET /stats` - View referral performance and earnings.
- `GET /recent` - List recent signups via referral link.

## 🛠 Setup & Configuration

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Atlas or local instance)

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory (or use the root `.env`):

```env
DATABASE_URL="mongodb+srv://..."
PORT=5000
JWT_SECRET="your_secure_jwt_secret"
NowPayments_API_Key="your_api_key"
NowPayments_public_key="your_public_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
```

### 4. Running the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

## 📄 License
Proprietary software. All rights reserved.

