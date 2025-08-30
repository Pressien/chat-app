const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export function withAuth(token) {
  const headers = (extra = {}) => ({ Authorization: `Bearer ${token}`, ...extra });

  return {
    async login(username) {
      const r = await fetch(`${BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!r.ok) throw new Error('Login failed');
      return r.json();
    },

    async getChats() {
      const r = await fetch(`${BASE}/api/chats`, { headers: headers() });
      if (!r.ok) throw new Error('Failed to load chats');
      return r.json();
    },

    async getChatDetails(chatId) {
      const r = await fetch(`${BASE}/api/chats/${chatId}`, { headers: headers() });
      if (!r.ok) throw new Error('Failed to load chat');
      return r.json();
    },

    async getMessages(chatId, { limit = 30, before } = {}) {
      const qs = new URLSearchParams({ limit });
      if (before) qs.set('before', before);
      const r = await fetch(`${BASE}/api/chats/${chatId}/messages?${qs}`, { headers: headers() });
      if (!r.ok) throw new Error('Failed to load messages');
      return r.json();
    },

    async sendMessage(chatId, body) {
      const r = await fetch(`${BASE}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ body })
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`Send failed ${r.status} ${txt}`);
      }
      return r.json();
    }
  };
}
