"use client"

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import MicrophonePermission from '@/components/MicrophonePermission'
import MicrophoneInput from '@/components/MicrophoneInput'
import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/types/chat'
import { Trash2, RotateCcw, Loader2 } from 'lucide-react'

const MESSAGES_PER_PAGE = 20

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 加载历史记录
  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user, page])

  // 新消息时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 路由保护
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // 加载聊天历史
  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      const { data, error, count } = await supabase
        .from('chat_histories')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1)

      if (error) throw error

      if (count) {
        setHasMore((page + 1) * MESSAGES_PER_PAGE < count)
      }

      if (page === 0) {
        setMessages(data || [])
      } else {
        const uniqueMessages = data.filter(newMsg => 
          !messages.some(existingMsg => existingMsg.id === newMsg.id)
        )
        setMessages(prev => [...prev, ...uniqueMessages])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 加载更多消息
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // 保存新消息
  const saveMessage = async (content: string, type: 'user' | 'assistant') => {
    try {
      const { data, error } = await supabase
        .from('chat_histories')
        .insert([
          {
            user_id: user?.id,
            content,
            type
          }
        ])
        .select()
        .single()

      if (error) throw error

      setMessages(prev => {
        const exists = prev.some(msg => msg.id === data.id)
        if (exists) return prev
        return [...prev, data]
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  // 删除单条消息
  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chat_histories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessages(prev => prev.filter(msg => msg.id !== id))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  // 清空所有消息
  const clearAllMessages = async () => {
    if (!confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) return

    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('chat_histories')
        .delete()
        .eq('user_id', user?.id)

      if (error) throw error

      setMessages([])
      setPage(0)
      setHasMore(false)
    } catch (error) {
      console.error('Error clearing messages:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 处理新的语音输入
  const handleTranscription = async (text: string) => {
    await saveMessage(text, 'user')
  }

  // 处理 AI 回复
  const handleAIResponse = async (text: string) => {
    await saveMessage(text, 'assistant')
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 操作按钮 */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <button
            onClick={loadMore}
            disabled={!hasMore || isLoading}
            className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
            <span className="ml-2">加载更多</span>
          </button>
          <button
            onClick={clearAllMessages}
            disabled={isDeleting || messages.length === 0}
            className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center"
          >
            <Trash2 className="w-5 h-5" />
            <span className="ml-2">清空记录</span>
          </button>
        </div>

        {!hasPermission ? (
          <MicrophonePermission onPermissionGranted={() => setHasPermission(true)} />
        ) : (
          <>
            {/* 聊天历史记录 */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-white rounded-lg shadow">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`group relative p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-100 ml-auto max-w-[80%]'
                      : 'bg-gray-100 mr-auto max-w-[80%]'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{new Date(message.created_at).toLocaleString()}</span>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 更新语音输入组件 */}
            <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow">
              <MicrophoneInput 
                onTranscription={handleTranscription}
                onAIResponse={handleAIResponse}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
} 