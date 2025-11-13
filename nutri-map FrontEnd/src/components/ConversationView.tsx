import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

type Message = {
  id: string;
  text: string;
  createdAt: string;
  author: any;
};

const ConversationView = ({ conversationId }: { conversationId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.getConversationMessages(conversationId);
      setMessages(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // simple polling every 5 seconds
    pollingRef.current = window.setInterval(fetchMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    // scroll to bottom when messages update
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await api.postConversationMessage(conversationId, text.trim());
      setText('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-2">
        {loading && <div>Loading...</div>}
        {!loading && messages.length === 0 && <div className="text-sm text-muted-foreground">No messages yet.</div>}
        {messages.map((m) => (
          <div key={m.id} className="p-2 rounded border">
            <div className="text-xs text-muted-foreground">{m.author?.name ?? m.author?.email}</div>
            <div className="mt-1">{m.text}</div>
            <div className="text-xs text-right text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border p-2" placeholder="Write a message..." />
        <button onClick={handleSend} className="rounded bg-primary px-4 py-2 text-white">Send</button>
      </div>
    </div>
  );
};

export default ConversationView;
