"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthError } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 从 URL 参数中读取 mode
    const mode = searchParams.get('mode')
    if (mode === 'signup') {
      setIsLogin(false)
    }
    setIsInitialized(true)
  }, [searchParams])

  if (!isInitialized) {
    return <div>Loading...</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        router.push('/')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              confirm: false
            }
          }
        })
        if (error) throw error

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (loginError) throw loginError

        router.push('/')
      }
    } catch (error) {
      if (error instanceof AuthError) {
        setError(error.message)
      } else {
        setError('发生未知错误')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? '登录' : '注册'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        {isLogin ? '还没有账号?' : '已有账号?'}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:text-blue-700 ml-1"
        >
          {isLogin ? '注册' : '登录'}
        </button>
      </p>
    </div>
  )
} 