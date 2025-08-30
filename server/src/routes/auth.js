import { Router } from 'express';
import { supabase } from '../db.js';
import { customAlphabet } from 'nanoid';
import { httpErr } from '../util.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);
const router = Router();

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  if (!username) return httpErr(res, 400, 'username required');

  // find user
  let { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .limit(1);
  if (error) return httpErr(res, 500, error.message);

  let user = users?.[0];

  // create user if missing
  if (!user) {
    const { data, error: insErr } = await supabase
      .from('users')
      .insert({ username })
      .select('*')
      .single();
    if (insErr) return httpErr(res, 500, insErr.message);
    user = data;

    // seed demo contacts + chats so UI has content
    // seed demo contacts + chats
    const demo = ['Raina', 'Aadhya', 'Zaina', 'Deeva'];

    for (const name of demo) {
      if (name === username) continue;

      // ensure contact exists
      let { data: u2 } = await supabase.from('users').select('*').eq('username', name).limit(1);
      let contact = u2?.[0];
      if (!contact) {
        const { data: created } = await supabase.from('users').insert({ username: name }).select('*').single();
        contact = created;
      }

      // create chat and participants
      const { data: chat } = await supabase.from('chats').insert({ name }).select('*').single();
      await supabase.from('chat_participants').insert([
        { chat_id: chat.id, user_id: user.id },
        { chat_id: chat.id, user_id: contact.id }
      ]);

      // seed two messages
      await supabase.from('messages').insert([
        { chat_id: chat.id, sender_id: contact.id, body: `Hi ${username}!` },
        { chat_id: chat.id, sender_id: user.id, body: 'Hello!' }
      ]);
    }
  }

  // issue token
  const token = nanoid();
  const { error: updErr } = await supabase
    .from('users')
    .update({ token })
    .eq('id', user.id);
  if (updErr) return httpErr(res, 500, updErr.message);

  return res.json({ id: user.id, username: user.username, token });
});

export default router;
