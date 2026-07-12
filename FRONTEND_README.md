# AssetFlow ERP Frontend - Integration Guide

Welcome to the frontend reference for **AssetFlow** — an Enterprise Asset & Resource Management System (ERP). This is a Vite + React + Tailwind CSS client application running against synchronized `localStorage` state simulation rules.

---

## Workspace Structure

```bash
├── README.md                      # General details
├── FRONTEND_README.md             # This file (mock-data tracking & run scripts)
├── package.json                   # Vite dependencies
├── tailwind.config.js             # Indigo/Teal corporate color palette tokens
├── index.html                     # Entry HTML header
└── src/
    ├── App.jsx                    # Root wrapper mounting AuthProviders
    ├── main.jsx                   # React bootloader script
    ├── index.css                  # Custom scrollbar, glassmorphic filters, and timings
    ├── api/
    │   └── apiClient.js           # API fetch wrapper (attaches Auth headers)
    ├── components/
    │   ├── common/                # Shared widgets (Table, Modal, Badges, Tabs, Skeletons)
    │   └── layout/                # Frames (Sidebar sidebar, Topbar bell dropdowns, layouts)
    ├── context/
    │   ├── AuthContext.jsx        # Login/Signup/Roles context
    │   └── NotificationContext.jsx# Custom toast overlay contexts
    ├── hooks/
    │   ├── useAuth.js             # Current logged-in user profile hooks
    │   ├── useFetch.js            # Standard state fetchers
    │   └── useForm.js             # General form checkers
    ├── pages/
    │   ├── auth/                  # login/register/password-reset panels
    │   ├── AllocationPage.jsx     # Radio handovers & stepper pipeline transfers
    │   ├── AssetsPage.jsx         # Views switcher, QR simulation, registration drawers
    │   ├── AuditsPage.jsx         # Verification checklists & closure triggers
    │   ├── BookingsPage.jsx       # Selector widgets, week calendars & collision checks
    │   ├── DashboardPage.jsx      # Metrics panels, returns list widgets, skeleton cards
    │   ├── LogsPage.jsx           # Notifications lists & pagination activity log trail
    │   ├── MaintenancePage.jsx    # Urgency prioritizers & status Kanban columns
    │   ├── OrgSetupPage.jsx       # Admin tabs (Dept breadcrumbs, category schema customizer)
    │   ├── ReportsPage.jsx        # Utilization charts & Day-Hour booking heatmaps
    │   └── UnauthorizedPage.jsx   # 403 authorization guard redirect cards
    └── utils/
        ├── constants.js           # Roles, statuses, priority maps
        ├── hasOverlap.js          # Booking collision logic
        └── mockDb.js              # LocalStorage synchronizers & activity logs hook
```

---

## Launch Instructions

To launch the dev server locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm run dev
   ```
   *By default, the server spins up at `http://localhost:5174/`.*

3. Verify production compile outputs:
   ```bash
   npm run build
   ```

---

## Environment Variables

When connecting the real backend, create a `.env` file at the project root carrying:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Backend Migration Registry (Mocks Checklist)

The following `// TEMP:` tags mark state points where local storage triggers must be replaced with corresponding API endpoints (`src/api/apiClient.js` fetch calls).

### 1. Asset Directory & Registration (`src/pages/AssetsPage.jsx`)
* **Line 164**: Registration submit — replace asset payload push with `POST /assets`.
* **Line 238**: Detail quick lifecycle status updates (allocate/repair/return check-in) — replace with `PATCH /assets/:tag/status`.

### 2. Allocations & Transfers (`src/pages/AllocationPage.jsx`)
* **Line 107**: Asset allocation submit — replace payload push with `POST /allocations`.
* **Line 157**: Transfer request submit — replace request queue addition with `POST /transfers`.
* **Line 196**: Approve transfer request — replace atomic update with `POST /transfers/:id/approve`.
* **Line 243**: Reject transfer request — replace with `POST /transfers/:id/reject`.
* **Line 274**: Check-in returned asset audit — replace check-in status modification with `POST /allocations/:id/return`.

### 3. Resource Bookings (`src/pages/BookingsPage.jsx`)
* **Line 128**: Reserve resource booking slot — replace overlap checks and storage push with `POST /bookings`.
* **Line 169**: Cancel booking reservation — replace with `DELETE /bookings/:id` or `POST /bookings/:id/cancel`.

### 4. Maintenance Management (`src/pages/MaintenancePage.jsx`)
* **Line 102**: Raise request ticket — replace with `POST /maintenance`.
* **Line 150**: Approve & assign technician — replace with `POST /maintenance/:id/approve`.
* **Line 204**: Reject request ticket — replace with `POST /maintenance/:id/reject`.
* **Line 222**: Start repair work — replace status check with `POST /maintenance/:id/start`.
* **Line 249**: Complete resolution summary — replace with `POST /maintenance/:id/resolve`.

### 5. Compliance Audits (`src/pages/AuditsPage.jsx`)
* **Line 133**: Create audit cycle scope — replace with `POST /audits`.
* **Line 210**: Close and lock cycle (atoms discrepancy status checks) — replace with `POST /audits/:id/close`.

### 6. Organization Setup Admin Dashboard (`src/pages/OrgSetupPage.jsx`)
* **Line 131**: Create/update department hierarchy — replace with `POST /departments` or `PUT /departments/:id`.
* **Line 168**: Toggle department active/inactive status — replace with `PATCH /departments/:id/status`.
* **Line 241**: Save Category schema properties array — replace with `POST /categories` or `PUT /categories/:id`.
* **Line 304**: Promote employee security role & department — replace with `PATCH /employees/:id/role`.
* **Line 347**: Deactivate employee access — replace with `PATCH /employees/:id/status`.
