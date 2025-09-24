"use client"

import { useState } from "react"
import { Settings, User, Lock, Trash2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal, ConfirmationModal } from "@/components/ui/modal"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface GlobalHeaderProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    id: string
    email: string
    full_name?: string
  } | null
}

export function GlobalHeader({ user, profile }: GlobalHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChangeNameOpen, setIsChangeNameOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(profile?.full_name || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleChangeDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setError("Display name cannot be empty")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newDisplayName.trim() })
        .eq('id', user.id)

      if (error) throw error
      
      setIsChangeNameOpen(false)
      window.location.reload() // Refresh to show updated name
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update display name")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setIsChangePasswordOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Call the delete account API
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      // Sign out user locally
      await supabase.auth.signOut()
      
      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      setError(error instanceof Error ? error.message : "Failed to delete account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Sales Training Bot</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {profile?.full_name || user.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} className="max-w-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Settings</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setIsSettingsOpen(false)
                setIsChangeNameOpen(true)
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Change Display Name
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setIsSettingsOpen(false)
                setIsChangePasswordOpen(true)
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setIsSettingsOpen(false)
                setIsDeleteAccountOpen(true)
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Display Name Modal */}
      <Modal isOpen={isChangeNameOpen} onClose={() => setIsChangeNameOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Display Name</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsChangeNameOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeDisplayName}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteAccountOpen}
        onClose={() => {
          setIsDeleteAccountOpen(false)
          setError(null)
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmText="Delete Account"
        cancelText="Keep Account"
        isDestructive={true}
      />

      {/* Show error if delete fails */}
      {error && isDeleteAccountOpen && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
