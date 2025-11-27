'use client';

import { UserInputSchema } from '@/lib/validation';
import { FormEvent, useRef, useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const message = inputRef.current?.value || '';

    // Validate input
    const validation = UserInputSchema.safeParse(message);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    onSubmit(validation.data);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
          maxLength={4000}
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
