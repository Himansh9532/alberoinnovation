import { demoCredentials, skillAIUsers } from "../../../data/mockDb";

const LOCAL_ACCOUNTS_KEY = "skillai-local-accounts";
const PASSWORD_ITERATIONS = 180000;

function readLocalAccounts() {
  const serialized = window.localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  if (!serialized) return [];
  const accounts = JSON.parse(serialized);
  if (!Array.isArray(accounts)) throw new Error("Saved local accounts have an invalid format.");
  return accounts;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, salt) {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return toBase64(hash);
}

export async function registerLocalAccount({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (name.trim().length < 2) throw new Error("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
  if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
    throw new Error("Secure local account creation is unavailable in this browser.");
  }

  const accounts = readLocalAccounts();
  const emailExists = skillAIUsers.some((user) => user.email.toLowerCase() === normalizedEmail)
    || accounts.some((user) => user.email === normalizedEmail);
  if (emailExists) throw new Error("An account with this email already exists. Please sign in instead.");

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const account = {
    id: `local-${window.crypto.randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    role: "Student",
    passwordSalt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
  };
  window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  return { id: account.id, name: account.name, email: account.email, role: account.role };
}

export async function authenticateLocalAccount(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const demoAccount = skillAIUsers.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  );
  if (demoAccount) {
    const { id, name, role } = demoAccount;
    return { id, name, email: normalizedEmail, role };
  }

  const account = readLocalAccounts().find((user) => user.email === normalizedEmail);
  if (!account) return null;

  const salt = Uint8Array.from(atob(account.passwordSalt), (character) => character.charCodeAt(0));
  const passwordHash = await hashPassword(password, salt);
  if (passwordHash !== account.passwordHash) return null;
  const { id, name, role } = account;
  return { id, name, email: normalizedEmail, role };
}

export { demoCredentials };
