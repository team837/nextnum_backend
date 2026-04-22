# NextNum Backend (MVC Architecture)

This is the standalone Node.js/Express backend for the NextNum platform. It follows the **Model-View-Controller (MVC)** architectural pattern and uses **Mongoose** (MongoDB) for data persistence.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running instance)

### 2. Setup
Clone the repository and install dependencies:
```bash
cd backend
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file and fill in your credentials:
```bash
cp .env.example .env
```

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | MongoDB Connection String |
| `PORT` | Backend port (default: 5000) |
| `NowPayments_API_Key` | API Key from NowPayments dashboard |
| `NEXTAUTH_SECRET` | Secret used for JWT signing in NextAuth |

### 4. Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🏗 Architecture
- **models/**: Mongoose schemas and database models.
- **controllers/**: Business logic and request handlers.
- **routes/**: API endpoint definitions.
- **config/**: Database and service configurations.
- **services/**: External API integrations (e.g., NowPayments).

## 📡 API Health Check
You can verify the backend is running by visiting:
`http://localhost:5000/health`
