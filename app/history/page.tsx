import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HistoryRedirectPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get the most recent conversation and redirect to it
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (conversations && conversations.length > 0) {
    redirect(`/history/${conversations[0].id}`)
  } else {
    redirect("/dashboard")
  }
}
