// =============================================================
// js/auth.js — Authentication Module
// =============================================================
// Handles: Login, Register, Logout, Auth-state observation
// Depends on: js/firebase.js (must load first)
// =============================================================

const Auth = (() => {
  const auth = window.firebaseAuth;

  // ── Friendly error messages ──────────────────────────────────
  function friendlyError(code) {
    const map = {
      "auth/user-not-found":        "No account found with this email.",
      "auth/wrong-password":        "Incorrect password. Please try again.",
      "auth/invalid-credential":    "Invalid email or password.",
      "auth/email-already-in-use":  "An account already exists with this email.",
      "auth/weak-password":         "Password must be at least 6 characters.",
      "auth/invalid-email":         "Please enter a valid email address.",
      "auth/too-many-requests":     "Too many failed attempts. Try again later.",
      "auth/network-request-failed":"Network error — check your connection.",
      "auth/popup-closed-by-user":  "Sign-in cancelled.",
    };
    return map[code] || "An unexpected error occurred. Please try again.";
  }

  // ── Sign in with email + password ───────────────────────────
  async function login(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (err) {
      console.error("[Auth] Login error:", err.code);
      return { success: false, error: friendlyError(err.code) };
    }
  }

  // ── Create new account ──────────────────────────────────────
  async function register(email, password, displayName) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      if (displayName) {
        await result.user.updateProfile({ displayName });
      }
      return { success: true, user: result.user };
    } catch (err) {
      console.error("[Auth] Register error:", err.code);
      return { success: false, error: friendlyError(err.code) };
    }
  }

  // ── Sign out ─────────────────────────────────────────────────
  async function logout() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (err) {
      console.error("[Auth] Logout error:", err);
      return { success: false, error: err.message };
    }
  }

  // ── Get current signed-in user (or null) ────────────────────
  function getCurrentUser() {
    return auth.currentUser;
  }

  // ── Subscribe to auth state changes ─────────────────────────
  // Returns an unsubscribe function
  function onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
  }

  return { login, register, logout, getCurrentUser, onAuthStateChange };
})();

window.Auth = Auth;
console.log("[Auth] Module loaded ✓");
