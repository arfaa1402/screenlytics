# Screenlytics — Frontend

A React + Vite app for tracking screen time and burnout score.

## Getting Started

### Prerequisites
- Node.js v18+ 
- npm v9+

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── index.html               # Vite HTML entry point
├── vite.config.js           # Vite configuration
├── package.json
├── .gitignore
└── src/
    ├── main.jsx             # React DOM entry point
    ├── App.jsx              # Root component + router
    │
    ├── context/
    │   └── AppContext.jsx   # Global state provider
    │
    ├── hooks/
    │   └── useApp.js        # Custom hook for context
    │
    ├── utils/
    │   ├── burnout.js       # Burnout score calculation
    │   ├── date.js          # Date formatting helpers
    │   └── quotes.js        # Motivational quotes by band
    │
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Navbar.module.css
    │   ├── Toast.jsx
    │   ├── Toast.module.css
    │   ├── BurnoutRing.jsx
    │   ├── BurnoutRing.module.css
    │   └── ProtectedRoute.jsx
    │
    ├── pages/
    │   ├── Landing.jsx / Landing.module.css
    │   ├── Auth.jsx    / Auth.module.css
    │   ├── Dashboard.jsx / Dashboard.module.css
    │   ├── LogTime.jsx   / LogTime.module.css
    │   ├── Analytics.jsx / Analytics.module.css
    │   ├── Awareness.jsx / Awareness.module.css
    │   ├── Planner.jsx   / Planner.module.css
    │   └── Profile.jsx   / Profile.module.css
    │
    └── styles/
        └── globals.css      # CSS variables, reset, utilities
```

## Tech Stack
- **React 18** — UI library
- **Vite 5** — Build tool & dev server
- **React Router v6** — Client-side routing
- **CSS Modules** — Scoped component styles
