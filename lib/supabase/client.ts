import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a singleton instance to prevent multiple connections
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    })
  }
  return supabaseInstance
})()

// Helper function to handle database errors consistently
export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error during ${operation}:`, error)

  if (error?.code === "PGRST301") {
    return "Database connection timeout. Please try again."
  }

  if (error?.code === "PGRST116") {
    return "Record not found."
  }

  if (error?.message?.includes("timeout")) {
    return "Request timed out. Please try again."
  }

  return error?.message || `Failed to ${operation}. Please try again.`
}
