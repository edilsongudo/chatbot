"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  PenSquare,
  Paperclip,
  ArrowUp,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Check,
  Copy,
  MoreHorizontal,
  Menu,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { SparkLogo } from "./components/spark-logo"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useParams } from "next/navigation"
import {
  createChatSession,
  sendMessage,
  getChatHistory,
  getChatSessions,
  deleteChatSession,
  editChatSessionName,
  editMessage,
  deleteMessage,
} from "./api/chatbot"
import { generateTitle } from "./utils/generate-title"
import { markdownToHtml } from "./utils/markdown-to-html"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserAvatar } from "./components/user-avatar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CodeHighlighter } from "./components/code-highlighter"

interface Message {
  role: "user" | "assistant"
  content: string
  id?: number
  parent_id?: number | null
  branch_id?: string
  is_edited?: boolean
}

interface ChatSession {
  id: string
  title: string
}

interface SessionsResponse {
  sessions: ChatSession[]
}

export default function ChatInterface() {
  const { toast } = useToast()
  const [sessions, setSessions] = React.useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = React.useState<string>("")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [streamingMessage, setStreamingMessage] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [thinkingStatus, setThinkingStatus] = React.useState<string | null>(null)
  const [titleSet, setTitleSet] = React.useState(false)
  const [sessionInitialized, setSessionInitialized] = React.useState(false)
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null)
  const [editingSessionTitle, setEditingSessionTitle] = React.useState("")
  const [deleteSessionId, setDeleteSessionId] = React.useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [copiedMessageIndex, setCopiedMessageIndex] = React.useState<number | null>(null)
  const [hoveredMessageIndex, setHoveredMessageIndex] = React.useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Adicione estes novos estados após os estados existentes (por volta da linha 70)
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null)
  const [editingMessageContent, setEditingMessageContent] = React.useState("")
  const [deleteMessageId, setDeleteMessageId] = React.useState<number | null>(null)
  const [isDeleteMessageDialogOpen, setIsDeleteMessageDialogOpen] = React.useState(false)

  // Add these new state variables after the existing state declarations (around line 70)
  const [currentBranchId, setCurrentBranchId] = React.useState<string | null>(null)
  const [branches, setBranches] = React.useState<{ [parentId: string]: string[] }>({})
  const [branchIndices, setBranchIndices] = React.useState<{ [branchId: string]: number }>({})
  const [messageIds, setMessageIds] = React.useState<{ [index: number]: number }>({})

  // Media queries para responsividade
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)")

  // Ajustar sidebar para estar aberta por padrão em telas maiores
  React.useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const router = useRouter()
  const params = useParams()

  // Initialize component by loading sessions and checking URL for session ID
  React.useEffect(() => {
    // Extrair o ID da sessão da URL primeiro
    const urlSessionId = window.location.pathname.split("/").pop()
    const hasSessionIdInUrl = urlSessionId && urlSessionId !== "chat"

    // Se temos um ID de sessão na URL, defina uma flag para evitar a criação automática de uma nova sessão
    if (hasSessionIdInUrl) {
      console.log("Found session ID in URL:", urlSessionId)
      setCurrentSessionId(urlSessionId)
      setSessionInitialized(true) // Impede a criação automática de uma nova sessão
    }

    // Carregue as sessões de chat
    loadChatSessions(hasSessionIdInUrl ? urlSessionId : null)
  }, [])

  // Load chat history when current session changes
  React.useEffect(() => {
    if (currentSessionId) {
      loadChatHistory(currentSessionId)
      // Fechar a sidebar automaticamente após selecionar uma conversa em dispositivos móveis
      if (isMobile) {
        setSidebarOpen(false)
      }
    }
  }, [currentSessionId, isMobile])

  // Create a session on component mount if none exists
  React.useEffect(() => {
    const initializeSession = async () => {
      // Verificar se estamos tentando carregar uma sessão específica da URL
      const urlSessionId = window.location.pathname.split("/").pop()
      const hasSessionIdInUrl = urlSessionId && urlSessionId !== "chat"

      // Só criar uma nova sessão se:
      // 1. Não temos sessões carregadas
      // 2. Não estamos carregando nada no momento
      // 3. Não temos uma sessão inicializada
      // 4. Não estamos tentando carregar uma sessão específica da URL
      if (sessions.length === 0 && !isLoading && !sessionInitialized && !hasSessionIdInUrl) {
        console.log("No sessions found and no URL session specified, creating initial session...")
        setSessionInitialized(true) // Prevent multiple initialization attempts
        try {
          await startNewChat()
        } catch (error) {
          console.error("Failed to initialize session:", error)
          setSessionInitialized(false) // Reset if failed
        }
      }
    }

    initializeSession()
  }, [sessions.length, isLoading, sessionInitialized])

  // Reset copied message index after 2 seconds
  React.useEffect(() => {
    if (copiedMessageIndex !== null) {
      const timeout = setTimeout(() => {
        setCopiedMessageIndex(null)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedMessageIndex])

  // Add a new useEffect hook after the existing useEffect hooks (around line 200, after the useEffect that loads chat history)

  // Add this new useEffect to update the document title based on the current session
  React.useEffect(() => {
    // Find the current session in the sessions array
    const currentSession = sessions.find((session) => session.id === currentSessionId)

    if (currentSession) {
      // If we have a current session with a title, use it as the page title
      document.title = currentSession.title || "Muse"
    } else {
      // Default to "Spark" for new chats or when no session is selected
      document.title = "Muse"
    }
  }, [currentSessionId, sessions])

  const loadChatSessions = async (urlSessionId = null) => {
    try {
      setIsLoading(true)
      setIsRefreshing(true)
      console.log("Loading chat sessions...")
      const sessionsData = await getChatSessions()
      console.log("Received sessions data:", sessionsData)

      if (sessionsData && typeof sessionsData === "object") {
        let filteredSessions: ChatSession[] = []

        // Check if sessions is directly in the response or nested
        if (Array.isArray(sessionsData)) {
          // Filter out any invalid sessions (must have id)
          filteredSessions = sessionsData.filter((session) => session && typeof session === "object" && session.id)
        } else if (Array.isArray(sessionsData.sessions)) {
          // Filter out any invalid sessions (must have id)
          filteredSessions = sessionsData.sessions.filter(
            (session) => session && typeof session === "object" && session.id,
          )
        } else {
          console.error("Unexpected sessions data format:", sessionsData)
        }

        console.log("Filtered sessions:", filteredSessions)
        setSessions(filteredSessions)

        // Verificar se a sessão da URL existe nas sessões carregadas
        if (urlSessionId) {
          const sessionExists = filteredSessions.some((session) => session.id === urlSessionId)
          if (sessionExists) {
            console.log("URL session exists in loaded sessions:", urlSessionId)
            setCurrentSessionId(urlSessionId)
            // Carregar o histórico desta sessão específica
            loadChatHistory(urlSessionId)
          } else {
            console.warn("URL session not found in loaded sessions:", urlSessionId)
            // A sessão da URL não existe, mas ainda mantemos o ID para tentar carregar o histórico
            // Se o histórico falhar, o sistema pode criar uma nova sessão posteriormente
          }
        }
        // Se não temos uma sessão da URL e temos sessões carregadas, selecione a primeira
        else if (filteredSessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(filteredSessions[0].id)
          console.log("Auto-selected first session:", filteredSessions[0].id)
        }
      } else {
        console.error("Unexpected sessions data format:", sessionsData)
        setSessions([])
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chat sessions. Please try again later.",
      })
      setSessions([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Update the loadChatHistory function to handle the enhanced history response
  // Find the loadChatHistory function (around line 200) and update it:

  const loadChatHistory = async (sessionId: string) => {
    if (!sessionId) {
      console.error("Cannot load chat history: No session ID provided")
      return
    }

    try {
      setIsLoading(true)
      console.log(`Loading chat history for session ${sessionId}...`)
      const history = await getChatHistory(sessionId)
      console.log("Received chat history:", history)

      if (Array.isArray(history)) {
        setMessages(history)
        setTitleSet(history.length > 0)
        console.log("Chat history loaded, titleSet:", history.length > 0)

        // Process message IDs and branch information
        processMessageBranches(history)
      } else if (history && typeof history === "object") {
        // Handle case where history might be wrapped in an object
        if (Array.isArray(history.messages)) {
          setMessages(history.messages)
          setTitleSet(history.messages.length > 0)
          console.log("Chat history loaded, titleSet:", history.messages.length > 0)

          // Process message IDs and branch information
          processMessageBranches(history.messages)

          // Set current branch ID if available
          if (history.messages.length > 0) {
            const lastMessage = history.messages[history.messages.length - 1]
            if (lastMessage.branch_id) {
              setCurrentBranchId(lastMessage.branch_id)
            }
          }
        } else {
          console.error("History messages is not an array:", history)
          setMessages([])
          setTitleSet(false)
        }
      } else {
        console.error("Unexpected chat history format:", history)
        setMessages([])
        setTitleSet(false)
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chat history. Please try again later.",
      })
      setMessages([])
      setTitleSet(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Add this new function to process message branches
  const processMessageBranches = (messages: Message[]) => {
    const newBranches: { [parentId: string]: string[] } = {}
    const newBranchIndices: { [branchId: string]: number } = {}
    const newMessageIds: { [index: number]: number } = {}

    // First pass: collect all branch IDs and message IDs
    messages.forEach((message, index) => {
      if (message.id) {
        newMessageIds[index] = message.id
      }

      if (message.branch_id && message.parent_id) {
        if (!newBranches[message.parent_id]) {
          newBranches[message.parent_id] = []
        }

        if (!newBranches[message.parent_id].includes(message.branch_id)) {
          newBranches[message.parent_id].push(message.branch_id)
        }
      }
    })

    // Second pass: calculate branch indices
    Object.entries(newBranches).forEach(([parentId, branchIds]) => {
      branchIds.forEach((branchId, index) => {
        newBranchIndices[branchId] = index + 1
      })
    })

    setBranches(newBranches)
    setBranchIndices(newBranchIndices)
    setMessageIds(newMessageIds)

    // Set current branch ID if not already set
    if (!currentBranchId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.branch_id) {
        setCurrentBranchId(lastMessage.branch_id)
      }
    }
  }

  // Update the startNewChat function to navigate to the new session URL
  const startNewChat = async () => {
    try {
      setIsLoading(true)
      console.log("Starting new chat")
      const response = await createChatSession()
      console.log("New session response:", response)

      // Try different ways to extract the session ID
      let sessionId = null

      if (typeof response === "object" && response !== null) {
        // Try direct access
        if (response.session_id) {
          sessionId = response.session_id
        }
        // Try nested in data
        else if (response.data && response.data.session_id) {
          sessionId = response.data.session_id
        }
      } else if (typeof response === "string") {
        sessionId = response
      }

      if (!sessionId) {
        console.error("Could not extract session ID from response:", response)
        throw new Error("No session ID returned from API")
      }

      console.log("New session created:", sessionId)
      setCurrentSessionId(sessionId)
      setMessages([])
      setTitleSet(false)

      // Add the new session to the sessions list with a better default title
      const newSession = {
        id: sessionId,
        title: "New Conversation",
      }

      // Add the new session to the beginning of the list
      setSessions((prevSessions) => {
        // Create a new array with the new session at the beginning
        const updatedSessions = [newSession, ...prevSessions]
        console.log("Updated sessions after adding new chat:", updatedSessions)
        return updatedSessions
      })

      // Update URL with the new session ID
      window.history.pushState({}, "", `/chat/${sessionId}`)

      return sessionId // Return the session ID for immediate use
    } catch (error) {
      console.error("Failed to create new chat session:", error)
      throw error // Re-throw to allow handling by caller
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    const userMessage: Message = { role: "user", content: input }
    const currentInput = input.trim()
    setInput("")
    setStreamingMessage("") // Reset streaming message
    setThinkingStatus(null) // Reset thinking status

    try {
      // Ensure we have a valid session ID before proceeding
      let activeSessionId = currentSessionId

      // If no session is active, create a new one first
      if (!activeSessionId) {
        console.log("No active session, creating a new one first...")
        try {
          activeSessionId = await startNewChat()
          console.log("Created new session for message:", activeSessionId)

          if (!activeSessionId) {
            throw new Error("Failed to create a valid session ID")
          }
        } catch (error) {
          console.error("Failed to create session before sending message:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create a new chat session. Please try again.",
          })
          setIsLoading(false) // Ensure loading state is reset on error
          return // Exit early if we couldn't create a session
        }
      }

      // Double-check we have a valid session ID before proceeding
      if (!activeSessionId) {
        throw new Error("Missing session_id - Cannot send message without a valid session")
      }

      console.log("Using session ID for message:", activeSessionId)

      // Add the user message to the UI
      setMessages((prev) => [...prev, userMessage])

      // Set the title based on the first user message if it hasn't been set yet
      if (!titleSet) {
        console.log("Setting chat title based on message:", currentInput)
        const title = generateTitle(currentInput)

        // Update the session title in the local state
        setSessions((prev) => {
          const updatedSessions = prev.map((session) =>
            session.id === activeSessionId ? { ...session, title } : session,
          )
          console.log("Updated sessions with new title:", title, updatedSessions)
          return updatedSessions
        })

        // Also update the title on the backend
        try {
          await editChatSessionName(activeSessionId, title)
          console.log("Updated session title on backend")
        } catch (error) {
          console.error("Failed to update session title on backend:", error)
          // Continue anyway as this is not critical
        }

        setTitleSet(true)
      }

      // Handle streaming response
      // Update the handleSubmit function to capture message IDs from the streaming response
      // Find the sendMessage call in the handleSubmit function (around line 350) and update it:

      // Replace the existing try block in the sendMessage call with this updated version:
      try {
        await sendMessage(activeSessionId, currentInput, (chunk) => {
          // Try to parse the chunk for control messages (status, final)
          try {
            const parsed = JSON.parse(chunk)

            // Check for status update
            if (parsed.status) {
              setThinkingStatus(parsed.status)
              return
            }

            // Check for final message with IDs
            if (parsed.final) {
              const finalData = parsed.final
              if (finalData.assistant_message_id && finalData.user_message_id) {
                const assistantId = finalData.assistant_message_id
                const userId = finalData.user_message_id

                console.log("Captured message IDs:", { userId, assistantId })

                // Update message IDs
                setMessages((prev) => {
                  const newMessages = [...prev]
                  // Find the last user message and set its ID
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === "user" && !newMessages[i].id) {
                      newMessages[i] = { ...newMessages[i], id: userId }
                      break
                    }
                  }

                  // Find the last assistant message and set its ID
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === "assistant" && !newMessages[i].id) {
                      newMessages[i] = { ...newMessages[i], id: assistantId }
                      // Also update branch_id if available (assuming it might be in finalData too, or use current)
                      if (!newMessages[i].branch_id && currentBranchId) {
                        newMessages[i] = { ...newMessages[i], branch_id: currentBranchId }
                      }
                      break
                    }
                  }

                  return newMessages
                })
              }
              return // Return early to avoid appending JSON to content
            }
          } catch (e) {
            // Not a control message, continue processing as content
          }

          // Update the last message with the accumulated content or create a new one
          setMessages((prev) => {
            const newMessages = [...prev]
            // Check if we already have an assistant message
            const hasAssistantMessage =
              newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant"

            if (hasAssistantMessage) {
              // Update existing message
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: (newMessages[newMessages.length - 1].content || "") + chunk,
              }
            } else {
              // Create new assistant message
              newMessages.push({
                role: "assistant",
                content: chunk,
                branch_id: currentBranchId || undefined,
              })
            }
            return newMessages
          })
        })
      } finally {
        // Ensure we reset streaming state and loading state immediately after streaming completes
        setStreamingMessage("")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
      })

      // Remove the placeholder message if there was an error
      setMessages((prev) => {
        // Only remove if it's an assistant message at the end
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
          return prev.slice(0, -1)
        }
        return prev
      })

      // Ensure loading state is reset on error
      setIsLoading(false)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    console.log("Switching to session:", sessionId)
    setCurrentSessionId(sessionId)
    // Update URL without full page reload
    window.history.pushState({}, "", `/chat/${sessionId}`)
  }

  const refreshSessions = () => {
    if (!isRefreshing) {
      loadChatSessions()
    }
  }

  const startEditingSession = (sessionId: string, currentTitle: string) => {
    console.log(`Starting to edit session ${sessionId} with current title: "${currentTitle}"`)
    setEditingSessionId(sessionId)
    setEditingSessionTitle(currentTitle)
  }

  const saveSessionTitle = async (sessionId: string) => {
    if (!editingSessionTitle.trim()) {
      setEditingSessionId(null)
      return
    }

    console.log(`Saving title for session ${sessionId}: "${editingSessionTitle.trim()}"`)

    try {
      setIsLoading(true)

      // Update the title on the backend
      await editChatSessionName(sessionId, editingSessionTitle.trim())

      // Update the title in the local state
      setSessions((prev) => {
        return prev.map((session) => {
          if (session.id === sessionId) {
            console.log(
              `Updating session ${session.id} title from "${session.title}" to "${editingSessionTitle.trim()}"`,
            )
            return { ...session, title: editingSessionTitle.trim() }
          }
          return session
        })
      })

      toast({
        title: "Chat renamed",
        description: "The chat title has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update session title:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update chat title. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setEditingSessionId(null)
    }
  }

  const confirmDeleteSession = (sessionId: string) => {
    setDeleteSessionId(sessionId)
    setIsDeleteDialogOpen(true)
  }

  const deleteChatSessionAlt = async (sessionId: string) => {
    // Implement your alternative delete chat session logic here
    // This is just a placeholder to satisfy the linter
    console.warn("Alternative delete chat session method not implemented. Using placeholder.")
    return Promise.resolve()
  }

  // Update the handleDeleteSession function to remove the toast notification
  const handleDeleteSession = async () => {
    if (!deleteSessionId) {
      setIsDeleteDialogOpen(false)
      setDeleteSessionId(null)
      return
    }

    try {
      setIsLoading(true)

      // Try primary method first
      try {
        await deleteChatSession(deleteSessionId)
        console.log("Session deleted successfully using primary method")
      } catch (primaryError) {
        console.error("Primary delete method failed:", primaryError)

        // If it fails, try alternative method
        try {
          await deleteChatSessionAlt(deleteSessionId)
          console.log("Session deleted successfully using alternative method")
        } catch (altError) {
          console.error("Alternative delete method also failed:", altError)
          throw new Error("All deletion methods failed")
        }
      }

      // If the deleted session was the current one, clear the current session
      if (deleteSessionId === currentSessionId) {
        setCurrentSessionId("")
        setMessages([])
        setTitleSet(false)
      }

      // Remove the session from the local state
      setSessions((prev) => prev.filter((session) => session.id !== deleteSessionId))

      // Select another session if available
      if (sessions.length > 1) {
        const remainingSessions = sessions.filter((session) => session.id !== deleteSessionId)
        if (remainingSessions.length > 0 && deleteSessionId === currentSessionId) {
          const newSessionId = remainingSessions[0].id
          setCurrentSessionId(newSessionId)
          // Update URL to the new selected session
          window.history.pushState({}, "", `/chat/${newSessionId}`)
        }
      } else if (deleteSessionId === currentSessionId) {
        // No sessions left or deleted the last one, go back to /chat
        window.history.pushState({}, "", `/chat`)
        // Create a new session automatically
        setTimeout(() => {
          startNewChat()
        }, 100)
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat. Please try again.",
      })
    } finally {
      // Ensure all state is properly reset
      setIsLoading(false)
      setDeleteSessionId(null)
      setIsDeleteDialogOpen(false)

      // Add a small delay to ensure React has time to process state updates
      setTimeout(() => {
        document.body.style.pointerEvents = "auto"
      }, 50)
    }
  }

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom, messages, streamingMessage])

  // Add a useEffect to log when titleSet changes:
  React.useEffect(() => {
    console.log("titleSet changed:", titleSet)
  }, [titleSet])

  // Function to get plain text content from messages (for copying)
  const getPlainTextContent = (message: Message) => {
    if (message.role === "assistant") {
      // Create a temporary div to strip HTML tags for copying
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = markdownToHtml(message.content)
      return tempDiv.textContent || tempDiv.innerText || message.content
    } else {
      return message.content
    }
  }

  // Function to render message content based on role
  const renderMessageContent = (message: Message) => {
    if (message.role === "assistant") {
      // Convert markdown to HTML for assistant messages
      const html = markdownToHtml(message.content)
      return (
        <div
          className="text-sm leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    } else {
      // For user messages, just render the plain text
      return <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
    }
  }

  const handleMouseEnter = React.useCallback((index: number) => {
    setHoveredMessageIndex(index)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    setHoveredMessageIndex(null)
  }, [])

  // Adicione estas novas funções antes do return (por volta da linha 500)

  // Função para iniciar a edição de uma mensagem
  const startEditingMessage = (index: number) => {
    // Apenas permitir editar mensagens do usuário
    if (messages[index].role === "user") {
      setEditingMessageIndex(index)
      setEditingMessageContent(messages[index].content)
    }
  }

  // Update the saveEditedMessage function to use the new editMessage API
  // Replace the existing saveEditedMessage function with this updated version:

  // Function to save the edited message
  const saveEditedMessage = async () => {
    if (editingMessageIndex === null || !editingMessageContent.trim()) {
      setEditingMessageIndex(null)
      return
    }

    try {
      // Get the message being edited
      const message = messages[editingMessageIndex]

      if (!message.id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Cannot edit message without ID. Please try again later.",
        })
        setEditingMessageIndex(null)
        return
      }

      setIsLoading(true)

      // Call the API to edit the message
      const result = await editMessage(message.id, editingMessageContent.trim())
      console.log("Edit message result:", result)

      if (result && result.branch_id && result.new_message_id) {
        // Update branches data
        setBranches((prev) => {
          const newBranches = { ...prev }
          if (message.parent_id) {
            if (!newBranches[message.parent_id]) {
              newBranches[message.parent_id] = []
            }
            if (!newBranches[message.parent_id].includes(result.branch_id)) {
              newBranches[message.parent_id].push(result.branch_id)
            }
          }
          return newBranches
        })

        // Update branch indices
        setBranchIndices((prev) => {
          const newIndices = { ...prev }
          if (message.parent_id) {
            const branchesForParent = [...(branches[message.parent_id] || [])]
            if (!branchesForParent.includes(result.branch_id)) {
              branchesForParent.push(result.branch_id)
            }
            newIndices[result.branch_id] = branchesForParent.length
          }
          return newIndices
        })

        // Set current branch ID to the new branch
        setCurrentBranchId(result.branch_id)

        // Load the new branch history
        await loadChatHistory(currentSessionId)

        toast({
          title: "Message updated",
          description: "Your message has been updated and a new branch created.",
        })
      } else {
        // If we don't get a proper response, just update the local message
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: editingMessageContent.trim(),
            is_edited: true,
          }
          return newMessages
        })

        toast({
          title: "Message updated",
          description: "Your message has been updated locally.",
        })
      }
    } catch (error) {
      console.error("Failed to update message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update message. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setEditingMessageIndex(null)
    }
  }

  // Add a new function to navigate between branches
  const navigateToBranch = async (parentId: number, direction: "prev" | "next") => {
    if (!parentId || !branches[parentId]) return

    const currentIndex = currentBranchId ? branches[parentId].indexOf(currentBranchId) : -1
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : branches[parentId].length - 1
    } else {
      newIndex = currentIndex < branches[parentId].length - 1 ? currentIndex + 1 : 0
    }

    const newBranchId = branches[parentId][newIndex]
    if (newBranchId && newBranchId !== currentBranchId) {
      setCurrentBranchId(newBranchId)

      // Reload chat history with the new branch ID
      // This would require modifying the getChatHistory function to accept a branch ID
      // For now, we'll just reload the entire chat history
      await loadChatHistory(currentSessionId)
    }
  }

  // Função para cancelar a edição
  const cancelEditingMessage = () => {
    setEditingMessageIndex(null)
  }

  // Function to copy message content to clipboard
  const copyMessageContent = async (index: number) => {
    try {
      const text = getPlainTextContent(messages[index])
      await navigator.clipboard.writeText(text)

      // Use callback form to avoid dependency on current state
      setCopiedMessageIndex(() => index)

      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied",
        duration: 2000,
      })
      console.log("Copied message:", text.substring(0, 50) + "...")
    } catch (error) {
      console.error("Failed to copy message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy message to clipboard",
      })
    }
  }

  const confirmDeleteMessage = (messageId: number) => {
    setDeleteMessageId(messageId)
    setIsDeleteMessageDialogOpen(true)
  }

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) {
      setIsDeleteMessageDialogOpen(false)
      return
    }

    try {
      setIsLoading(true)
      await deleteMessage(deleteMessageId)

      // Remove the deleted message and all subsequent messages
      setMessages((prev) => {
        const index = prev.findIndex((msg) => msg.id === deleteMessageId)
        if (index !== -1) {
          // Keep only messages before the deleted one
          return prev.slice(0, index)
        }
        return prev
      })

      toast({
        title: "Message deleted",
        description: "The message and subsequent conversation have been deleted.",
      })
    } catch (error) {
      console.error("Failed to delete message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete message. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setDeleteMessageId(null)
      setIsDeleteMessageDialogOpen(false)
    }
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Inicializar o textarea com altura mínima
  const [textareaHeight, setTextareaHeight] = React.useState<number>(46)

  React.useEffect(() => {
    const textarea = document.querySelector("textarea")
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
      setTextareaHeight(Math.min(textarea.scrollHeight, 200))
    }
  }, [input])

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Add the CodeHighlighter component */}
      <CodeHighlighter />

      {/* Sidebar - com animação de slide */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] border-r border-zinc-800 flex flex-col bg-zinc-900 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-[60px] px-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="w-8 h-8">
            <SparkLogo />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshSessions}
              disabled={isRefreshing}
              className="h-8 w-8 hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
              title="Refresh chat list"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              disabled={isLoading}
              className="h-8 w-8 hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
              title="New chat"
            >
              <PenSquare className="h-4 w-4" />
            </Button>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 md:hidden hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative p-2 hover:bg-zinc-800/70 transition-all duration-200 rounded-md my-1 mx-1 cursor-pointer",
                  currentSessionId === session.id && "bg-zinc-800 shadow-sm",
                )}
                onClick={() => handleSessionClick(session.id)}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveSessionTitle(session.id)
                        } else if (e.key === "Escape") {
                          setEditingSessionId(null)
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => saveSessionTitle(session.id)}
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-left flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-[13px] font-normal truncate">
                        {session.title || `Chat ${session.id.slice(0, 8)}`}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-1 flex-shrink-0 hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 rounded-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 bg-zinc-900 border-zinc-800 rounded-md shadow-lg animate-in fade-in-80 slide-in-from-top-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          className="text-zinc-200 hover:bg-zinc-800/70 focus:bg-zinc-800/70 focus:text-zinc-200 transition-colors duration-200 rounded-sm my-1"
                          onClick={() => startEditingSession(session.id, session.title)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer transition-colors duration-200 rounded-sm my-1"
                          onClick={() => confirmDeleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">
              {isLoading ? "Loading sessions..." : "No chat sessions found"}
            </div>
          )}
        </div>
      </div>

      {/* Overlay para fechar o sidebar em dispositivos móveis */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden bg-zinc-850">
        {/* Top Bar - Fixa em todos os dispositivos */}
        <div className="sticky top-0 z-20 flex items-center h-[60px] px-4 border-b border-zinc-800 bg-zinc-850">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="md:hidden hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-zinc-700/70 text-white hover:text-white transition-all duration-200 rounded-md p-0 md:p-2"
            >
              <span className="text-lg text-white font-medium">Muse</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 ml-auto md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              disabled={isLoading}
              className="hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
            >
              <PenSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>


        {/* Chat Messages - com padding para evitar que o conteúdo fique sob o input fixo */}
        <div className="flex-1 overflow-auto pb-24">
          <div className="chat-container py-4 space-y-6 w-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-zinc-500">
                  {currentSessionId
                    ? "Start a conversation by typing a message below"
                    : "Start typing below to begin a new chat"}
                </p>
              </div>
            )}
            {messages.map((message, index) => {
              const messageId = message.id || messageIds[index] || null
              const hasChildren = messageId ? Object.keys(branches).includes(messageId.toString()) : false
              const parentId = message.parent_id || null
              const branchId = message.branch_id || currentBranchId || null
              const branchCount = parentId && branches[parentId] ? branches[parentId].length : 0
              const branchIndex = branchId && branchIndices[branchId] ? branchIndices[branchId] : 1

              return (
                <div
                  key={index}
                  className="flex gap-3 relative p-3 rounded-md message-container"
                  onMouseEnter={(e) => {
                    // Only handle hover if we're not in the middle of a selection
                    if (window.getSelection()?.toString() === "") {
                      handleMouseEnter(index)
                    }
                    e.stopPropagation()
                  }}
                  onMouseLeave={(e) => {
                    // Only handle hover if we're not in the middle of a selection
                    if (window.getSelection()?.toString() === "") {
                      handleMouseLeave()
                    }
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    // Only handle click if it's directly on this element, not on children
                    // and if we're not in the middle of a selection
                    if (e.target === e.currentTarget && window.getSelection()?.toString() === "") {
                      handleMouseEnter(index)
                    }
                    // Don't stop propagation here to allow normal click behavior
                  }}
                >
                  {message.role === "assistant" ? (
                    <>
                      <Avatar className="h-8 w-8 overflow-hidden bg-zinc-800 flex-shrink-0">
                        <SparkLogo />
                      </Avatar>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="text-sm text-zinc-400 flex items-center gap-2">
                          Muse
                          {message.is_edited && <span className="text-xs text-zinc-500 italic">(edited)</span>}
                        </div>
                        {editingMessageIndex === index ? (
                          // Editing mode content remains the same
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingMessageContent}
                              onChange={(e) => setEditingMessageContent(e.target.value)}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingMessage}
                                className="text-zinc-400 hover:text-zinc-200"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveEditedMessage}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-base leading-relaxed prose prose-invert max-w-none select-text"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                            onClick={(e) => {
                              // Don't do anything on click to allow text selection
                              e.stopPropagation()
                            }}
                            onMouseDown={(e) => {
                              // Prevent any default behavior that might interfere with selection
                              e.stopPropagation()
                            }}
                          />
                        )}
                        {editingMessageIndex !== index && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDeleteMessage(messageId!)
                              }}
                              className={`p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-all duration-200 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"}`}
                              aria-label="Delete message"
                              title="Delete message"
                              disabled={!messageId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => copyMessageContent(index)}
                              className={`p-1.5 rounded-md ${copiedMessageIndex === index
                                ? "text-green-400"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                                } transition-all duration-200 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"}`}
                              aria-label={copiedMessageIndex === index ? "Copied" : "Copy to clipboard"}
                              title={copiedMessageIndex === index ? "Copied!" : "Copy to clipboard"}
                            >
                              {copiedMessageIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="user-message">
                        <div className="flex items-start justify-between">
                          <div className="text-sm text-zinc-400 flex items-center gap-2">
                            Edilson
                            {message.is_edited && <span className="text-xs text-zinc-500 italic">(edited)</span>}
                          </div>
                        </div>
                        <div className="flex items-start mt-2 gap-3">
                          <div className="user-avatar-container">
                            <Avatar className="h-8 w-8 overflow-hidden bg-zinc-800 flex-shrink-0 rounded-full">
                              <UserAvatar />
                            </Avatar>
                          </div>
                          {editingMessageIndex === index ? (
                            <div className="flex-1 flex flex-col gap-2">
                              <textarea
                                value={editingMessageContent}
                                onChange={(e) => setEditingMessageContent(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingMessage}
                                  className="text-zinc-400 hover:text-zinc-200"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={saveEditedMessage}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-base leading-relaxed whitespace-pre-wrap bg-zinc-800 p-4 rounded-lg user-message-bubble">
                              {message.content}
                            </div>
                          )}
                        </div>
                        {editingMessageIndex !== index && (
                          <div className="flex gap-2 mt-2 ml-11">
                            <button
                              onClick={() => copyMessageContent(index)}
                              className={`p-1.5 rounded-md ${copiedMessageIndex === index
                                ? "text-green-400"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                                } transition-all duration-200 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"}`}
                              aria-label={copiedMessageIndex === index ? "Copied" : "Copy to clipboard"}
                              title={copiedMessageIndex === index ? "Copied!" : "Copy to clipboard"}
                            >
                              {copiedMessageIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => startEditingMessage(index)}
                              className={`p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-all duration-200 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"
                                }`}
                              aria-label="Edit message"
                              title="Edit message"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDeleteMessage(messageId!)
                              }}
                              className={`p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-all duration-200 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"
                                }`}
                              aria-label="Delete message"
                              title="Delete message"
                              disabled={!messageId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            {/* Branch navigation controls */}
                            {hasChildren && branchCount > 1 && (
                              <div
                                className={`flex items-center gap-1 text-zinc-400 ${hoveredMessageIndex === index ? "opacity-100" : "opacity-0"
                                  } transition-all duration-200`}
                              >
                                <button
                                  onClick={() => messageId && navigateToBranch(messageId, "prev")}
                                  className="p-1.5 rounded-md hover:text-zinc-200 hover:bg-zinc-700/50"
                                  aria-label="Previous branch"
                                  title="Previous branch"
                                >
                                  ←
                                </button>
                                <span className="text-xs">
                                  {branchIndex}/{branchCount}
                                </span>
                                <button
                                  onClick={() => messageId && navigateToBranch(messageId, "next")}
                                  className="p-1.5 rounded-md hover:text-zinc-200 hover:bg-zinc-700/50"
                                  aria-label="Next branch"
                                  title="Next branch"
                                >
                                  →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading &&
              !streamingMessage &&
              messages.length > 0 &&
              messages[messages.length - 1].role !== "assistant" && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 overflow-hidden bg-zinc-800">
                    <SparkLogo />
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-zinc-400">Muse</div>
                    <div className="text-sm leading-relaxed">
                      <span className="shimmer-text">{thinkingStatus || "is thinking..."}</span>
                    </div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixa na parte inferior em todos os dispositivos */}
        <div className="sticky bottom-0 left-0 right-0 z-20 p-4 border-t border-zinc-800 bg-zinc-850">
          <form onSubmit={handleSubmit} className="flex justify-center">
            <div className="relative w-full max-w-3xl mx-auto">
              {/* Wrapper: textarea + botões (botões fora do textarea), com centralização vertical quando pequeno, bottom quando grande */}
              <div className="relative flex w-full items-center">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    // Mantenha a altura fixa e permita rolagem
                    const textarea = e.target
                    textarea.style.height = "46px" // Altura inicial fixa
                    const newHeight = Math.min(Math.max(textarea.scrollHeight, 46), 200)
                    textarea.style.height = `${newHeight}px`
                    setTextareaHeight(newHeight)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      if (input.trim() && !isLoading) {
                        handleSubmit(e)
                      }
                    }
                  }}
                  placeholder="Ask anything"
                  className="w-full bg-[#303030] rounded-3xl px-4 py-3 pr-16 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 hover:shadow-md resize-none overflow-y-auto min-h-[46px] max-h-[200px]"
                  disabled={isLoading}
                  rows={1}
                />
                <div className={cn(
                  "absolute right-2 flex gap-2",
                  textareaHeight === 46 ? "inset-y-0 items-center" : "bottom-2"
                )}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-700/70 text-zinc-300 hover:text-zinc-100 transition-all duration-200 rounded-md"
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200",
                      isLoading || !input.trim()
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-white text-zinc-900 hover:bg-zinc-100",
                    )}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? (
                      <span className="h-3 w-3 bg-current rounded-[3px]" aria-hidden="true" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            // Ensure we reset the delete session ID when the dialog is closed
            setDeleteSessionId(null)

            // Adicione esta linha para garantir que o pointer-events seja restaurado
            document.body.style.pointerEvents = "auto"
          }
        }}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 text-white hover:bg-zinc-700 transition-colors duration-200"
              onClick={(e) => {
                // Prevent any potential event bubbling issues
                e.stopPropagation()

                // Explicitly handle cancel to ensure state is reset
                setIsDeleteDialogOpen(false)
                setDeleteSessionId(null)

                // Ensure pointer-events are restored
                document.body.style.pointerEvents = "auto"

                // Add a small delay to ensure React has time to process state updates
                setTimeout(() => {
                  document.body.style.pointerEvents = "auto"
                }, 50)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent any potential event bubbling issues
                e.stopPropagation()
                handleDeleteSession()
              }}
              className="bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog
        open={isDeleteMessageDialogOpen}
        onOpenChange={setIsDeleteMessageDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 text-white hover:bg-zinc-700 transition-colors duration-200"
              onClick={() => setIsDeleteMessageDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
