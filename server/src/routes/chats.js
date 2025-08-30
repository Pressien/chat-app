import { Router } from 'express';
import { supabase } from '../db.js';
import { httpErr } from '../util.js';

const router = Router();

async function getUserByToken(token) {
  const { data, error } = await supabase.from('users').select('*').eq('token', token).limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

// GET /api/chats – list chats for current user (includes participant preview + last message)
router.get('/chats', async (req, res) => {
  const user = await getUserByToken(req.token);
  if (!user) return httpErr(res, 401, 'Invalid token');

  // 1) chat ids user participates
  const { data: cps, error: cpErr } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id);
  if (cpErr) return httpErr(res, 500, cpErr.message);

  const chatIds = (cps || []).map(c => c.chat_id);
  if (!chatIds.length) return res.json([]);

  // 2) fetch chats
  const { data: chats, error: cErr } = await supabase
    .from('chats')
    .select('id, name')
    .in('id', chatIds);
  if (cErr) return httpErr(res, 500, cErr.message);

  // 3) fetch participants for those chats in one query
  const { data: parts, error: pErr } = await supabase
    .from('chat_participants')
    .select('chat_id, users!inner(id, username)')
    .in('chat_id', chatIds);
  if (pErr) return httpErr(res, 500, pErr.message);

  const partMap = {};
  (parts || []).forEach(p => {
    if (!partMap[p.chat_id]) partMap[p.chat_id] = [];
    partMap[p.chat_id].push({ id: p.users.id, username: p.users.username });
  });

  // 4) fetch last message per chat (simple approach)
  const items = [];
  for (const c of chats) {
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('body, created_at')
      .eq('chat_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    items.push({
      id: c.id,
      name: c.name,
      participants: partMap[c.id] || [],
      lastMessage: lastMsg?.body || null,
      lastTime: lastMsg?.created_at || null
    });
  }

  items.sort((a, b) => (b.lastTime ? new Date(b.lastTime).getTime() : 0) - (a.lastTime ? new Date(a.lastTime).getTime() : 0));
  res.json(items);
});

// GET /api/chats/:chatId – details + participants
router.get('/chats/:chatId', async (req, res) => {
  const user = await getUserByToken(req.token);
  if (!user) return httpErr(res, 401, 'Invalid token');

  const chatId = Number(req.params.chatId);
  const { data: chat, error: cErr } = await supabase.from('chats').select('id, name').eq('id', chatId).single();
  if (cErr && cErr.code !== 'PGRST116') return httpErr(res, 500, cErr.message);
  if (!chat) return httpErr(res, 404, 'Chat not found');

  const { data: parts, error: pErr } = await supabase
    .from('chat_participants')
    .select('users!inner(id, username)')
    .eq('chat_id', chatId);
  if (pErr) return httpErr(res, 500, pErr.message);

  const participants = (parts || []).map(p => ({ id: p.users.id, username: p.users.username }));
  res.json({ ...chat, participants });
});

export default router;
