import { Router } from 'express';
import { supabase } from '../db.js';
import { httpErr } from '../util.js';

const router = Router();

async function getUserByToken(token) {
  const { data, error } = await supabase.from('users').select('*').eq('token', token).limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

// GET /api/chats/:chatId/messages?limit=30&before=messageId
router.get('/chats/:chatId/messages', async (req, res) => {
  const user = await getUserByToken(req.token);
  if (!user) return httpErr(res, 401, 'Invalid token');

  const chatId = Number(req.params.chatId);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const before = req.query.before ? Number(req.query.before) : null;

  let q = supabase
    .from('messages')
    .select('id, chat_id, sender_id, body, created_at')
    .eq('chat_id', chatId)
    .order('id', { ascending: false })
    .limit(limit);

  if (before) q = q.lt('id', before);

  const { data: rows, error } = await q;
  if (error) return httpErr(res, 500, error.message);

  const messages = (rows || []).slice().reverse();
  const nextCursor = rows?.length ? rows[rows.length - 1].id : null;
  res.json({ messages, nextCursor });
});

// GET /api/messages/:messageId
router.get('/messages/:messageId', async (req, res) => {
  const id = Number(req.params.messageId);
  const { data: m, error } = await supabase.from('messages').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') return httpErr(res, 500, error.message);
  if (!m) return httpErr(res, 404, 'Not found');
  res.json(m);
});

// POST /api/chats/:chatId/messages { body }
router.post('/chats/:chatId/messages', async (req, res) => {
  const user = await getUserByToken(req.token);
  if (!user) return httpErr(res, 401, 'Invalid token');

  const chatId = Number(req.params.chatId);
  const body = String(req.body?.body || '').trim();
  if (!body) return httpErr(res, 400, 'Message body required');

  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: user.id, body })
    .select('*')
    .single();
  if (error) return httpErr(res, 500, error.message);

  res.status(201).json(data);
});

export default router;
