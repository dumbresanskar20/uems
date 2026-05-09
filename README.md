# 🚀 UEMS — Universal Enquiry Management System

A **production-ready, multi-tenant SaaS** Enquiry Management System built with the **MERN Stack** featuring AI-powered analysis, real-time updates, Kanban pipeline, subscription management, and dynamic organization branding.

---

## ✨ Features

### 🔐 Authentication & Registration
- **Organization Self-Registration** with **Email OTP Verification** (6-digit, 10-min expiry)
- **Multi-step login**: Organization → Branch → Credentials
- **JWT + Refresh Token** system with auto-refresh
- **bcrypt** password hashing
- OTP rate limiting (max 5 attempts, 3 resends)
- Secure hashed OTP storage

### 🏢 Multi-Tenant Architecture
- **Super Admin** → manages all organizations
- **Main Organization** → manages branches, enquiries, settings
- **Branch Admin/Staff** → manages own enquiries only
- Each org gets isolated data with subscription-based branch limits

### 🤖 AI Features (OpenAI / Gemini)
- **Auto-analyze** every enquiry on creation
- **Priority prediction** (0–100 score + level)
- **Smart summaries** of enquiry content
- **Suggested follow-up actions**
- **Dashboard AI insights**

### 📋 Enquiry Management
- Unlimited enquiries on all plans
- **Dynamic form fields** via Form Builder
- Real-time search, filter, pagination
- **CSV + PDF export**
- Notes & activity tracking
- AI-powered urgency detection

### 🗂 Kanban Pipeline
- Drag-and-drop status board
- Statuses: New → Contacted → In Progress → Follow Up → Completed → Cancelled
- Real-time card updates via Socket.io

### 🔧 Form Builder
- Drag-and-drop reordering
- Default fields (Name, Email, Mobile) cannot be deleted
- Custom field types: Text, Email, Phone, Number, Textarea, Select, Radio, Checkbox, Date
- Live preview mode

### 🌿 Branch Management
- OTP-verified branch creation
- Branch-level SMTP email settings
- Branch limit enforced by subscription plan
- Upgrade prompt when limit reached

### 💳 Subscription System
- **Free Trial**: 1/7/15/30 days (configurable at registration)
- **Plans**: Starter (1 branch), Business (5 branches), Enterprise (unlimited)
- **Razorpay** + **Stripe** payment integration
- Early renewal extends from current expiry date
- Auto-expiry via daily cron job
- 7-day and 1-day reminder emails

### 📧 Email System
- **SMTP Priority**: Branch SMTP → Org SMTP → Platform SMTP
- Beautiful HTML templates with org branding
- Email types: OTP, enquiry created, enquiry completed, payment confirmation, trial expiry

### 🎨 Dynamic Branding
- After org login: shows org name, logo, favicon
- UEMS branding completely hidden
- Applied in sidebar, navbar, browser title, emails

### 🔔 Real-time Notifications
- Socket.io powered live updates
- Urgent enquiry alerts
- Subscription expiry warnings
- New enquiry notifications
- Unread count badge

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Redux Toolkit |
| Routing | React Router v6 |
| HTTP | Axios + interceptors |
| Real-time | Socket.io client |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| AI | Google Gemini / OpenAI GPT |
| Email | Nodemailer |
| Payments | Razorpay / Stripe |
| File Storage | Cloudinary / local |
| Scheduler | node-cron |
| Security | Helmet, rate-limit |

---

## 📁 Project Structure

```
uems/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   │   ├── authController.js
│   │   ├── enquiryController.js
│   │   ├── branchController.js
│   │   ├── subscriptionController.js
│   │   ├── organizationController.js
│   │   └── adminController.js
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Email, AI, cron
│   ├── utils/           # Seeder
│   ├── uploads/         # Local file storage
│   ├── server.js        # Entry point
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/  # ProtectedRoute
    │   │   └── enquiry/ # EnquiryModal, DetailModal
    │   ├── pages/       # All page components
    │   ├── store/       # Redux slices
    │   ├── services/    # API, Socket
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- (Optional) Razorpay/Stripe account for payments
- (Optional) Gemini/OpenAI API key for AI features
- (Optional) Cloudinary account for logo uploads

---

### 1. Clone & Install

```bash
# Backend
cd uems/backend
cp .env.example .env
# Fill in your .env values
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

---

### 2. Configure Environment Variables

#### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret

# Platform email (fallback for OTP and system emails)
PLATFORM_EMAIL=noreply@yourdomain.com
PLATFORM_SMTP_HOST=smtp.gmail.com
PLATFORM_SMTP_PORT=587
PLATFORM_SMTP_USER=your@gmail.com
PLATFORM_SMTP_PASS=your-app-password

# AI (choose one)
AI_PROVIDER=gemini           # or 'openai'
GEMINI_API_KEY=your-key
OPENAI_API_KEY=sk-your-key

# Payment (choose one)
PAYMENT_PROVIDER=razorpay    # or 'stripe'
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary (optional – uses local storage if not set)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Super Admin credentials
SUPER_ADMIN_EMAIL=admin@uems.io
SUPER_ADMIN_PASSWORD=SuperAdmin@123
SUPER_ADMIN_USERNAME=superadmin

FRONTEND_URL=http://localhost:5173
```

---

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- Super Admin account
- Default subscription plans (Free, Starter, Business, Enterprise)

---

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# App runs on http://localhost:5173
```

---

## 🗄 Database Collections

| Collection | Description |
|-----------|-------------|
| `admins` | Super admin accounts |
| `organizations` | Organization accounts + SMTP settings |
| `branches` | Branch accounts under organizations |
| `emailverifications` | OTP storage (auto-expires via TTL index) |
| `enquiries` | All enquiries with AI analysis |
| `formfields` | Custom form field configurations per org |
| `notifications` | Real-time notifications |
| `subscriptionplans` | Available subscription plans |
| `organizationsubscriptions` | Subscription history |
| `paymenttransactions` | Payment records |
| `activitylogs` | Audit trail |

---

## 🔌 API Reference

### Auth Endpoints
```
GET  /api/auth/organizations              # List orgs for login dropdown
GET  /api/auth/organizations/:id/branches # List branches for login
POST /api/auth/register/initiate          # Start org registration (sends OTP)
POST /api/auth/register/verify            # Verify OTP + create org account
POST /api/auth/otp/resend                 # Resend OTP
POST /api/auth/login                      # Org/branch login
POST /api/auth/admin/login                # Super admin login
POST /api/auth/refresh                    # Refresh access token
```

### Enquiry Endpoints (Protected)
```
GET    /api/enquiries                     # List enquiries (search, filter, paginate)
POST   /api/enquiries                     # Create enquiry
GET    /api/enquiries/:id                 # Get single enquiry
PUT    /api/enquiries/:id                 # Update enquiry
DELETE /api/enquiries/:id                 # Delete enquiry
POST   /api/enquiries/:id/notes           # Add note
GET    /api/enquiries/dashboard           # Dashboard statistics
GET    /api/enquiries/pipeline            # Kanban pipeline data
GET    /api/enquiries/export?format=csv   # Export CSV/PDF
```

### Branch Endpoints (Org only)
```
GET    /api/branches                      # List branches
POST   /api/branches/initiate             # Start branch creation (sends OTP)
POST   /api/branches/verify               # Verify OTP + create branch
PUT    /api/branches/:id                  # Update branch
DELETE /api/branches/:id                  # Deactivate branch
```

### Subscription Endpoints
```
GET  /api/plans                           # List all plans
GET  /api/subscription/status            # Current subscription status
POST /api/subscription/order             # Create payment order
POST /api/subscription/verify            # Verify payment + activate
```

### Organization Endpoints
```
GET  /api/org/profile                     # Get org profile
PUT  /api/org/profile                     # Update profile
PUT  /api/org/smtp                        # Update SMTP settings
POST /api/org/logo                        # Upload logo
PUT  /api/org/password                    # Change password
GET  /api/org/form-fields                 # Get form fields
PUT  /api/org/form-fields                 # Update form fields
```

### Admin Endpoints (Super Admin only)
```
GET  /api/admin/dashboard                 # Admin stats
GET  /api/admin/organizations            # List all orgs
PUT  /api/admin/organizations/:id/status  # Activate/suspend org
PUT  /api/admin/organizations/:id/subscription # Extend subscription
POST /api/admin/plans                    # Create plan
PUT  /api/admin/plans/:id                # Update plan
DELETE /api/admin/plans/:id              # Deactivate plan
```

---

## 🎨 UI Components

| Component | Description |
|-----------|-------------|
| `LoginPage` | Multi-step login with org/branch dropdowns |
| `RegisterPage` | 3-step registration with OTP verification |
| `DashboardLayout` | Sidebar + navbar with dynamic branding |
| `DashboardPage` | Stats, area chart, pie chart, AI insights |
| `EnquiriesPage` | Table with search, filter, export |
| `PipelinePage` | Drag-and-drop Kanban board |
| `FormBuilderPage` | Reorderable form field editor |
| `BranchesPage` | Branch management with OTP creation |
| `SubscriptionPage` | Plan cards + Razorpay integration |
| `SettingsPage` | General, SMTP, branding, security tabs |
| `NotificationsPage` | Grouped notification feed |
| `AdminDashboard` | Super admin org + plan management |

---

## 🔒 Security Features

- JWT with short expiry (7d) + Refresh tokens (30d)
- bcrypt password hashing (salt rounds: 12)
- OTP stored as SHA-256 hash (never plaintext)
- Helmet.js security headers
- CORS configured per domain
- Rate limiting: 20 auth req/15min, 5 OTP req/10min
- MongoDB TTL index auto-deletes expired OTPs
- Role-based access control (superadmin, organization, branch)
- Token refresh on 401 with retry

---

## 📦 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Environment
- Set `NODE_ENV=production` in backend
- Use PM2 or similar for process management
- Configure reverse proxy (Nginx) to serve frontend + proxy `/api` to backend
- Use MongoDB Atlas for database
- Set up Cloudinary for logo storage

### PM2 Example
```bash
pm2 start backend/server.js --name uems-backend
pm2 serve frontend/dist 3000 --spa --name uems-frontend
```

---

## 🧪 Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@uems.io | SuperAdmin@123 |

*Create organization accounts through the registration flow.*

---

## 📋 Subscription Plans

| Plan | Price | Branches | Trial |
|------|-------|----------|-------|
| Free Trial | ₹0 | 1 | Up to 1 month |
| Starter | ₹999/mo | 1 | — |
| Business | ₹2,499/mo | 5 | — |
| Enterprise | ₹5,999/mo | Unlimited | — |

All plans include **unlimited enquiries**.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

## 🆘 Support

- Create a GitHub issue for bugs
- Check `.env.example` files for configuration
- Ensure MongoDB Atlas IP whitelist includes your server IP
- For Gmail SMTP: use **App Passwords** (not regular password)

---

*Built with ❤️ using the MERN Stack · AI-Powered · Production Ready*
