export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatApiRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatApiResponse {
  message: string;
  error?: string;
}
