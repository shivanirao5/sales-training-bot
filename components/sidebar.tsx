"use client"

import { useState } from "react"
import { Search, MessageSquare, Bot, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email?: string
}

interface Profile {
  id: string
  email: string
  full_name?: string
}

interface Conversation {
  id: string
  title: string
  scenario_type: string
  created_at: string
  score?: number
}

interface SidebarProps {
  user: User
  profile: Profile | null
  conversations: Conversation[]
}

export function Sidebar({ user, profile, conversations }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatScenarioType = (type: string) => {
    switch (type) {
      case "cold_calling":
        return "Cold Call Prospecting"
      case "demo_pitch":
        return "Product Demo Presentation"
      case "upsell":
        return "Upselling Existing Customers"
      default:
        return type
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-600"
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  const handleConversationClick = (conversation: Conversation) => {
    router.push(`/history/${conversation.id}`)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-gray-900">Sales Training Bot</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{profile?.email || user.email}</p>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 p-1">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 pb-2">
          <h2 className="font-medium text-gray-900">Recent Conversations</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{conversation.title}</p>
                        {conversation.score && (
                          <Badge variant="secondary" className={`text-xs ${getScoreColor(conversation.score)}`}>
                            {conversation.score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{formatScenarioType(conversation.scenario_type)}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a training session to see your history</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
