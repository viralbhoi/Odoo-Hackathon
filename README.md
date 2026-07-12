# 🚛 TransitOps – Smart Transport Operations Platform

A production-grade transport operations platform that digitizes fleet management, driver management, trip dispatching, maintenance, fuel tracking, expense management, and operational analytics.

Built for a national-level hackathon with a focus on **enterprise architecture**, **backend engineering**, and **real-world business workflows**.

---

## 📌 Problem Statement

Many logistics companies still rely on spreadsheets and manual processes to manage:

- Fleet operations
- Driver assignments
- Trip scheduling
- Vehicle maintenance
- Fuel expenses
- Compliance tracking

This leads to:

- Double vehicle assignments
- Driver scheduling conflicts
- Missed maintenance
- Expired licenses
- Poor operational visibility

TransitOps centralizes the entire workflow into a single platform.

---

# ✨ Features

## 🔐 Authentication

- Email & Password Login
- Google OAuth
- JWT Authentication
- Refresh Tokens
- Role-Based Access Control (RBAC)

---

## 🚚 Fleet Management

- Register Vehicles
- Update Vehicle Details
- Vehicle Lifecycle
- Vehicle Documents
- Vehicle Status Tracking

---

## 👨‍✈️ Driver Management

- Driver Profiles
- License Management
- License Renewal
- Automatic License Expiry Detection
- Driver Suspension/Reinstatement
- Safety Scores

---

## 🚛 Trip Management

- Create Trips
- Assign Driver
- Assign Vehicle
- Dispatch Trips
- Complete Trips
- Cancel Trips

Business Rules:

- Vehicle must be available
- Driver must be available
- Driver license must be valid
- Driver must not be suspended
- Cargo weight must not exceed vehicle capacity
- Vehicle cannot be under maintenance

---

## 🔧 Maintenance

- Raise Maintenance Requests
- Complete Maintenance
- Automatic Vehicle Status Updates
- Maintenance History

---

## ⛽ Fuel Management

- Fuel Logs
- Cost Tracking
- Mileage Tracking
- Fuel Efficiency

---

## 💰 Expense Management

- Fuel Expenses
- Maintenance Costs
- Other Operational Expenses

---

## 📊 Dashboard & Analytics

- Fleet Utilization
- Vehicle ROI
- Fuel Efficiency
- Operational Cost
- Active Trips
- Maintenance Overview
- Driver Statistics

---

## 🔔 Notifications

- License Expiry Alerts
- Maintenance Alerts
- Trip Updates
- System Notifications

---

## 📜 Audit Logs

Every important system action is recorded for traceability.

---

# 👥 User Roles

## 👑 Admin

- Manage Users
- Assign Roles
- Configure System
- View Reports

---

## 🚛 Fleet Manager

- Manage Vehicles
- Manage Drivers
- Manage Trips
- Dispatch Vehicles
- Maintenance Management
- Fuel Management

---

## 🛡 Safety Officer

- Renew Driver Licenses
- Suspend Drivers
- Reinstate Drivers
- Compliance Monitoring

---

## 💰 Financial Analyst

- View Expenses
- Fuel Analytics
- Operational Reports
- ROI Analysis

---

# 🏗 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Material UI
- TanStack Query
- React Hook Form
- Zod
- Recharts

---

## Backend

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM

---

## Authentication

- JWT
- Refresh Tokens
- Google OAuth

---

## Performance

- Redis Cache

---

## Security

- Helmet
- CORS
- Rate Limiting
- Zod Validation

---

## Documentation

- Swagger (OpenAPI)

---

## Monitoring

- Pino Logger
- Sentry

---

# 📂 Project Structure

```
transitops
│
├── frontend/
│
├── backend/
│
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone <repository-url>

cd transitops
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📚 API Documentation

Swagger Documentation

```
http://localhost:5000/api/docs
```

---

# 🔒 Core Business Rules

- Vehicle registration numbers are unique.
- Drivers with expired licenses cannot be dispatched.
- Suspended drivers cannot be assigned to trips.
- Vehicles under maintenance cannot be dispatched.
- Cargo weight cannot exceed vehicle capacity.
- Completing a trip automatically updates driver and vehicle status.
- Completing maintenance automatically restores vehicle availability.
- Every critical action is recorded in Audit Logs.

---

# 🎯 Project Goals

- Enterprise-grade architecture
- Scalable backend design
- Clean REST APIs
- Strong RBAC implementation
- Business-rule-driven workflows
- Production-ready codebase
