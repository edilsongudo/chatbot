const API_BASE_URL = "https://stagingapi.supersparks.io/ai"

/**
 * Handles API response and checks for errors
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text()
    console.error("API Error Response:", text)
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json()
  } else {
    const text = await response.text()
    console.error("Unexpected API Response:", text)
    throw new Error("API returned a non-JSON response")
  }
}

/**
 * Creates a new chat session and returns the session_id
 */
export async function createChatSession() {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/create/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return handleResponse(response)
  } catch (error) {
    console.error("Error creating chat session:", error)
    throw error
  }
}

/**
 * Sends a message to the chatbot and handles streaming responses
 */
export async function sendMessage(sessionId: string, message: string, onChunk?: (chunk: string) => void) {
  if (!sessionId) {
    throw new Error("Missing session_id - Cannot send message without a valid session")
  }

  try {
    console.log(`Sending message to session ${sessionId}:`, message)

    const response = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("API Error Response:", text)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")

    // Check if response is a stream (text/event-stream)
    if (
      contentType &&
      (contentType.includes("text/event-stream") || contentType.includes("application/octet-stream"))
    ) {
      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        console.log("Received chunk:", chunk)

        // Parse SSE format (data: {"response": "text"})
        const matches = chunk.matchAll(/data: (.*?)(?:\n\n|$)/gs)
        for (const match of matches) {
          try {
            if (match[1]) {
              const jsonData = JSON.parse(match[1])
              if (jsonData.response) {
                fullResponse += jsonData.response
                if (onChunk) {
                  onChunk(jsonData.response)
                }
              }
            }
          } catch (e) {
            console.warn("Failed to parse chunk as JSON:", match[1], e)
          }
        }
      }

      return { response: fullResponse }
    } else if (contentType && contentType.indexOf("application/json") !== -1) {
      // Handle JSON response
      return response.json()
    } else {
      // Handle other response types
      const text = await response.text()
      console.warn("Unexpected response format:", text)
      return { response: text }
    }
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

/**
 * Retrieves the chat history for a specific session
 */
export async function getChatHistory(sessionId: string) {
  try {
    console.log(`Getting chat history for session ${sessionId}`)
    const response = await fetch(`${API_BASE_URL}/history/${sessionId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error fetching chat history: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to get chat history: ${response.status} ${response.statusText}`)
    }

    const data = await handleResponse(response)
    console.log("Raw chat history response:", data)

    // Transform the data into the expected format if needed
    if (Array.isArray(data)) {
      return data.map((msg) => ({
        role: msg.role || (msg.is_user ? "user" : "assistant"),
        content: msg.content || msg.message || "",
      }))
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.messages)) {
        return data.messages.map((msg) => ({
          role: msg.role || (msg.is_user ? "user" : "assistant"),
          content: msg.content || msg.message || "",
        }))
      } else if (data.history && Array.isArray(data.history)) {
        return data.history.map((msg) => ({
          role: msg.role || (msg.is_user ? "user" : "assistant"),
          content: msg.content || msg.message || "",
        }))
      }
    }

    console.warn("Unexpected chat history format, returning empty array:", data)
    return []
  } catch (error) {
    console.error("Error getting chat history:", error)
    throw error
  }
}

/**
 * Retrieves a list of active chat sessions
 */
export async function getChatSessions() {
  try {
    console.log("Fetching chat sessions from API")
    const response = await fetch(`${API_BASE_URL}/chat_sessions/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error fetching chat sessions: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to get chat sessions: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Raw chat sessions response:", data)

    // Handle different response formats
    if (Array.isArray(data)) {
      return data.map((session) => ({
        id: session.id || session.session_id,
        title: session.title || session.name || `Chat ${(session.id || session.session_id || "").slice(0, 8)}`,
      }))
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.sessions)) {
        return {
          sessions: data.sessions.map((session) => ({
            id: session.id || session.session_id,
            title: session.title || session.name || `Chat ${(session.id || session.session_id || "").slice(0, 8)}`,
          })),
        }
      } else if (data.chat_sessions && Array.isArray(data.chat_sessions)) {
        return {
          sessions: data.chat_sessions.map((session) => ({
            id: session.id || session.session_id,
            title: session.title || session.name || `Chat ${(session.id || session.session_id || "").slice(0, 8)}`,
          })),
        }
      }
    }

    console.warn("Unexpected sessions data format, returning empty array:", data)
    return []
  } catch (error) {
    console.error("Error getting chat sessions:", error)
    // Return empty array on error to avoid UI issues
    return []
  }
}

/**
 * Deletes a chat session
 */
export async function deleteChatSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session_id - Cannot delete session without a valid ID")
  }

  try {
    console.log(`Deleting chat session ${sessionId}`)
    // Usando POST em vez de DELETE, com um parâmetro action=delete
    const response = await fetch(`${API_BASE_URL}/chat/delete/${sessionId}/`, {
      method: "POST", // Alterado de DELETE para POST
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete", // Adicionando um parâmetro de ação para indicar a intenção
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error deleting chat session: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to delete chat session: ${response.status} ${response.statusText}`)
    }

    return await handleResponse(response)
  } catch (error) {
    console.error("Error deleting chat session:", error)
    throw error
  }
}

/**
 * Deletes a chat session (alternative approach)
 */
export async function deleteChatSessionAlt(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session_id - Cannot delete session without a valid ID")
  }

  try {
    console.log(`Deleting chat session ${sessionId} (alternative method)`)
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        action: "delete_session",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error deleting chat session: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to delete chat session: ${response.status} ${response.statusText}`)
    }

    return await handleResponse(response)
  } catch (error) {
    console.error("Error deleting chat session (alternative method):", error)
    throw error
  }
}

/**
 * Edits a chat session name
 */
export async function editChatSessionName(sessionId: string, newName: string) {
  if (!sessionId) {
    throw new Error("Missing session_id - Cannot edit session without a valid ID")
  }

  if (!newName || newName.trim() === "") {
    throw new Error("Missing name - Cannot update session with an empty name")
  }

  try {
    console.log(`Editing chat session ${sessionId} name to "${newName}"`)
    const response = await fetch(`${API_BASE_URL}/chat/edit/${sessionId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newName.trim(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error editing chat session: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to edit chat session: ${response.status} ${response.statusText}`)
    }

    return await handleResponse(response)
  } catch (error) {
    console.error("Error editing chat session:", error)
    throw error
  }
}

/**
 * Edits a message and creates a new branch
 */
export async function editMessage(messageId: number, newContent: string) {
  if (!messageId) {
    throw new Error("Missing message_id - Cannot edit message without a valid ID")
  }

  if (!newContent || newContent.trim() === "") {
    throw new Error("Missing content - Cannot update message with empty content")
  }

  try {
    console.log(`Editing message ${messageId} with new content`)
    const response = await fetch(`${API_BASE_URL}/chat/edit-message/${messageId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: newContent.trim(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error editing message: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to edit message: ${response.status} ${response.statusText}`)
    }

    return await handleResponse(response)
  } catch (error) {
    console.error("Error editing message:", error)
    throw error
  }
}
