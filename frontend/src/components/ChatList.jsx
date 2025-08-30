import React from "react";

export default function ChatList({ chats = [], activeId, onSelect, loading }) {
  return (
    <div className="chatlist">
      <div className="list-title">Chats</div>
      <div className="list-body">
        {loading && <div className="loading">Loading chats…</div>}
        {chats.map((c) => (
          <div key={c.id} className={`chat-item ${activeId === c.id ? "active" : ""}`} onClick={() => onSelect(c.id)}>
            <img src={c.avatar} alt={c.name} className="avatar" />
            <div className="meta">
              <div className="name">{c.name}</div>
              <div className="preview">{c.lastMessage || (c.participants || []).map(p => p.username).join(', ')}</div>
            </div>
          </div>
        ))}
        {!loading && chats.length === 0 && <div className="empty">No chats</div>}
      </div>
    </div>
  );
}
