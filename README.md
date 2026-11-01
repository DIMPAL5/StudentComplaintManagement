# Smart Campus 360 – Smart Campus Complaint Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)

**Smart Campus 360** is an enterprise-grade, responsive, full-stack campus facility complaint management and location intelligence web application. Designed for college mini-projects, final-year demonstrations, and real-world campus operations, it streamlines student and faculty incident reporting, automates department routing, enforces strict Service Level Agreements (SLAs), detects recurring equipment failures, and provides real-time departmental dashboards.

---

## 🏛️ System Highlights & Capabilities

- **Dual-Mode Persistence Architecture**:
  1. **Supabase PostgreSQL Mode**: Connects securely to a live Supabase backend when environment keys are provided.
  2. **Local Demonstration Mode**: Self-contained localStorage mode pre-populated with realistic university data (departments, hostels, labs, assets, complaints, timeline history). No external setup required for instant offline demonstration.
- **5 Comprehensive User Roles**:
  - 🎓 **Student**: Submit complaints with photo proof, track real-time resolution countdowns, communicate via ticket discussions, submit anonymous reports, and rate completed repairs.
  - 💼 **Faculty**: Report classroom AV and laboratory apparatus malfunctions, monitor faculty department tickets, and confirm room repairs.
  - 🔧 **Maintenance Staff**: Acknowledge work orders, transition workflow states, upload completion proof images, log internal diagnostic notes, and inspect scheduled preventive tasks.
  - 🏢 **Department Head (HOD)**: Monitor departmental technician workloads, review high-priority safety escalations, inspect SLA compliance, and analyze recurring room/asset failures.
  - 🛡️ **Administrator**: System-wide oversight, manage campus departments, configure SLA threshold policies (2h Critical to 72h Low), export filtered CSV reports, and inspect immutable audit logs.
- **Location Intelligence & Schematic Vector Map**: Interactive 2D campus vector map highlighting academic wings, research blocks, tech hostels, and real-time safety hazard pins.
- **Diagnostic Guided Complaint Assistant**: Step-by-step diagnostic questionnaire automatically determining whether an issue is an isolated defect or a widespread emergency.
- **Duplicate Ticket Detection**: Real-time detection engine searches for open issues in the same building, room, or asset to prevent redundant reports.
- **Recurring Issue Detector**: Algorithmic clustering identifies repeated failures (e.g. repeated projector ballast trips, leaking riser valves) and generates root-cause engineering advisories for HODs.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 with Vite |
| **Language** | TypeScript (Strict typing across entities and state) |
| **Styling & UI** | Tailwind CSS v4 (`@tailwindcss/vite`), Custom Dark/Light theme |
| **Icons** | Lucide React |
| **Data Visualizations** | Recharts (BarChart, PieChart, AreaChart) |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security) / LocalStorage Fallback |
| **PWA & Offline** | Web App Manifest, Service-Ready Standalone Layout |
| **Auditing & SLA** | Client-side reactive timers, automated escalation engine |

---

## 📁 Project Directory Structure

```text
smart-campus-360/
├── public/
│   ├── manifest.json              # Progressive Web App manifest
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badges.tsx         # Priority and Status visual badges
│   │   │   └── SlaCountdown.tsx   # Real-time SLA countdown timer
│   │   ├── complaints/
│   │   │   ├── CreateComplaintModal.tsx # Submission form + Wizard + Duplicate detector
│   │   │   └── ComplaintDetailsModal.tsx# Workflow timeline, comments, rating & resolution
│   │   └── layout/
│   │       ├── Header.tsx         # Top bar with demo persona switcher & notifications
│   │       └── Sidebar.tsx        # Role-based responsive navigation & SLA test trigger
│   ├── context/
│   │   ├── AuthContext.tsx        # Multi-role authentication & demo switcher
│   │   ├── ThemeContext.tsx       # Dark/light mode switcher
│   │   └── ToastContext.tsx       # Toast notifications
│   ├── data/
│   │   └── seedData.ts            # Realistic college seed data (hostels, labs, depts, assets)
│   ├── lib/
│   │   └── supabaseClient.ts      # Dual-mode Supabase client initializer
│   ├── pages/
│   │   ├── AdminManagementPage.tsx# Department management, staff roster, and SLA policy
│   │   ├── AnalyticsPage.tsx      # Recharts KPI dashboards & CSV export
│   │   ├── AssetsPage.tsx         # Campus asset registry and maintenance history
│   │   ├── AuditLogsPage.tsx      # Immutable system audit trail
│   │   ├── CampusMapPage.tsx      # Interactive 2D schematic vector map
│   │   ├── ComplaintDirectoryPage.tsx # Multi-filter complaint search & pagination
│   │   ├── DashboardPage.tsx      # Role-specific operational dashboards
│   │   ├── KnowledgeBasePage.tsx  # Self-service troubleshooting guides & FAQ
│   │   ├── LandingPage.tsx        # Modern SaaS landing page
│   │   ├── MaintenancePlannerPage.tsx # Preventive inspection scheduler
│   │   ├── ProfilePage.tsx        # User profile, password update, and data reset
│   │   └── RecurringIssuesPage.tsx# Root-cause recurring failure detector
│   ├── services/
│   │   └── dataService.ts         # Unified storage layer (Supabase / localStorage)
│   ├── types/
│   │   └── index.ts               # Core TypeScript interfaces & types
│   ├── App.tsx                    # Main app container & routing logic
│   ├── index.css                  # Tailwind styles and scrollbar overrides
│   └── main.tsx                   # React root entry point
├── supabase/
│   └── schema.sql                 # Complete PostgreSQL schema, constraints, indexes & RLS
├── .env.example                   # Environment configuration template
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later (tested on v24)
- npm v9 or later

### Step 1: Navigate to Project Directory
```bash
cd "D:\smart-campus-360"
# Or wherever your repository is cloned
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Launch Local Development Server
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:5173`**

### Step 4: Build for Production
```bash
npm run build
```

---

## 👥 Demo User Credentials (Local Demonstration Mode)

In **Local Demonstration Mode**, you can switch personas instantly using the **Role Bar** in the top navigation or log in with any of these pre-configured accounts:

| Role | Name | Email | Password | Identifier | Focus |
|---|---|---|---|---|---|
| **Student** | Alex Rivera | `student@campus.edu` | *(any or empty)* | `2023-CS-042` | Create tickets, view progress, rate service |
| **Faculty** | Prof. Priya Sharma | `faculty@campus.edu` | *(any or empty)* | `FAC-CSE-108` | Lab & AV complaints, departmental issues |
| **Staff** | Marcus Vance | `staff@campus.edu` | *(any or empty)* | `TECH-702` | Work orders, status transitions, proof upload |
| **HOD** | Dr. Evelyn Reed | `hod@campus.edu` | *(any or empty)* | `HOD-EQ-001` | Workload balancing, repeated issue reviews |
| **Admin** | Chief Admin Johnson | `admin@campus.edu` | *(any or empty)* | `ADM-SYS-001` | System configuration, SLA targets, audit logs |

> 💡 **Demo Reset**: If you wish to reset all tickets, comments, and assets back to the original demo state, click your user avatar and choose **Reset Demo Seed Data** (or navigate to **My Profile & Settings**).

---

## 🚀 Supabase PostgreSQL Backend Setup (Optional)

To connect a live cloud PostgreSQL backend:

1. Create a free account at [Supabase.com](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, open the **SQL Editor**.
3. Copy the entire contents of `supabase/schema.sql` and run the script. This creates all 14 tables, indexes, constraints, and Row Level Security (RLS) policies.
4. Go to **Project Settings > API** in Supabase and copy:
   - **Project URL**
   - **anon / public key**
5. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_CAMPUS_NAME="Apex Institute of Technology & Science"
   ```
6. Restart Vite: `npm run dev`. The application will detect the configuration and output:
   `⚡ [Smart Campus 360] Supabase backend connected successfully.`

---

## 🔄 Complete End-to-End Demonstration Workflow

You can demonstrate the complete 18-step complaint lifecycle required for viva evaluations:

1. **Student Login**: Click **Student** in the top role bar.
2. **Submit Complaint**: Click **+ New Complaint**. Enter title `Broken Classroom Projector in Room 304`.
3. **Smart Routing**: Notice the system automatically selects `Classroom Equipment` and suggests `Equipment & Labs Maintenance` with a 24-hour SLA.
4. **Duplicate Warning**: Enter `Room 304` to see how the system detects the existing Room 304 projector ticket.
5. **Confirm Submission**: Click **Confirm & Submit Complaint**. Unique code `CMP-2026-XXXX` is generated.
6. **Administrator View**: Switch role to **Admin**. The newly filed ticket appears on the dashboard with a notification.
7. **Assign Staff**: Open the ticket details, click **Assign Staff**, and choose technician `Marcus Vance`.
8. **Technician Notification**: Switch role to **Staff**. Notice the notification badge and ticket in the assigned work queue.
9. **Acknowledge & Start**: Click **Acknowledge**, then **Start Work (In Progress)**. The timeline updates.
10. **SLA Monitoring**: Inspect the live **SLA Countdown** badge showing hours and minutes remaining.
11. **Resolve Incident**: Click **Complete & Mark Resolved**. Input resolution notes: *"Replaced HDMI interface and cleaned intake thermal fan"* and upload proof.
12. **Student Review**: Switch back to **Student**. Notice the resolution alert.
13. **Rating & Confetti**: Click **Confirm Resolution & Rate**, choose 5 stars, write feedback, and submit. Confetti celebrates the completed repair!
14. **Audit Log Inspection**: Switch to **Admin** and click **System Audit Logs** to verify the full immutable audit trail.
15. **Interactive Campus Map**: Click **Campus Map** to see the building status and active hotspot markers.
16. **Recurring Issue Engine**: Navigate to **Recurring Issue Detector** to inspect clustered failures in Room 304.
17. **Analytics & CSV**: Navigate to **Analytics & Trends** to view real-time Recharts graphs and download the CSV report.

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS)**: Enforced via PostgreSQL policies in `supabase/schema.sql` ensuring students only access their own submissions and staff access authorized departmental tickets.
- **Client Key Protection**: Only the public anonymous key is used on the frontend; service role keys are never exposed.
- **Concealed Internal Notes**: Maintenance staff notes can be flagged as `Internal Staff Note`, concealing diagnostic notes from public student views.
- **Input Sanitization & File Limits**: Strict 5 MB image size limit with client-side base64/storage handling.

---

## 🚢 Deployment (Vercel / Netlify)

### Deploying to Vercel
1. Push this project to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add environment variables if using Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
7. Click **Deploy**.

---

## 📜 License & Academic Attribution
Developed as an Advanced College Mini / Final-Year Engineering Project. Open-source under the MIT License.
