import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 创建两个不同的 OpenAI 实例，分别用于聊天和语音服务
const chatAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000, // 设置 120 秒超时
  maxRetries: 3,  // 最大重试次数
})

const speechAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000,
  maxRetries: 3,
})

const TIMEOUT = 110000

export const runtime = 'edge' // 使用 Edge Runtime

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    // 创建一个带超时的 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
    })

    // 创建 AI 回复的 Promise
    const responsePromise = (async () => {
      // 获取 AI 回复
      const completion = await chatAI.chat.completions.create({
        model: "gpt-4o",  // 使用正确的模型名称
        messages: [{ role: "user", content: message }],
        max_tokens: 5000,  // 限制响应长度
        temperature: 0.7,
      })

      const reply = completion.choices[0].message.content

      if (!reply) {
        throw new Error('No reply from AI')
      }

      try {
        // 生成语音
        const mp3 = await speechAI.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: reply.slice(0, 500), // 进一步限制语音长度
        })

        // 获取音频数据并转换为 Base64
        const audioData = await mp3.arrayBuffer()
        const base64Audio = Buffer.from(audioData).toString('base64')

        return { audio: base64Audio, text: reply }
      } catch (speechError) {
        console.error('Speech synthesis error:', speechError)
        // 如果语音合成失败，至少返回文本
        return { text: reply }
      }
    })()

    // 使用 Promise.race 来处理超时
    const result = await Promise.race([responsePromise, timeoutPromise])
    return NextResponse.json(result)

  } catch (error) {
    console.error('Chat error:', error)
    
    // 根据错误类型返回不同的状态码和消息
    let statusCode = 500
    let message = 'Unknown error'

    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        statusCode = 504
        message = 'Request timed out'
      } else if (error.message.includes('fetch failed')) {
        statusCode = 503
        message = 'Service temporarily unavailable'
      } else {
        message = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Chat failed', 
        message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
} 