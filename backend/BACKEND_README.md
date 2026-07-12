# AssetFlow Backend ERP

Production-ready Model-View-Controller (MVC) Backend for the AssetFlow Enterprise Asset & Resource Management System.

## Architecture

This project is built using:
- **Node.js** & **Express.js** for routing and middlewares.
- **MongoDB** & **Mongoose** for data modeling, validations, and query definitions.
- **JWT** (JSON Web Tokens) for security and state verification.
- **bcryptjs** for secure password hashing.
- **express-validator** for strictly checking request payloads.
- **Nodemailer** for email delivery with a development fallback that logs email templates to the console if SMTP configurations are absent.

All controllers are wrapped inside the `catchAsync` utility, and custom API-level errors are thrown via the `AppError` class. The custom `errorHandler.middleware.js` interceptor catches these thrown instances and returns a clean, uniform JSON structure:

```json
{
  "success": false,
  "message": "Error details..."
}
```

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory based on the `.env.example` file provided:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/assetflow
   JWT_SECRET=super_secret_jwt_sign_key_for_assetflow_erp_2026
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Start the application**:
   - For production / standard boot:
     ```bash
     npm start
     ```
   - For development auto-reload (via `nodemon`):
     ```bash
     npm run dev
     ```

## API Reference

| Method | Route | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Service status sanity check |
| `POST` | `/api/auth/signup` | None | Register a new user (default Employee role). Sends verification email. |
| `GET` | `/api/auth/verify-email/:token` | None | Verify email verification token. |
| `POST` | `/api/auth/login` | None | Login user. Returns JWT token + profile details. |
| `POST` | `/api/auth/forgot-password` | None | Generates and sends a 6-digit password reset OTP. |
| `POST` | `/api/auth/reset-password` | None | Reset password with validation of OTP. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user's profile. |
| `GET` | `/api/departments` | Authenticated | Retrieve departments list with search and pagination filters. |
| `POST` | `/api/departments` | Admin | Create a new department with cycle checking. |
| `PUT` | `/api/departments/:id` | Admin | Update department information with cycle checks. |
| `PATCH` | `/api/departments/:id/status` | Admin | Update department status (Active/Inactive). Does not cascade. |
| `GET` | `/api/asset-categories` | Authenticated | Retrieve asset categories list. |
| `POST` | `/api/asset-categories` | Admin | Create an asset category with optional custom fields. |
| `PUT` | `/api/asset-categories/:id` | Admin | Update asset category name/description/custom fields. |
| `DELETE` | `/api/asset-categories/:id` | Admin | Delete asset category (blocked if referenced by any asset). |
| `GET` | `/api/employees` | Admin, Asset Manager, Department Head | List all employee records with search & paginate. |
| `PATCH` | `/api/employees/:id/role` | Admin | **Sole location** allowed to promote/demote user roles and assign departments. |
| `PATCH` | `/api/employees/:id/status` | Admin | Update employee status (checks if head of active department). |
| `GET` | `/api/assets` | Authenticated | List all assets with search, sorting, and pagination filters. |
| `GET` | `/api/assets/:id` | Authenticated | Retrieve specific asset detail with population. |
| `GET` | `/api/assets/:id/history` | Authenticated | Retrieve asset allocation and maintenance history (placeholder). |
| `POST` | `/api/assets` | Admin, Asset Manager | Register a new asset with safe concurrent assetTag auto-generation. |
| `PUT` | `/api/assets/:id` | Admin, Asset Manager | Update asset's editable fields (status and holder are protected). |
| `DELETE` | `/api/assets/:id` | Admin, Asset Manager | Blocked (hard deletes are disallowed; status transitions should be used). |
| `POST` | `/api/allocations` | Admin, Asset Manager, Dept Head | Directly allocate an asset to an Employee or Department. |
| `POST` | `/api/allocations/:id/return` | Admin, Asset Manager, Dept Head | Process the return of an allocated asset. |
| `GET` | `/api/allocations` | Authenticated | List all active/past allocations (filterable). |
| `GET` | `/api/transfers` | Authenticated | List all transfer requests (filterable). |
| `POST` | `/api/transfers` | Authenticated | Request the transfer of an asset to a new holder. |
| `PATCH` | `/api/transfers/:id/decision` | Admin, Asset Manager, Dept Head | Approve or Reject a transfer request. |
| `GET` | `/api/bookings` | Authenticated | List all bookings with filters. |
| `POST` | `/api/bookings` | Authenticated | Book a bookable resource without time overlap. |
| `GET` | `/api/bookings/resource/:assetId` | Authenticated | Retrieve calendar data for a specific resource. |
| `GET` | `/api/bookings/my` | Authenticated | Retrieve bookings for the logged in user/department. |
| `PATCH` | `/api/bookings/:id/cancel` | Booker, Dept Head, Admin | Cancel an active booking. |
| `PATCH` | `/api/bookings/:id/reschedule` | Booker, Admin | Reschedule an upcoming booking without overlap. |
| `GET` | `/api/bookings/upcoming-reminders` | Authenticated | Retrieve candidates for upcoming reminders (for scheduler). |
| `POST` | `/api/maintenance` | Authenticated | Raise a maintenance request. |
| `PATCH` | `/api/maintenance/:id/decision` | Admin, Asset Manager | Approve or reject a maintenance request. |
| `PATCH` | `/api/maintenance/:id/start` | Admin, Asset Manager | Move maintenance request to In Progress. |
| `PATCH` | `/api/maintenance/:id/resolve` | Admin, Asset Manager | Resolve maintenance and restore asset status to Available. |
| `GET` | `/api/maintenance` | Authenticated | List maintenance requests (filtered by user/role). |
| `GET` | `/api/maintenance/asset/:assetId` | Authenticated | Retrieve chronological maintenance history for an asset. |
| `POST` | `/api/audits` | Admin, Asset Manager | Create an Audit Cycle and auto-generate checklist. |
| `GET` | `/api/audits` | Authenticated | List all audit cycles with progress summary. |
| `GET` | `/api/audits/:id/items` | Authenticated | Retrieve paginated checklist items for a cycle. |
| `PATCH` | `/api/audits/:id/items/:itemId` | Assigned Auditor, Admin | Update result (Verified/Missing/Damaged) for an audit item. |
| `GET` | `/api/audits/:id/discrepancy-report` | Authenticated | Retrieve aggregated report of Missing/Damaged items. |
| `GET` | `/api/reports/asset-utilization` | Admin, Asset Manager, Dept Head | Rank assets by allocation + booking usage frequency. |
| `GET` | `/api/reports/maintenance-frequency` | Admin, Asset Manager, Dept Head | Count maintenance requests grouped by category. |
| `GET` | `/api/reports/maintenance-due` | Admin, Asset Manager, Dept Head | Assets with no recent maintenance or nearing retirement age. |
| `GET` | `/api/reports/department-allocation-summary` | Admin, Asset Manager, Dept Head | Currently allocated assets grouped by department. |
| `GET` | `/api/reports/booking-heatmap` | Admin, Asset Manager, Dept Head | Booking counts grouped by day of week and hour of day. |
| `GET` | `/api/reports/dashboard-summary` | Admin, Asset Manager, Dept Head | Key KPI counts and lists (overdue/upcoming returns) for DashboardPage. |
| `GET` | `/api/notifications` | Authenticated | Retrieve paginated notifications for current user. |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read. |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark a single notification as read. |
| `GET` | `/api/activity-logs` | Admin, Asset Manager | Retrieve full org-wide activity audit trail. |

---

## Environment Variables Contract (`.env`)

```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/assetflow
JWT_SECRET=supersecretjwtkey_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

---

## Known Deferred Items (For Frontend / Merge Context)
- **Photo / Document File Storage**: Currently endpoints accept URL strings / paths in request bodies rather than multipart S3 or local storage binary uploads.
- **Organization Tenant Scope**: Currently scoped to a single organization database model for clean Hackathon deployment simplicity.
