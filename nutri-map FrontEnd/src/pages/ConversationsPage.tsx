import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api';
import ConversationView from '@/components/ConversationView';

type Conversation = {
  id: string;
  title?: string;
  child?: any;
  createdAt?: string;
  updatedAt?: string;
  messages?: any[];
  createdBy?: any;
};

const ConversationsPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const childId = search.get('childId') || undefined;
    const openId = search.get('openId') || undefined;

    setLoading(true);
    api.listConversations(childId ? { childId } : undefined)
      .then((data: any) => {
        setConversations(Array.isArray(data) ? data : []);
        if (openId) setSelected(openId);
      })
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-2xl font-semibold">Discussions</h2>
      <div className="flex gap-4">
        <div className="w-1/3 border rounded p-2 h-[60vh] overflow-auto">
          {loading && <div>Loading...</div>}
          {!loading && conversations.length === 0 && <div>No conversations yet.</div>}
          {conversations.map((c) => (
            <div key={c.id} className={`p-2 mb-2 rounded hover:bg-slate-50 cursor-pointer ${selected === c.id ? 'bg-slate-100' : ''}`} onClick={() => setSelected(c.id)}>
              <div className="font-medium">{c.title ?? (c.child ? `Child: ${c.child.name ?? c.child.localId}` : 'Untitled')}</div>
              <div className="text-sm text-muted-foreground">{c.createdBy?.name ?? c.createdBy?.email ?? 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">{c.messages && c.messages[0] ? c.messages[0].text.slice(0, 80) : ''}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 border rounded p-2 h-[60vh]">
          {selected ? <ConversationView conversationId={selected} /> : <div className="text-muted-foreground">Select a conversation to view messages</div>}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
