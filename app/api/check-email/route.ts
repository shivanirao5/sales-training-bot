import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check if email exists in profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    const exists = !!existingProfile

    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error checking email:", error)
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
  }
}
