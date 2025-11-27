'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ErrorMessage } from './components/ErrorMessage';
import { TypingIndicator } from './components/TypingIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Message } from '@/lib/types';

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedFromStorage = useRef(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (!hasLoadedFromStorage.current) {
      try {
        const stored = localStorage.getItem('chatMessages');
        if (stored) {
          const parsed = JSON.parse(stored);
          setMessages(parsed);
        }
      } catch (err) {
        console.error('Failed to load messages from storage:', err);
      }
      hasLoadedFromStorage.current = true;
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save messages to storage:', err);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userMessage: string) => {
    setLocalError(null);
    setIsLoading(true);

    try {
      // Add user message
      const newUserMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      // Prepare API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get response');
      }

      // Read streaming response with SSE parsing
      let assistantContent = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No response body');

      const assistantId = `msg-${Date.now() + 1}`;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              
              if (delta) {
                assistantContent += delta;

                // Update messages with streaming content
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === 'assistant' && lastMsg.id === assistantId) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: assistantContent },
                    ];
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content: assistantContent,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setLocalError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800">AI Chat Assistant</h1>
        <p className="text-center text-sm text-gray-600 mt-1">Powered by OpenRouter</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {localError ? (
          <div className="mb-4">
            <ErrorMessage
              message={localError}
              onDismiss={() => {
                setLocalError(null);
              }}
            />
          </div>
        ) : null}

        <ChatMessages messages={messages} />
        {isLoading && (
          <div className="mt-4 flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2 rounded-bl-none">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t shadow-lg">
        <ChatInput onSubmit={handleSendMessage} disabled={isLoading} />
      </footer>
    </div>
  );
}

export default function Chat() {
  return (
    <ErrorBoundary>
      <ChatContent />
    </ErrorBoundary>
  );
}
