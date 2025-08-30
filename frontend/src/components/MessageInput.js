import React, { useState } from "react";

export default function MessageInput({ sendMessage, disabled }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setText("");
  };

  return (
    <form className="msg-input" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()}>Send</button>
    </form>
  );
}
