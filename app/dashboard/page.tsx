import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard-content"
import { Sidebar } from "@/components/sidebar"
import { GlobalHeader } from "@/components/global-header"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get recent conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader user={data.user} profile={profile} />
      <div className="flex flex-1">
        <Sidebar user={data.user} profile={profile} conversations={conversations || []} />
        <DashboardContent />
      </div>
    </div>
  )
}
