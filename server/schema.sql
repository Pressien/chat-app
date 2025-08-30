create extension if not exists pgcrypto;

create table if not exists users (
  id bigserial primary key,
  username text unique not null,
  token text,
  created_at timestamp with time zone default now()
);

create table if not exists chats (
  id bigserial primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists chat_participants (
  chat_id bigint not null references chats(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  primary key (chat_id, user_id)
);

create table if not exists messages (
  id bigserial primary key,
  chat_id bigint not null references chats(id) on delete cascade,
  sender_id bigint not null references users(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_msg_chat_created on messages(chat_id, created_at desc);
create index if not exists idx_msg_chat_id on messages(chat_id, id desc);
