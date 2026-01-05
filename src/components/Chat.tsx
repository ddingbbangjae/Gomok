import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  createdAt?: Date | null;
}

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function Chat({ messages, onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow p-3">
      <div className="font-semibold mb-2">Chat</div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold mr-1">{m.nickname}:</span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message"
          disabled={disabled}
        />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded" disabled={disabled}>
          Send
        </button>
      </form>
    </div>
  );
}
