import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

let authInstance;

function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const missingConfig = Object.entries(config)
    .filter(([, value]) => !value || /^your[_-]/i.test(value))
    .map(([key]) => key);

  if (missingConfig.length) {
    throw new Error("Social sign-in is not configured yet. Add the Firebase web app settings to .env.local.");
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  authInstance = getAuth(app);
  return authInstance;
}

export function isFirebaseConfigured() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY
    && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    && import.meta.env.VITE_FIREBASE_PROJECT_ID
    && import.meta.env.VITE_FIREBASE_APP_ID
    && !/^your[_-]/i.test(import.meta.env.VITE_FIREBASE_API_KEY),
  );
}

function toSkillAIUser(user) {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "SkillAI learner",
    email: user.email || "",
    role: "Student",
    authProvider: "firebase",
  };
}

export async function signInWithEmailPassword(email, password) {
  const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return toSkillAIUser(user);
}

export async function registerWithEmailPassword({ name, email, password }) {
  const { user } = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  await updateProfile(user, { displayName: name.trim() });
  return toSkillAIUser(user);
}

export async function getFirebaseIdToken() {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error("Please sign in to your SkillAI account to use AI paper help and plan features."), {
      code: "AUTH_REQUIRED",
    });
  }
  return user.getIdToken();
}

export async function signInWithSocialProvider(providerName) {
  const auth = getFirebaseAuth();
  let provider;

  if (providerName === "google") {
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
  } else if (providerName === "microsoft") {
    provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({ prompt: "select_account" });
    provider.addScope("User.Read");
  } else if (providerName === "apple") {
    provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
  } else {
    throw new Error("That sign-in provider is not supported.");
  }

  const result = await signInWithPopup(auth, provider);
  return toSkillAIUser(result.user);
}

export async function signOutFirebaseUser() {
  await signOut(getFirebaseAuth());
}
