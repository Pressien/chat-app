import React, { useCallback, useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";

/**
 * props:
 *  - chat: { id, name, avatar, participants }
 *  - user: { id, username, token }
 *  - api: withAuth(user.token)
 *  - refreshChats: () => refresh list
 */
export default function ChatWindow({ chat, user, api, refreshChats }) {
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef(null);

  const loadLatest = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const { messages: msgs, nextCursor: cursor } = await api.getMessages(chat.id, { limit: 30 });
      setMessages(msgs);
      setNextCursor(cursor);
      setHasMore(!!cursor);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 60);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api, chat.id]);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setNextCursor(null);
    loadLatest();
  }, [chat.id]); // eslint-disable-line

  const loadOlder = async () => {
    if (!api || !hasMore || loading) return;
    if (!messages.length) return;
    const oldest = messages[0].id;
    setLoading(true);
    try {
      const prevScroll = scrollRef.current?.scrollHeight || 0;
      const { messages: older, nextCursor: cursor } = await api.getMessages(chat.id, { limit: 30, before: oldest });
      if (!older || older.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...older, ...prev]);
        setNextCursor(cursor);
        setHasMore(!!cursor);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScroll;
        }, 60);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (el.scrollTop < 120 && !ticking) {
        ticking = true;
        loadOlder().finally(() => (ticking = false));
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages, hasMore]); // eslint-disable-line

  const sendMessage = async (text) => {
    if (!text || !api) return;
    const tmpId = `tmp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic = { id: tmpId, chat_id: chat.id, sender_id: user.id, body: text, created_at: now, _optimistic: true };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 30);

    try {
      const saved = await api.sendMessage(chat.id, text);
      setMessages(prev => prev.map(m => (m.id === tmpId ? saved : m)));
      refreshChats?.();
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(m => (m.id === tmpId ? { ...m, _error: true } : m)));
      alert("Message failed to send");
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img src={chat.avatar} alt={chat.name} className="header-avatar" />
        <div className="header-title">{chat.name}</div>
      </div>

      <div ref={scrollRef} className="messages-pane">
        {loading && <div className="loading-top">Loading…</div>}
        {messages.map(m => {
          const isMe = Number(m.sender_id) === Number(user.id);
          const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          return (
            <div key={m.id} className={`message ${isMe ? "me" : "them"}`}>
              <div className="msg-body">{m.body}</div>
              <div className="msg-meta">
                <span className="time">{time}</span>
                {m._optimistic && <span className="status">…</span>}
                {m._error && <span className="status error">failed</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <MessageInput sendMessage={sendMessage} />
      </div>
    </div>
  );
}
