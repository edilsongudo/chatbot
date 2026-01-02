import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

// Create an OpenAI API client with the correct configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: "https://api.proxyapi.io/openai",
})

// Set the runtime to edge for better performance
export const runtime = "edge"

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "OpenAI API key not configured",
      }),
      { status: 500 },
    )
  }

  try {
    // Extract the `messages` from the body of the request
    const { messages } = await req.json()

    // Add system message to help guide the model's responses
    const systemMessage = {
      role: "system",
      content:
        "You are Spark, a helpful and knowledgeable AI assistant. Provide clear, accurate, and engaging responses.",
    }

    // Create the completion with proper configuration
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [systemMessage, ...messages].map((message: any) => ({
        content: message.content,
        role: message.role,
      })),
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)

    // Return a StreamingTextResponse, which can be consumed by the client
    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error("[CHAT ERROR]", error)
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during your request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
