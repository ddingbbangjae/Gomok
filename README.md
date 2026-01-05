# Renju Gomoku (Firebase)

A two-player Renju (Gomoku with forbidden move rules for black) web app built with React, Vite, TypeScript, Tailwind CSS, and Firebase (Auth, Firestore). Supports anonymous nickname login, room creation/join, real-time board sync via Firestore `onSnapshot`, chat, match history, and winner review storage.

## Features
- Anonymous auth with nickname persistence in `users/{uid}`.
- Create or join a room; black is creator, white joins if slot is free.
- 15x15 board with Renju forbidden move checks (overline, double-three, double-four) applied to black via Firestore transactions (`runTransaction`).
- Real-time updates for board state and chat using Firestore snapshots.
- Match result storage in `matches` (publicly readable) with move list, final board, and optional winner review.
- History pages to browse all matches and detail view (no login required).
- Firestore security rules included in `firestore.rules`.

## Getting started

### Prerequisites
- Node.js 18+
- A Firebase project with Authentication (Anonymous) and Firestore enabled.

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in the project root:
   ```bash
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

### Firebase rules deploy
- Save the included `firestore.rules` to your Firebase project:
  ```bash
  firebase deploy --only firestore:rules
  ```
- Optional: use the Firebase Emulator Suite for local testing:
  ```bash
  firebase emulators:start --only firestore,auth
  ```

### Local development tips
- Rooms and board state are stored in Firestore, so refreshing the page preserves progress.
- Transactions prevent simultaneous moves. If a forbidden move is attempted (black overline/33/44), the transaction rejects.
- Matches are written when a room ends; match reading is public for `/history` routes.

### Security considerations
- Rules restrict writes to room players and chat to players only; matches are readable by everyone but writable by players.
- For stronger cheat prevention, consider moving win/draw validation and match creation to Cloud Functions and server-side checks.

## Project structure (key files)
- `src/firebase.ts`: Firebase initialization.
- `src/auth.ts`: Anonymous login and nickname persistence.
- `src/pages/*`: Landing, Lobby, Room, History, and Match detail pages.
- `src/components/Board.tsx`: Board rendering and click handling.
- `src/components/Chat.tsx`: Real-time chat UI.
- `src/components/HistoryList.tsx`: Match list view.
- `src/lib/renju.ts`: Renju forbidden move + win logic (with tests in `src/lib/renju.test.ts`).
- `firestore.rules`: Firestore security rules.

## Running tests
```bash
npm test
```

## Deployment
- You can deploy the built `dist` folder to Firebase Hosting (`firebase deploy --only hosting`) or any static host (Netlify, Vercel, etc.). Ensure environment variables are set on the hosting platform.
