"use client"

import { useAuth } from '@/lib/AuthContext'
import LandingPage from '@/components/LandingPage'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">欢迎来到 Open Speech</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <Link
            href="/chat"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            开始对话
          </Link>
          <button 
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            退出登录
          </button>
        </div>
      </div>
    </main>
  )
}
