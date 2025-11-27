'use client';

export function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
    </div>
  );
}
