"use client"

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">
          AI 语音助手，让交流更智能
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          使用先进的 AI 技术，让您的语音交互体验更自然、更高效。无论是工作还是学习，我们都能为您提供智能的对话支持。
        </p>
        {!user && (
          <Link
            href="/auth?mode=signup"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            立即开始使用
          </Link>
        )}
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">实时语音识别</h3>
            <p className="text-gray-600">
              采用先进的语音识别技术，准确快速地将您的语音转换为文字。
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">智能对话系统</h3>
            <p className="text-gray-600">
              基于 OpenAI 技术，提供智能、自然的对话体验，理解上下文，给出准确回应。
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">语音合成</h3>
            <p className="text-gray-600">
              将 AI 回复转换为自然流畅的语音，提供更人性化的交互体验。
            </p>
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">使用流程</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-4">1</div>
              <h3 className="font-semibold mb-2">注册账号</h3>
              <p className="text-gray-600">简单快速的注册流程，立即开始使用</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-4">2</div>
              <h3 className="font-semibold mb-2">授权麦克风</h3>
              <p className="text-gray-600">一键授权，保护您的隐私安全</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-4">3</div>
              <h3 className="font-semibold mb-2">开始对话</h3>
              <p className="text-gray-600">通过语音与 AI 助手进行自然对话</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-4">4</div>
              <h3 className="font-semibold mb-2">获取回答</h3>
              <p className="text-gray-600">接收清晰的语音回复和文字记录</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">准备好开始了吗？</h2>
          <p className="text-xl mb-8">
            加入我们，体验下一代的 AI 语音助手
          </p>
          {!user && (
            <Link
              href="/auth?mode=signup"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              免费注册
            </Link>
          )}
        </div>
      </div>
    </div>
  )
} 