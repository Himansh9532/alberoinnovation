let authInstance;

function cleanFirebaseConfigValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function withAuthDomainGuidance(error) {
  if (error?.code !== "auth/unauthorized-domain") return error;
  const hostname = typeof window === "undefined" ? "this hostname" : window.location.hostname;
  return Object.assign(
    new Error(`Firebase sign-in is not enabled for "${hostname}". In Firebase Console, open Authentication → Settings → Authorized domains and add this hostname without the protocol or port.`),
    { code: error.code },
  );
}

async function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const config = {
    apiKey: cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    appId: cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_APP_ID),
  };
  const missingConfig = Object.entries(config)
    .filter(([, value]) => !value || /^your[_-]/i.test(value))
    .map(([key]) => key);

  if (missingConfig.length) {
    throw new Error("Social sign-in is not configured yet. Add the Firebase web app settings to .env.local.");
  }

  const [firebaseApp, firebaseAuth] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = firebaseApp.getApps().length ? firebaseApp.getApp() : firebaseApp.initializeApp(config);
  authInstance = firebaseAuth.getAuth(app);
  return authInstance;
}

export function isFirebaseConfigured() {
  const firebaseEnabled = cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_ENABLE).toLowerCase();
  const explicitDisabled = ["false", "0", "off", "no"].includes(firebaseEnabled);
  if (explicitDisabled) return false;

  const apiKey = cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_API_KEY);
  const hasConfig = Boolean(
    apiKey
    && cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
    && cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID)
    && cleanFirebaseConfigValue(import.meta.env.VITE_FIREBASE_APP_ID)
    && !/^your[_-]/i.test(apiKey),
  );

  if (!hasConfig) return false;
  if (firebaseEnabled === "true" || firebaseEnabled === "1" || firebaseEnabled === "yes" || firebaseEnabled === "on") return true;
  return import.meta.env.PROD;
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
  const [{ signInWithEmailAndPassword }, auth] = await Promise.all([
    import("firebase/auth"),
    getFirebaseAuth(),
  ]);
  try {
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toSkillAIUser(user);
  } catch (error) {
    throw withAuthDomainGuidance(error);
  }
}

export async function registerWithEmailPassword({ name, email, password }) {
  const [{ createUserWithEmailAndPassword, updateProfile }, auth] = await Promise.all([
    import("firebase/auth"),
    getFirebaseAuth(),
  ]);
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(user, { displayName: name.trim() });
    return toSkillAIUser(user);
  } catch (error) {
    throw withAuthDomainGuidance(error);
  }
}

export async function getFirebaseIdToken() {
  const auth = await getFirebaseAuth();
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
  const [{ GoogleAuthProvider, OAuthProvider, signInWithPopup }, auth] = await Promise.all([
    import("firebase/auth"),
    getFirebaseAuth(),
  ]);
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

  try {
    const result = await signInWithPopup(auth, provider);
    return toSkillAIUser(result.user);
  } catch (error) {
    throw withAuthDomainGuidance(error);
  }
}

export async function signOutFirebaseUser() {
  const [{ signOut }, auth] = await Promise.all([
    import("firebase/auth"),
    getFirebaseAuth(),
  ]);
  await signOut(auth);
}
