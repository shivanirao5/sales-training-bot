"use client"

import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Purple user icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Welcome text */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome to Sales Training Assistant</h1>
          <p className="text-gray-600 leading-relaxed">Sign in to access your personalized sales training assistant.</p>
        </div>

        {/* Get Started button */}
        <Button
          onClick={() => router.push("/auth/login")}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium"
        >
          Get Started
        </Button>
      </div>
    </div>
  )
}
