"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  BookmarkIcon,
  ChevronDown,
  History,
  PenSquare,
  Search,
  X,
  BrainCircuit,
  Paperclip,
  ArrowUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ChatInterface() {
  const [messages, setMessages] = React.useState([
    {
      role: "user",
      content: "crie um blog post de supersparks vs disqus",
    },
    {
      role: "assistant",
      content: `Aqui está um blog post em português comparando Supersparks e Disqus para sistemas de comentários em blogs. Ele é escrito em um tom natural e informativo, como se fosse publicado em um site sobre tecnologia ou desenvolvimento web:

Supersparks vs. Disqus: Qual é o Melhor Sistema de Comentários para o Seu Blog?

Se você tem um blog, sabe que os comentários são uma parte essencial para engajar sua audiência e criar uma comunidade em torno do seu conteúdo. Dois nomes que frequentemente aparecem na conversa sobre sistemas de comentários são Supersparks e Disqus. Mas qual deles é o melhor para o seu site? Hoje, vamos comparar essas duas ferramentas em aspectos como design, desempenho, facilidade de uso e custo, para ajudá-lo a decidir qual se encaixa melhor nas suas necessidades.

O que é o Disqus?
O Disqus é um dos sistemas de comentários mais populares do mundo, usado por milhões de sites, desde pequenos blogs até grandes portais de mídia. Ele oferece uma plataforma robusta com integração a redes sociais, ferramentas de moderação avançadas e até opções de monetização, como anúncios nativos. É fácil de instalar (basta um snippet de código ou plugin) e funciona em praticamente qualquer tipo de site, como WordPress, Ghost e outras plataformas.`,
    },
  ])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Failed to load user avatar")
    e.currentTarget.src = "/placeholder.svg"
  }

  const SparkLogo = () => <AvatarImage src="/placeholder.svg" alt="Assistant" />

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <Button variant="ghost" size="icon">
          <X className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-lg">Grok 3</span>
          <Badge variant="secondary" className="bg-blue-600 text-xs">
            beta
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <BookmarkIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <PenSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="flex gap-3">
            <Avatar className="h-8 w-8 overflow-hidden">
              {message.role === "user" ? (
                <div className="w-full h-full relative">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ifuT0Qu1_400x400.jpg-LJ3RnQ2SiQIjFnSIXruO8GTjeYpXfd.jpeg"
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <SparkLogo />
              )}
              <AvatarFallback>{message.role === "user" ? "U" : "S"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="text-sm text-zinc-400">{message.role === "user" ? "You" : "Spark"}</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Ask anything"
            className="w-full bg-zinc-800 rounded-lg px-4 py-3 pr-32 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <BrainCircuit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
