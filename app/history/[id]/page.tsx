import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConversationHistory } from "@/components/conversation-history"

interface HistoryPageProps {
  params: {
    id: string
  }
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", data.user.id)
    .single()

  if (!conversation) {
    redirect("/dashboard")
  }

  return <ConversationHistory conversation={conversation} />
}
