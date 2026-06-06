# VoteHub 2024 - Real-Time E-Voting Server

A real-time e-voting server built using Node.js, Express, TypeScript, Mongoose (MongoDB), Socket.io, and Cloudinary. This backend handles election management, contestant directory setup (with image uploads), and secure multi-channel voting (Quick vote, Email OTP, SMS OTP, and QR Code).

---

## Tech Stack
*   **Language:** TypeScript (v6.0)
*   **Runtime:** Node.js (v20)
*   **Framework:** Express (v5.2)
*   **Database:** MongoDB Atlas via Mongoose
*   **Real-time Communication:** Socket.io (v4.x)
*   **File Uploads:** Formidable & Cloudinary SDK
*   **Emails:** Resend SDK

---

## Project Structure
```text
server/
├── src/
│   ├── controller/      # Route handler controllers (business logic)
│   ├── db/              # Database connection configuration
│   ├── middleware/      # Custom Express middleware (e.g. formidable parser)
│   ├── model/           # Mongoose schemas & interfaces
│   ├── route/           # Express router endpoints
│   ├── utils/           # Helper integrations (Cloudinary, Email, Socket.io)
│   ├── dns-setup.ts     # DNS resolution override
│   └── index.ts         # Server entry point
├── Dockerfile           # Production container configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependency configuration
└── .env                 # Environment variables configuration
```

---

## Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js (v20+)** and **npm** installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (`.env`)
Create a `.env` file in the root directory (or update the existing one) with the following variables:
```env
MONGO_URI=your_mongodb_connection_string
PORT=3030
APP_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_resend_email
RESEND_FROM_NAME="VoteHub"
```

---

## Running the Application

### Development Mode (with live reloading)
```bash
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start
```

### Running with Docker
```bash
docker build -t evoting-server .
docker run -p 3030:3030 --env-file .env evoting-server
```

---

## API & Integration Documentation
For complete API request/response payloads, frontend integration guidelines, and Socket.io event schemas, please refer to:
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**
