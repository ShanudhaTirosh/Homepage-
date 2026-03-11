// =============================================================
// js/firebase.js — Firebase Initialization
// =============================================================
// HOW TO SETUP:
//   1. Go to https://console.firebase.google.com
//   2. Create a new project (or use an existing one)
//   3. Go to Project Settings → Your apps → Add web app
//   4. Copy the firebaseConfig object and paste it below
//   5. Enable Authentication → Sign-in method → Email/Password
//   6. Enable Firestore Database (start in production or test mode)
// =============================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeCstYU5HacaH5lrXAI0wGgMz8hPx8npY",
  authDomain: "homepage12.firebaseapp.com",
  projectId: "homepage12",
  storageBucket: "homepage12.firebasestorage.app",
  messagingSenderId: "672210775216",
  appId: "1:672210775216:web:a01692977d67a3bf2b9f75",
  measurementId: "G-DBSTMV5Z4C"
};
// ── Initialize Firebase (compat SDK — no bundler needed) ─────
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ── Expose services globally so all modules can use them ─────
window.firebaseAuth = firebase.auth();
window.firebaseDb   = firebase.firestore();

// ── Enable offline persistence (caches layout locally) ───────
window.firebaseDb
  .enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("[Firebase] Persistence blocked: multiple tabs open.");
    } else if (err.code === "unimplemented") {
      console.warn("[Firebase] Persistence not supported in this browser.");
    }
  });

console.log("[Firebase] Initialized ✓");
