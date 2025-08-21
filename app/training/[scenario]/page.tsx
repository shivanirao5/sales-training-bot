import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TrainingSession } from "@/components/training-session"

interface TrainingPageProps {
  params: {
    scenario: string
  }
}

export default async function TrainingPage({ params }: TrainingPageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const validScenarios = ["cold_calling", "demo_pitch", "upsell"]
  if (!validScenarios.includes(params.scenario)) {
    redirect("/dashboard")
  }

  return <TrainingSession scenario={params.scenario} userId={data.user.id} />
}
