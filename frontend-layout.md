# Frontend Layout Strategy

## Core Library
React (Vite or CRA) configured with TailwindCSS for rapid layout mapping.

## Directory Structure
```text
src/
├── assets/         # Global brand graphics, custom fonts
├── components/     # Agnostic structural modules
│   ├── ui/         # Base atoms (Button, Input, Modal, Toast)
│   ├── layout/     # Architecture pieces (Navbar, Sidebar, Container)
│   └── forms/      # Contextual inputs (RoleReqForm, ResumeUpload)
├── context/        # React Provider contexts (AuthContext, ThemeContext)
├── hooks/          # Abstraction wrappers (useAuth, useFirestore, useConnections)
├── pages/          # Full page compositions
│   ├── Auth/       # Signup/Login, Pass Recovery, Auth Gateway
│   ├── Admin/      # Management Views
│   ├── Feed/       # Central Timeline
│   ├── Profile/    # Self & Foreign User View
│   ├── Jobs/       # Directory & Application Portal
│   └── Network/    # Connection Graphs
├── services/       # External bounds
│   ├── firebase.js # SDK initialization and modular exports
│   ├── auth.js     # Auth facade
│   └── db.js       # Firestore query collections
├── styles/         # Reset & global utilities (index.css)
└── main.jsx        # Root injector & router configuration
```

## Screen Compositions

### 1. Persistent Navigation Layer (Header)
- **Positioning**: Sticky Top.
- **Left Region**: System Logo (Links to -> System Home).
- **Center Region**: Global Search Input (Users/Jobs).
- **Right Region (Responsive Icons/Badges)**:
  - Feed
  - Network (Badge: Connection Requests)
  - Jobs
  - Messages (Badge: Unread Count)
  - Notifications
- **Far Right**: Collapsible User Avatar Dropdown (Settings, Request Role, Logout).

### 2. Main Timeline/Feed View (`pages/Feed/`)
A structured 3-column asymmetric layout (Desktop):
- **Left Column (Context - 25%)**: 
  - Summary Profile Card (Banner, Avatar, Name, Short Bio, Active Role).
  - Snapshot Stats (Followers, Views).
- **Center Column (Substance - 50%)**:
  - Top Action Box: "Start a post..." with rich media toggles (Image, Video, Article).
  - Infinite Scroll Feed: Individual post cards tracking latest connections' content.
- **Right Column (Discovery - 25%)**:
  - Algorithmic Recommendations: "People to Connect With".
  - Spotlight: Trending Roles / Relevant job tags.

### 3. Progressive Profile View (`pages/Profile/`)
Varies dynamically based on the associated `user.role` from Firestore:
- **Hero Unit**: Cover Image, Overlay Avatar, Name, Tagline, Primary Action (Connect/Message/Edit).
- **About Modal**: High-level text.
- **Role Specific Grids**:
  - *Professional*: Traditional Employment Timeline, Authored Articles.
  - *Skilled Worker*: Visual Masonry Grid for "Portfolio" items, explicitly verified skills.
  - *Student*: Academic Pipeline tracking, Mentor Request toggle.
  - *Recruiter*: Organization details, Carousel of currently open internal job postings.

### 4. Admin Management Dashboard (`pages/Admin/`)
Isolated single-page-app layout exclusively for users where `user.token.admin == true`:
- **Structural Model**: Full-height Persistent Sidebar + Scrollable Data View.
- **Sidebar Items**: Overview, Accounts, Role Review Queue, Content Flags.
- **Primary Metrics**: Cards showing daily signups, total tickets.
- **Data Table**: Paginated rows handling pending Role Change user requests with immediate fast-action [✓ Approve] [✕ Reject] buttons.

## Responsive Targets
- **Mobile (<768px)**: Collapse left/right columns. Move Navigation to a fixed bottom tab bar for main feeds. Hamburger menu for peripheral actions.
- **Tablet (768px - 1024px)**: 2-column layout. Discovery shifts to bottom.
- **Desktop (>1024px)**: Standard 3-column layout.
