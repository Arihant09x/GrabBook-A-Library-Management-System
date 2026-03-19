# 📚 Next-Gen Library Management System

A production-grade, full-stack library management application. Built with modern web technologies to deliver a beautifully animated, secure, and intuitive experience for both readers and library administrators.

## ✨ Features

### 🔐 Advanced Authentication
- **Passwordless OTP Login:** Secure 6-digit OTP delivery powered by **Resend**.
- **Standard Email/Password:** Fully encrypted credentials with JWT session management.
- **Post-Login Escalation:** Securely upgrade a standard user account to `ADMIN` privileges via a secret invite code directly from the UI.

### 👥 User Experience (Reader)
- **Library Catalog:** Browse the entire inventory of available books featuring dynamic cover art.
- **Real-Time Stock Tracking:** See exactly how many copies are available or if a book is out of stock.
- **One-Click Borrowing:** Borrow books with an automatic 14-day return mandate.
- **My Books Dashboard:** Track your active borrowings, due dates, and return books seamlessly.

### 🛡️ Admin Experience (Librarian)
- **Role-Based Isolation:** The "My Books" interface is hidden; Admins get exclusive access to the **Admin Dashboard**.
- **Inventory Management:** Add new books (tracks total copies, ISBN, etc.) and seamlessly delete stock.
- **Borrowing Oversight:** Track *exactly* who borrowed the books you published, including checkout dates, due dates, and active statuses.
- **Automated Fine Calculations:** Automatically calculates and displays late fees for overdue borrowings (calculated at $1/day late).

### 🎨 Beautiful & Modern UI
- Fully responsive design using **Tailwind CSS**.
- Fluid entrance animations via **Framer Motion**.
- State-of-the-art background particle effects via **Magic UI**.
- Premium toast notifications via **Sonner**.
- Comprehensive form security and input validation via **Zod**.

---

## 🚀 Tech Stack

**Frontend:**
- React 18 + Vite
- TypeScript
- Tailwind CSS (Styling)
- React Query (Data Fetching & Caching)
- React Router (Routing)
- Zod (Schema & Input Validation)
- Framer Motion + Magic UI + Lucide React (UI/UX)
- Sonner (Toast notifications)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL (Database)
- Resend SDK (Email Services)
- JSON Web Tokens (JWT) & bcrypt (Security)

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
First, install the dependencies for both the frontend and backend environments.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create a `.env` file in the **backend** directory and configure the following parameters:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/library_db"

# JWT Config
JWT_SECRET="your_super_secret_jwt_key"

# Resend Email Configuration (For OTP)
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="Library <onboarding@resend.dev>"

# Admin Escalation
ADMIN_SECRET_CODE="admin123"
```

Create a `.env` file in the **frontend** directory:

```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Database Setup (Prisma)
Ensure your PostgreSQL server is running, then push the schema and generate the Prisma Client:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 4. Run the Application
You can run both environments concurrently using two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 👑 How To Login As Admin

We built a highly secure *Escalation Flow* so Admins can seamlessly register without exposing distinct admin pathways to the public interface. 

1. **Register or Login** as you normally would using Email/Password or the OTP flow.
2. Upon successful authentication, the system will temporarily pause your dashboard redirect and present you with an **Escalation Prompt**:
   > *"Success! You are authenticated. Would you like to enter a Secret Admin Code to escalate your privileges...?"*
3. Type your server's secret code (e.g., `admin@123` based on your backend `.env` file) into the **Admin Secret Code** field.
4. Click **Verify & Access Dashboard**.

The backend will instantaneously intercept this secure code, upgrade your database role from `USER` to `ADMIN`, and intelligently route you to the platform where you will now have complete access to the **Admin Panel**!
