export interface Thread {
  id: string
  title: string
  lastMessage: string
  timestamp: number
}

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  threadId: string
  timestamp: number
}
