import { z } from 'zod';

// Message validation
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message exceeds 4000 characters'),
});

export const MessagesArraySchema = z.array(MessageSchema);

// Chat API request validation
export const ChatApiRequestSchema = z.object({
  messages: MessagesArraySchema.min(1, 'At least one message is required'),
});

// User input validation (for client-side)
export const UserInputSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(4000, 'Message exceeds 4000 characters')
  .transform((val) => val.trim());

// Type exports for easier use
export type Message = z.infer<typeof MessageSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type ChatApiRequest = z.infer<typeof ChatApiRequestSchema>;
