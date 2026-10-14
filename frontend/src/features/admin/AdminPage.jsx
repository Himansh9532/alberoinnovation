import { useEffect, useState } from "react";
import { LockKeyhole, LogOut, RefreshCw, Users } from "lucide-react";
import { apiUrl } from "../../services/api-client.js";

const ADMIN_TOKEN_KEY = "skillai-admin-session";

function formatBytes(bytes) {
  if (!bytes) return "0 bytes";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function readResponse(response) {
  const result = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(result.error || "The request could not be completed."), {
      code: result.code,
    });
  }
  return result;
}

export default function AdminPage() {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || "");
  const [stats, setStats] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async (sessionToken) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/stats"), {
        headers: { Accept: "application/json", Authorization: `Bearer ${sessionToken}` },
      });
      const data = await readResponse(response);
      setStats(data);
    } catch (loadError) {
      setError(loadError.message || "Admin data could not be loaded.");
      if (loadError.code === "ADMIN_AUTH_REQUIRED") {
        window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) void loadStats(token);
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await readResponse(response);
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      setPassword("");
      setToken(result.token);
    } catch (loginError) {
      setError(loginError.message || "Admin sign-in could not be completed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setStats(null);
    setPassword("");
  };

  return (
    <main className="admin-page">
      {!token ? (
        <div className="admin-login-card">
          <span className="admin-icon"><LockKeyhole size={22} /></span>
          <p className="eyebrow">Secure area</p>
          <h1>Admin login</h1>
          <p>Sign in with your separately configured administrator account.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Username</span>
              <input className="auth-input" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="auth-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"} <LockKeyhole size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div className="admin-content">
          <header className="admin-header">
            <div><p className="eyebrow">SkillAI overview</p><h1>Admin dashboard</h1><p>Account activity and stored resume text size. Resume contents are not shown here.</p></div>
            <div className="admin-actions">
              <button className="secondary-button" type="button" onClick={() => void loadStats(token)} disabled={isLoading}><RefreshCw size={16} /> Refresh</button>
              <button className="secondary-button" type="button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
            </div>
          </header>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {stats ? (
            <>
              <section className="admin-stat-grid" aria-label="Usage totals">
                <article className="admin-stat-card"><Users size={20} /><span>Total user accounts</span><strong>{stats.userCount.toLocaleString()}</strong></article>
                <article className="admin-stat-card"><RefreshCw size={20} /><span>Recorded sign-ins</span><strong>{stats.totalLogins.toLocaleString()}</strong></article>
                <article className="admin-stat-card"><LockKeyhole size={20} /><span>Resume text stored</span><strong>{formatBytes(stats.totalResumeBytes)}</strong></article>
              </section>
              <section className="admin-users">
                <div className="admin-users-heading"><div><h2>Recent user accounts</h2><p>Showing up to {stats.listedUserLimit} most recently active accounts.</p></div><span>{stats.users.length} shown</span></div>
                <div className="admin-table-scroll">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Sign-ins</th><th>Resume</th><th>Resume text size</th><th>Last login</th></tr></thead>
                    <tbody>{stats.users.map((user) => (
                      <tr key={user.uid}>
                        <td>{user.name}</td><td>{user.email || "—"}</td><td>{user.loginCount.toLocaleString()}</td>
                        <td>{user.resumePresent ? "Saved" : "Not saved"}</td><td>{formatBytes(user.resumeBytes)}</td>
                        <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!stats.users.length && <p className="admin-empty">No user profiles have been recorded yet.</p>}
                </div>
              </section>
            </>
          ) : !error ? <p role="status">Loading admin data...</p> : null}
        </div>
      )}
    </main>
  );
}
