'use client';

import { Message } from '@/lib/types';
import { format } from 'date-fns';

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg">Start a conversation!</p>
        <p className="text-sm">Type a message below to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-900 rounded-bl-none'
            }`}
          >
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
            <p
              className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
              }`}
            >
              {format(message.timestamp, 'HH:mm')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
