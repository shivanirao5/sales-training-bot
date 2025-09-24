import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
      
      // Fallback: Just delete related data and sign out user
      // The user auth record will remain, but all data will be cleaned up
      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id)

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (conversationsError || profileError) {
        console.error("Error deleting user data:", { conversationsError, profileError })
        return NextResponse.json({ error: "Failed to delete user data" }, { status: 500 })
      }

      return NextResponse.json({ 
        message: "User data deleted successfully. Please sign out manually.",
        warning: "User auth record not deleted due to missing service role key" 
      }, { status: 200 })
    }

    // Create admin client for user deletion
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete all user conversations first (to be explicit)
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', user.id)

    if (conversationsError) {
      console.error("Error deleting conversations:", conversationsError)
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
    }

    // Delete the auth user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError)
      return NextResponse.json({ error: "Failed to delete account from authentication" }, { status: 500 })
    }

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in delete account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}