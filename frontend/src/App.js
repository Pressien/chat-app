import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./components/Login";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import { withAuth } from "./api";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_user")) || null;
    } catch {
      return null;
    }
  });

  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);

  const api = useMemo(() => (user ? withAuth(user.token) : null), [user]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoadingChats(true);
    api.getChats()
      .then(list => {
        if (!mounted) return;
        const normalized = list.map(c => ({
          id: c.id,
          name: c.name,
          participants: c.participants || [],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=8a57ff&color=fff`,
          lastMessage: c.lastMessage,
          lastTime: c.lastTime
        }));
        setChats(normalized);
        if (!activeId && normalized.length) setActiveId(normalized[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false));
    return () => (mounted = false);
  }, [user]); // eslint-disable-line

  const handleLogin = (userObj) => {
    setUser(userObj);
    localStorage.setItem("chat_user", JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("chat_user");
    setChats([]);
    setActiveId(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const activeChat = chats.find(c => c.id === activeId) || null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Chat App</div>
        <div className="me">
          <div className="me__avatar">{user?.username?.[0]?.toUpperCase() || "U"}</div>
          <div className="me__name">{user.username}</div>
          <button className="sign-out" onClick={handleLogout}>Sign out</button>
        </div>

        <ChatList chats={chats} activeId={activeId} onSelect={setActiveId} loading={loadingChats} />
      </aside>

      <main className="main">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            user={user}
            api={api}
            refreshChats={() => {
              api.getChats().then(list => {
                const normalized = list.map(c => ({
                  id: c.id,
                  name: c.name,
                  participants: c.participants || [],
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=8a57ff&color=fff`,
                  lastMessage: c.lastMessage,
                  lastTime: c.lastTime
                }));
                setChats(normalized);
              }).catch(console.error);
            }}
          />
        ) : (
          <div className="placeholder">Select a chat to start messaging</div>
        )}
      </main>
    </div>
  );
}
