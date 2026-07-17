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

- **React 18** + **TypeScript** — component-based UI
- **Vite** — lightning-fast dev server and bundler
- **Tailwind CSS v4** + **Shadcn/ui** — design system and component library
- **Wouter** — lightweight client-side routing
- **TanStack Query** — server state management
- **React Hook Form** + **Zod** — form handling and schema validation
- **Recharts** — charts and analytics visualizations
- **Lucide React** — icon set

---

## Backend

- **Node.js** + **Express.js** + **TypeScript** — REST API server
- **PostgreSQL** (Neon serverless) — primary database
- **Prisma ORM** — type-safe database client with migrations
- **bcrypt** — password hashing
- **pnpm workspaces** — monorepo package management

---

## Authentication & Security

- **JWT** Access Tokens (8-hour expiry) + Refresh Tokens (7-day expiry)
- **Role-Based Access Control (RBAC)** — enforced server-side via JWT middleware
- **Helmet** — HTTP security headers
- **CORS** — origin-restricted
- **express-rate-limit** — brute-force protection
- **Zod** — request body validation on all endpoints

---

## API Documentation

- **Swagger / OpenAPI 3.0** — auto-generated interactive docs at `/api/docs`
- **Pino** — structured JSON request logging

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
