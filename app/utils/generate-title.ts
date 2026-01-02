/**
 * Generates a title based on the first substantive message from the user
 * Similar to how ChatGPT names conversations
 *
 * @param message The user's message content
 * @returns A generated title for the conversation
 */
export function generateTitle(message: string): string {
  if (!message || message.trim().length === 0) {
    return "New Conversation"
  }

  // List of common greetings to ignore when they appear alone
  const commonGreetings = [
    "hello",
    "hi",
    "hey",
    "olá",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "como vai",
    "tudo bem",
    "e aí",
    "hello there",
    "greetings",
    "howdy",
  ]

  // Clean up the message
  const cleanMessage = message.trim()

  // If the message is just a greeting, use a default title
  if (commonGreetings.includes(cleanMessage.toLowerCase())) {
    return "New Conversation"
  }

  // Limit the title length to a reasonable size (50 chars)
  let title = cleanMessage
  if (title.length > 50) {
    // Try to cut at a space to avoid cutting words
    const cutIndex = title.lastIndexOf(" ", 50)
    title = title.substring(0, cutIndex > 0 ? cutIndex : 50) + "..."
  }

  // Capitalize the first letter
  return title.charAt(0).toUpperCase() + title.slice(1)
}
