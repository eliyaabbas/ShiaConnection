# ShiaConnection

A professional networking platform built for the Shia community. This application allows users to connect with professionals, students, and recruiters, post updates, apply for jobs, and chat in real-time.

## Tech Stack

This project is built using modern web development tools:
- **Frontend**: React 18, Vite, Tailwind CSS (with a custom "2026" glassmorphic UI)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Backend & Database**: Firebase (Auth, Firestore, Cloud Functions, Storage)

## Project Structure

The repository is structured into backend and frontend directories:

```
ShiaConnection/
├── functions/       # Firebase Cloud Functions (Node.js)
│   ├── index.js     # Cloud function definitions
│   └── package.json
├── frontend/        # React Frontend application
│   ├── src/         # UI Components, Pages, and Services
│   ├── index.html   # Entry point
│   ├── package.json 
│   ├── tailwind.config.js
│   └── vite.config.js
├── firestore.rules  # Security rules for the database
├── storage.rules    # Security rules for file uploads
├── firebase.json    # Firebase project configuration
└── ...
```

## Features Complete

- **Authentication**: JWT-based auth via Firebase, custom claims for tiered Admin routing, and a multi-step onboarding wizard.
- **Dynamic Profiles**: Users can edit their headlines, upload resumes/avatars, list experience/education, and track their profile completion strength.
- **Real-time Feed**: A global feed with live scrolling posts, atomic like counters, and inline commenting.
- **Job Board**: Recruiters can post jobs; users can search and one-click "Easy Apply".
- **Networking**: View recommended connections, send/accept connection requests.
- **Real-time Messaging**: A dedicated two-panel chat interface with live typing, unread counts, and instant message delivery.
- **Admin Dashboard**: SuperAdmins can moderate flagged content, suspend accounts, and approve/reject verified role change requests.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)
- Java (Required by Firebase Local Emulator Suite)

### 1. Start the Backend Emulators
This project is configured to run entirely locally using the Firebase Emulator Suite to avoid touching production data during development.

Make sure you are in the root directory:
```bash
# Install dependencies for Cloud Functions
cd functions
npm install
cd ..

# Start the emulators
firebase emulators:start
```
The emulators will spin up at:
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Functions: `localhost:5001`
- Emulator UI: `http://localhost:4000`

### 2. Start the Frontend
In a separate terminal, navigate to the frontend directory and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The `npm run dev` command MUST be run from inside the `/frontend/` directory, not the project root.

## Testing Admin Features

To test the Admin dashboard (`/admin`), you need the `admin` or `superAdmin` custom claim. 

You can bootstrap an admin account by writing a script, or manually setting the claim via the Firebase Emulator SDK if you create a test user. The project includes a utility script in `scripts/setupSuperAdmin.js` if configured.
