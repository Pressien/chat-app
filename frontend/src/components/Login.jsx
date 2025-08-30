import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) {
      setErr("Please enter a name");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const r = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name })
      });
      if (!r.ok) {
        const text = await r.text().catch(() => 'Login failed');
        throw new Error(text);
      }
      const data = await r.json();
      localStorage.setItem("chat_user", JSON.stringify(data));
      onLogin(data);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Welcome</h2>
        <p className="muted">Enter your name to start</p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? "Entering…" : "Enter Chat"}</button>
        {err && <div className="error">{err}</div>}
      </form>
    </div>
  );
}
