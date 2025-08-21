import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FeedbackDisplay } from "@/components/feedback-display"

interface FeedbackPageProps {
  params: {
    scenario: string
  }
  searchParams: {
    conversationId?: string
  }
}

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  if (!searchParams.conversationId) {
    redirect("/dashboard")
  }

  // Get conversation with feedback
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", searchParams.conversationId)
    .eq("user_id", data.user.id)
    .single()

  if (!conversation || !conversation.feedback) {
    redirect("/dashboard")
  }

  const feedback = JSON.parse(conversation.feedback)

  return <FeedbackDisplay feedback={feedback} scenario={params.scenario} />
}
