# 🏛️ The Art Museum App

A full-stack mobile application for an Art Museum, built with **React Native (Expo)**, **Node.js (Express)**, **PostgreSQL**, and **Redis**. Features include museum exhibitions, a museum shop with a persistent cart, ticket booking, membership purchases, and Stripe checkout.

---

## 🏗️ Architecture Stack
- **Frontend:** React Native (Expo SDK 55), React Navigation (Drawer/Stack navigators), `@stripe/stripe-react-native`.
- **Backend:** Node.js, Express, `pg` (PostgreSQL), `jsonwebtoken`, `bcryptjs`, `stripe`.
- **Infrastructure:** Docker Compose (PostgreSQL, Redis).

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Expo Go app](https://expo.dev/client) installed on your iOS/Android device (or use a local emulator).

### 1. Database & Infrastructure
First, start the local PostgreSQL and Redis databases using Docker.

```bash
# In the root of the project
docker-compose up -d
```
*(Note: If you are on an Apple Silicon Mac, ensure Docker Desktop has virtualization enabled).*

### 2. Backend Setup
The backend requires a one-time database initialization script to create the schema (Users, Exhibitions, Products, Cart Items, Tickets, Memberships) and seed it with dummy museum data.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Initialize and seed the PostgreSQL database
npm run init-db

# Start the Node.js Express server
npm run dev
# Server should now be running on http://localhost:5000
```

### 3. Frontend Setup
Start the React Native Expo app. The app is configured to point its API requests to `http://10.0.2.2:5000/api` (the standard Android Emulator alias for localhost). If you are using an iOS Simulator or a physical device, you will need to change `API_URL` in the screen files to your computer's local network IP address (e.g., `http://192.168.1.100:5000/api`).

```bash
# Open a new terminal tab and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```
Press `a` to open the Android emulator, `i` to open the iOS simulator, or scan the QR code with the Expo Go app on your physical device.

---

## 🔑 Features Implemented

- **Epic 1 & 2:** JWT Authentication (Login/Register) & Drawer Navigation.
- **Epic 3 (Exhibitions):** View a feed of current museum exhibitions and detailed collections fetching data from the PostgreSQL DB.
- **Epic 4 (Shop & Cart):** A museum e-commerce shop with a persistent, database-backed user cart.
- **Epic 5 (Ticketing):** Secure ticket booking with dynamic frontend counters, native date pickers, and server-side calculation to prevent price tampering using Postgres transactions.
- **Epic 6 (Memberships):** Purchase memberships that instantly upgrade your database role to `member` and reissue a fresh JWT for immediate Role-Based Access Control (RBAC) on the frontend.
- **Epic 7 (Stripe Payments):** Integration of `@stripe/stripe-react-native` and a `/create-payment-intent` backend endpoint to process checkouts securely.

---

## ⚠️ Notes on Stripe (Epic 7)
The current implementation uses **placeholder** Stripe keys in the `backend/.env` and `frontend/screens/CheckoutScreen.js`. The `CheckoutScreen.js` includes intelligent sandbox mock logic: if it detects placeholder keys, it will gracefully bypass the real Stripe SDK and mock a successful payment so you can test the UI flow without interruptions.

To process real payments, replace the keys with your actual Stripe API keys.