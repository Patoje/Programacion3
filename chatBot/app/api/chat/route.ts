import { ChatApiRequestSchema } from '@/lib/validation';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Validate environment variables on startup
function validateEnvironment() {
  const requiredVars = ['OPENROUTER_API_KEY', 'OPENROUTER_BASE_URL'];
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export async function POST(req: Request) {
  try {
    // Validate environment variables
    validateEnvironment();

    // Parse and validate request body
    const body = await req.json();
    const validation = ChatApiRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: validation.error.issues.map((issue) => issue.message).join(', '),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages } = validation.data;

    // Make direct API call to OpenRouter
    const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTPUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-2-7b-chat',
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({
        error: 'Error processing request',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
