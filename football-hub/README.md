# 9v9 Football Hub

A coaching web application for managing a single 9v9 football team.

---

## Phase Status

| Phase | Status | Contents |
|-------|--------|----------|
| **Phase 1** | ✅ Complete | Scaffold, Auth, Dashboard, Roster, Settings, Player shell |
| **Phase 2** | 🔜 Next | Play Designer (canvas), Formations |
| **Phase 3** | 🔜 Planned | Play Library, Game Plans, Opponents |

---

## Quick Start

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password sign-in
4. Enable **Firestore Database** (start in production mode)
5. Copy your config from: Project Settings → Your Apps → Web App

### 2. Add Your Firebase Config

Edit `js/firebase-config.js`:

```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Set Up Your Head Coach Account

In Firebase Console:
1. Go to **Authentication** → Users → Add user
2. Create the head coach email + password
3. Go to **Firestore** → Create collection `coaches`
4. Add a document with the **same UID** as the Firebase Auth user:
   ```
   Document ID: <uid from Auth>
   Fields:
     name: "Your Name"
     email: "you@email.com"
     role: "head_coach"
   ```

### 4. Apply Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 5. Deploy to Netlify

Option A — Drag and drop:
- Go to [app.netlify.com](https://app.netlify.com)
- Drag the entire `football-hub` folder onto the Netlify dashboard

Option B — Git:
- Push to GitHub, connect repo to Netlify
- Build command: *(leave empty)*
- Publish directory: `.`

### 6. Share Player Link

Players visit: `https://your-site.netlify.app/player.html`

No login required. They pick their position on first visit.

---

## File Structure

```
football-hub/
├── index.html          — Coaching interface (requires login)
├── player.html         — Player playbook (no login)
├── css/
│   ├── main.css        — Full design system
│   └── player.css      — Player-specific styles
├── js/
│   ├── app.js          — Main app shell + routing + auth
│   ├── firebase-config.js  ← PUT YOUR CONFIG HERE
│   ├── player.js       — Player interface logic
│   ├── modules/
│   │   └── utils.js    — Shared helpers, toasts, confirms
│   └── views/
│       ├── dashboard.js
│       ├── roster.js
│       ├── formations.js   (Phase 2)
│       ├── play-designer.js (Phase 2)
│       ├── play-library.js (Phase 3)
│       ├── game-plans.js   (Phase 3)
│       ├── opponents.js    (Phase 3)
│       └── settings.js
├── firestore.rules     — Security rules (paste into Firebase Console)
├── netlify.toml        — Netlify config
└── README.md
```

---

## Firestore Collections

| Collection | Description |
|------------|-------------|
| `coaches`  | Coach accounts with role (head_coach / assistant) |
| `players`  | Roster — name, jersey, position, availability |
| `formations` | Reusable formation templates |
| `plays`    | All plays with status, tags, diagram data |
| `game_plans` | Weekly game plans referencing plays |
| `opponents` | Opponent scouting info |
| `settings` | Team name, season |
